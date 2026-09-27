import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { Dimensions, PanResponder, StyleSheet, View } from 'react-native';
import ColorWheelPanel from '../src/components/ColorWheelPanel';

// T039–T041 行为回归：HSV 色盘贴图 + PanResponder 的 H/S 映射与「不回写」契约。
const SIZE = Math.min(200, Math.max(180, Dimensions.get('window').width - 120));
const RADIUS = SIZE / 2;

// 去掉 PanResponder 的手势包装层，直接调用组件自己的回调做行为验证。
jest.spyOn(PanResponder, 'create').mockImplementation((config: any) => ({ panHandlers: config }) as any);

// 真实词典 + 可切换 locale：验证无障碍标签确实走词条而非硬编码。
let mockLocale: 'zh-CN' | 'en' = 'zh-CN';
jest.mock('../src/hooks/useLanguage', () => {
  const { translate } = jest.requireActual('../src/i18n');
  return {
    useLanguage: () => ({
      locale: mockLocale,
      setLocale: jest.fn(),
      t: (key: string) => translate(mockLocale, key),
      isReady: true,
      saveError: false,
      retrySave: jest.fn(),
    }),
  };
});

function mount(color: string, onChange = jest.fn(), onEnd = jest.fn()) {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(<ColorWheelPanel color={color} onChange={onChange} onEnd={onEnd} />);
  });
  return { tree, wheel: tree.root.findByProps({ testID: 'wheel-ring' }), onChange, onEnd };
}

const touch = (x: number, y: number) => ({ nativeEvent: { locationX: x, locationY: y } } as any);

const indicatorStyle = (tree: ReactTestRenderer) =>
  tree.root
    .findAllByType(View)
    .map((n) => StyleSheet.flatten(n.props.style) as any)
    .find((s) => s && s.position === 'absolute' && 'left' in s) as { left: number; top: number };

describe('ColorWheelPanel (T039–T041)', () => {
  test('挂载不回写：不触发 onChange / onEnd', () => {
    const { onChange, onEnd } = mount('#FFF2E2');
    expect(onChange).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  test('真实触摸：拖动实时 onChange，release 才 onEnd（一次）', () => {
    const { wheel, onChange, onEnd } = mount('#FFF2E2');
    act(() => wheel.props.onPanResponderGrant(touch(RADIUS + RADIUS - 2, RADIUS)));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onEnd).not.toHaveBeenCalled();

    act(() => wheel.props.onPanResponderMove(touch(RADIUS, RADIUS + RADIUS - 2)));
    expect(onChange).toHaveBeenCalledTimes(2);

    act(() => wheel.props.onPanResponderRelease());
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  test('H/S 映射：右边缘=红、下边缘=黄绿（H 顺时针、边缘 S=1）', () => {
    const { wheel, onChange } = mount('#FFF2E2');
    act(() => wheel.props.onPanResponderGrant(touch(RADIUS + RADIUS - 2, RADIUS)));
    const right = onChange.mock.calls[0][0] as string;
    expect(right.slice(0, 3)).toBe('#FF');
    expect(parseInt(right.slice(3, 5), 16)).toBeLessThan(12);
    expect(parseInt(right.slice(5, 7), 16)).toBeLessThan(12);

    act(() => wheel.props.onPanResponderMove(touch(RADIUS, RADIUS + RADIUS - 2)));
    const bottom = onChange.mock.calls[1][0] as string;
    expect(parseInt(bottom.slice(1, 3), 16)).toBeGreaterThan(120);
    expect(bottom.slice(3, 5)).toBe('FF');
    expect(parseInt(bottom.slice(5, 7), 16)).toBeLessThan(12);
  });

  test('半径中点 = 饱和度 0.5', () => {
    const { wheel, onChange } = mount('#FFF2E2');
    act(() => wheel.props.onPanResponderGrant(touch(RADIUS + RADIUS / 2, RADIUS)));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBe('#FF8080'); // H=0, S=0.5, V=1
  });

  test('圆心死区 / 圆外透明角：不改色', () => {
    const { wheel, onChange } = mount('#FFF2E2');
    act(() => wheel.props.onPanResponderGrant(touch(RADIUS, RADIUS)));
    act(() => wheel.props.onPanResponderGrant(touch(4, 4)));
    expect(onChange).not.toHaveBeenCalled();
  });

  test('拖出圆外：贴边继续跟手', () => {
    const { wheel, onChange } = mount('#FFF2E2');
    act(() => wheel.props.onPanResponderGrant(touch(RADIUS + 40, RADIUS)));
    act(() => wheel.props.onPanResponderMove(touch(RADIUS + RADIUS + 60, RADIUS)));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect((onChange.mock.calls[1][0] as string).slice(0, 3)).toBe('#FF');
  });

  test('indicator 落在当前色的 HS 位置（#FF0000 → 右缘，夹在框内）', () => {
    const { tree, onChange } = mount('#FF0000');
    expect(onChange).not.toHaveBeenCalled();
    const s = indicatorStyle(tree);
    expect(s.left).toBeCloseTo(SIZE - 20, 0);
    expect(s.top).toBeCloseTo(RADIUS - 10, 0);
  });

  test('#FFFFFF → indicator 在圆心，且不写回', () => {
    const { tree, onChange } = mount('#FFFFFF');
    expect(onChange).not.toHaveBeenCalled();
    const s = indicatorStyle(tree);
    expect(s.left).toBeCloseTo(RADIUS - 10, 0);
    expect(s.top).toBeCloseTo(RADIUS - 10, 0);
  });

  test('外部改色（预设/hydrate）→ indicator 跟随，且不回写', () => {
    const onChange = jest.fn();
    const onEnd = jest.fn();
    let tree!: ReactTestRenderer;
    act(() => {
      tree = create(<ColorWheelPanel color="#FFFFFF" onChange={onChange} onEnd={onEnd} />);
    });
    act(() => {
      tree.update(<ColorWheelPanel color="#FF0000" onChange={onChange} onEnd={onEnd} />);
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
    expect(indicatorStyle(tree).left).toBeCloseTo(SIZE - 20, 0);
  });

  test('无障碍名称取词条且随语言切换', () => {
    mockLocale = 'zh-CN';
    const onChange = jest.fn();
    let tree!: ReactTestRenderer;
    act(() => { tree = create(<ColorWheelPanel color="#FFF2E2" onChange={onChange} />); });
    expect(tree.root.findByProps({ testID: 'wheel-ring' }).props.accessibilityLabel).toBe('色相色盘');

    mockLocale = 'en';
    act(() => { tree.update(<ColorWheelPanel color="#FFF2E2" onChange={onChange} />); });
    expect(tree.root.findByProps({ testID: 'wheel-ring' }).props.accessibilityLabel).toBe('Hue color wheel');

    mockLocale = 'zh-CN';
  });
});
