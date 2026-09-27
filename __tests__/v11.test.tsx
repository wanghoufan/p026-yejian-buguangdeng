import { act, create } from 'react-test-renderer';
import { Dimensions, Text } from 'react-native';
import ControlSheet from '../src/components/ControlSheet';
import ColorWheelPanel from '../src/components/ColorWheelPanel';
import { initialState } from '../src/state/fillLightReducer';
import type { FillLightState } from '../src/types/fillLight';

const mockDispatch = jest.fn();
const mockPersistNow = jest.fn();
const mockPush = jest.fn();
const mockState: FillLightState = { ...initialState, isSheetOpen: true, isHydrated: true };

jest.mock('../src/state/FillLightContext', () => ({
  useFillLight: () => ({ state: mockState, dispatch: mockDispatch, persistNow: mockPersistNow, display: '#FFFFFF' }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => false }),
}));

// 用真实词典（zh-CN）喂 t，键名写错会在断言里直接暴露。
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

describe('V1.1 sheet layout and auto close', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockDispatch.mockClear();
    mockPersistNow.mockClear();
    mockPush.mockClear();
    Object.assign(mockState, { ...initialState, isSheetOpen: true, isHydrated: true });
  });

  afterEach(() => jest.useRealTimers());

  test('null layout events do not crash or enable scrolling', () => {
    mockState.activeTab = 'wheel';
    let tree!: ReturnType<typeof create>;
    act(() => { tree = create(<ControlSheet />); });
    const scroll = tree.root.findByProps({ testID: 'sheet-scroll' });

    expect(() => {
      act(() => {
        scroll.props.onLayout({ nativeEvent: null });
        scroll.props.onContentSizeChange(0, null);
      });
    }).not.toThrow();
    expect(scroll.props.scrollEnabled).toBe(false);
    act(() => tree.unmount());
  });

  test('旋转重渲染保持颜色、强度、亮度与 Tab', () => {
    const before = {
      targetColor: '#12ABEF',
      colorIntensity: 0.35,
      screenBrightness: 0.72,
      activeTab: 'wheel' as const,
    };
    Object.assign(mockState, before);

    const originalGet = Dimensions.get;
    let window = { width: 390, height: 844, scale: 1, fontScale: 1 };
    jest.spyOn(Dimensions, 'get').mockImplementation((key) => key === 'window' ? window : originalGet(key));

    let tree!: ReturnType<typeof create>;
    try {
      act(() => { tree = create(<ControlSheet />); });
      const beforeRender = {
        targetColor: tree.root.findByType(ColorWheelPanel).props.color,
        colorIntensity: tree.root.findByProps({ testID: 'intensity-slider' }).props.value,
        screenBrightness: tree.root.findByProps({ testID: 'brightness-slider' }).props.value,
        activeTab: mockState.activeTab,
      };

      window = { width: 844, height: 390, scale: 1, fontScale: 1 };
      act(() => { tree.update(<ControlSheet />); });

      expect({
        targetColor: tree.root.findByType(ColorWheelPanel).props.color,
        colorIntensity: tree.root.findByProps({ testID: 'intensity-slider' }).props.value,
        screenBrightness: tree.root.findByProps({ testID: 'brightness-slider' }).props.value,
        activeTab: mockState.activeTab,
      }).toEqual(beforeRender);
    } finally {
      tree?.unmount();
      jest.restoreAllMocks();
    }
  });

  test('resets after interaction and pauses while dragging', () => {
    let tree!: ReturnType<typeof create>;
    act(() => { tree = create(<ControlSheet />); });
    const sheet = tree.root.findByProps({ testID: 'control-sheet' });
    const dragZone = tree.root.findByProps({ testID: 'sheet-drag-zone' });
    const preset = tree.root.findByProps({ testID: 'preset-warm-white' });

    act(() => jest.advanceTimersByTime(4_999));
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'SET_SHEET_OPEN', isSheetOpen: false });
    act(() => preset.props.onPress());
    act(() => jest.advanceTimersByTime(4_999));
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'SET_SHEET_OPEN', isSheetOpen: false });
    act(() => dragZone.props.onTouchStart());
    act(() => jest.advanceTimersByTime(5_001));
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'SET_SHEET_OPEN', isSheetOpen: false });
    act(() => dragZone.props.onTouchEnd());
    act(() => jest.advanceTimersByTime(5_000));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_SHEET_OPEN', isSheetOpen: false });
    expect(sheet.props.pointerEvents).toBe('auto');
    act(() => tree.unmount());
  });

  test('pauses auto close while scrolling and restarts after release', () => {
    mockState.activeTab = 'wheel';
    let tree!: ReturnType<typeof create>;
    act(() => { tree = create(<ControlSheet />); });
    const scroll = tree.root.findByProps({ testID: 'sheet-scroll' });

    act(() => scroll.props.onTouchStart());
    act(() => jest.advanceTimersByTime(5_001));
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'SET_SHEET_OPEN', isSheetOpen: false });
    act(() => scroll.props.onTouchEnd());
    act(() => jest.advanceTimersByTime(4_999));
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'SET_SHEET_OPEN', isSheetOpen: false });
    act(() => jest.advanceTimersByTime(1));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_SHEET_OPEN', isSheetOpen: false });
    act(() => tree.unmount());
  });

  // F2/F3 回归：Sheet 内固定文案走词典，设置入口在固定 footer（不随内容滚动消失）。
  test('Sheet 固定文案取词典，设置入口关闭 Sheet 并跳转设置页', () => {
    mockState.activeTab = 'preset';
    let tree!: ReturnType<typeof create>;
    act(() => { tree = create(<ControlSheet />); });

    const texts = tree.root.findAllByType(Text).map((n) => n.props.children);
    for (const expected of ['预设颜色', '色轮', '颜色强度', '屏幕亮度', '恢复暖白默认', '设置']) {
      expect(texts).toContain(expected);
    }

    const entry = tree.root.findByProps({ testID: 'open-settings' });
    expect(entry.findAllByType(Text)[0].props.children).toBe('设置');
    act(() => entry.props.onPress());
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_SHEET_OPEN', isSheetOpen: false });
    expect(mockPush).toHaveBeenCalledWith('/settings');

    act(() => tree.unmount());
  });
});
