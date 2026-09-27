import { act, create, ReactTestRenderer } from 'react-test-renderer';
import LabeledSlider from '../src/components/LabeledSlider';
import ControlSheet, { DISPATCH_THROTTLE_MS } from '../src/components/ControlSheet';
import { createTrailingThrottle } from '../src/utils/throttle';
import type { FillLightState } from '../src/types/fillLight';

const mockDispatch = jest.fn();
const mockPersistNow = jest.fn();
const mockState: FillLightState = {
  targetColor: '#FFF2E2',
  colorSource: 'preset',
  presetId: 'warm',
  colorIntensity: 0.5,
  screenBrightness: 0.5,
  activeTab: 'preset',
  isSheetOpen: true,
  isHydrated: true,
};

jest.mock('../src/state/FillLightContext', () => ({
  useFillLight: () => ({
    state: mockState,
    dispatch: mockDispatch,
    persistNow: mockPersistNow,
    display: '#FFF2E2',
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => false }),
}));

jest.mock('../src/hooks/useLanguage', () => {
  const { translate } = jest.requireActual('../src/i18n');
  return {
    useLanguage: () => ({
      locale: 'zh-CN',
      setLocale: jest.fn(),
      t: (key: string) => translate('zh-CN', key),
      isReady: true,
      saveError: false,
      retrySave: jest.fn(),
    }),
  };
});

const touch = (locationX: number) => ({ nativeEvent: { locationX } } as any);
const layout = (width: number) => ({ nativeEvent: { layout: { width } } } as any);
// RN 0.86 下 Pressable 的类型身份与测试树不一致，按「带触摸处理的节点」定位（最外层即组件元素）。
const pressable = (node: { findAll: (f: (n: any) => boolean) => any[] }) =>
  node.findAll((n) => typeof n.props?.onTouchMove === 'function')[0];

// P0 拖动断续：拖动中 dispatch 必须被 trailing 节流压住，且 touchEnd 最终值必达。
describe('createTrailingThrottle (P0 拖动节流)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('窗口内高频调用只落地一次，trailing 补发最后一次的值', () => {
    const fn = jest.fn();
    const t = createTrailingThrottle<[number]>(fn, DISPATCH_THROTTLE_MS);

    for (let i = 1; i <= 20; i++) t.call(i);
    expect(fn).not.toHaveBeenCalled(); // 窗口内不逐次直发

    act(() => jest.advanceTimersByTime(DISPATCH_THROTTLE_MS));
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(20); // 最终值正确
  });

  test('flush 同步补发挂起值，且不会与定时器重复发送', () => {
    const fn = jest.fn();
    const t = createTrailingThrottle<[number]>(fn, DISPATCH_THROTTLE_MS);

    t.call(0.3);
    t.call(0.9);
    t.flush();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(0.9);

    act(() => jest.advanceTimersByTime(DISPATCH_THROTTLE_MS * 3));
    expect(fn).toHaveBeenCalledTimes(1); // 旧定时器已取消，无陈旧值回写
  });

  test('无挂起时 flush 不发；cancel 丢弃挂起值', () => {
    const fn = jest.fn();
    const t = createTrailingThrottle<[number]>(fn, DISPATCH_THROTTLE_MS);

    t.flush();
    expect(fn).not.toHaveBeenCalled();

    t.call(0.4);
    t.cancel();
    act(() => jest.advanceTimersByTime(DISPATCH_THROTTLE_MS * 3));
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('LabeledSlider 手势稳定性 (P0 responder 丢失)', () => {
  test('父组件换回调身份，触摸处理函数身份不变且调用最新回调', () => {
    const first = jest.fn();
    const latest = jest.fn();
    let tree!: ReactTestRenderer;

    act(() => {
      tree = create(<LabeledSlider label="颜色强度" value={0.5} onValueChange={first} />);
    });
    act(() => {
      pressable(tree.root).props.onLayout(layout(200));
    });
    const handlerBefore = pressable(tree.root).props.onTouchMove;

    act(() => {
      tree.update(<LabeledSlider label="颜色强度" value={0.5} onValueChange={latest} />);
    });
    const handlerAfter = pressable(tree.root).props.onTouchMove;

    expect(handlerAfter).toBe(handlerBefore); // 身份稳定 → 不重建 → responder 不丢

    act(() => pressable(tree.root).props.onTouchStart(touch(0)));
    act(() => pressable(tree.root).props.onTouchMove(touch(100)));
    expect(latest).toHaveBeenLastCalledWith(0.5); // 读到最新回调，无闭包过期
    expect(first).not.toHaveBeenCalled(); // 旧回调身份不再被引用
  });
});

describe('ControlSheet 拖动节流接线 (P0)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockDispatch.mockClear();
    mockPersistNow.mockClear();
  });
  afterEach(() => jest.useRealTimers());

  function mountSlider(testID: string) {
    let tree!: ReactTestRenderer;
    act(() => {
      tree = create(<ControlSheet />);
    });
    const slider = tree.root.findByProps({ testID });
    const press = pressable(slider);
    act(() => press.props.onLayout(layout(200)));
    return { tree, press };
  }

  test('高频拖动：dispatch 次数被压住，touchEnd 最终值同步落地', () => {
    const { tree, press } = mountSlider('intensity-slider');
    mockDispatch.mockClear(); // 只统计拖动窗口

    act(() => press.props.onTouchStart(touch(0)));
    for (let i = 1; i <= 10; i++) {
      act(() => press.props.onTouchMove(touch(i * 20))); // 0.1 → 1.0
    }
    expect(mockDispatch.mock.calls.length).toBeLessThanOrEqual(2); // 每帧不再直发
    expect(mockDispatch.mock.calls.length).toBeLessThan(10);

    act(() => press.props.onTouchEnd(touch(200)));
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: 'SET_COLOR_INTENSITY', colorIntensity: 1 }); // flush 同步必达
    expect(mockPersistNow).toHaveBeenCalledTimes(1);

    const after = mockDispatch.mock.calls.length;
    act(() => jest.advanceTimersByTime(DISPATCH_THROTTLE_MS * 3));
    expect(mockDispatch.mock.calls.length).toBe(after); // 无陈旧 trailing 回写

    act(() => tree.unmount());
  });

  test('亮度 Slider 走 SET_SCREEN_BRIGHTNESS，且拖动中调用被压住', () => {
    const { tree, press } = mountSlider('brightness-slider');
    mockDispatch.mockClear();

    act(() => press.props.onTouchStart(touch(0)));
    for (let i = 1; i <= 10; i++) {
      act(() => press.props.onTouchMove(touch(i * 20)));
    }
    expect(mockDispatch.mock.calls.length).toBeLessThanOrEqual(2);

    act(() => press.props.onTouchEnd(touch(100)));
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: 'SET_SCREEN_BRIGHTNESS', screenBrightness: 0.5 });

    act(() => tree.unmount());
  });
});
