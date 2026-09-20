import { act, create } from 'react-test-renderer';
import ControlSheet from '../src/components/ControlSheet';
import { initialState } from '../src/state/fillLightReducer';
import type { FillLightState } from '../src/types/fillLight';

// T-V1.1-03 返工自证：两 Tab 共用同一 ScrollView，视口高度与内容高度互不覆盖。
// 旧实现按 tab 打标并互相清零 → 切 Tab/重布局后 scrollEnabled 恒 false（横屏预设页滑不动）。

const mockDispatch = jest.fn();
const mockPersistNow = jest.fn();
const mockState: FillLightState = { ...initialState, isSheetOpen: true, isHydrated: true };

jest.mock('../src/state/FillLightContext', () => ({
  useFillLight: () => ({ state: mockState, dispatch: mockDispatch, persistNow: mockPersistNow, display: '#FFFFFF' }),
}));

type Tree = ReturnType<typeof create>;

function scrollOf(tree: Tree) {
  return tree.root.findByProps({ testID: 'sheet-scroll' });
}

function driveLayout(tree: Tree, height: number): boolean {
  act(() => {
    scrollOf(tree).props.onLayout({ nativeEvent: { layout: { width: 320, height } } });
  });
  return scrollOf(tree).props.scrollEnabled as boolean;
}

function driveContent(tree: Tree, height: number): boolean {
  act(() => {
    scrollOf(tree).props.onContentSizeChange(320, height);
  });
  return scrollOf(tree).props.scrollEnabled as boolean;
}

describe('T-V1.1-03 sheet scroll measures viewport/content independently', () => {
  let tree: Tree | null = null;

  beforeEach(() => {
    jest.useFakeTimers();
    mockDispatch.mockClear();
    mockPersistNow.mockClear();
    Object.assign(mockState, { ...initialState, isSheetOpen: true, isHydrated: true, activeTab: 'preset' });
  });

  afterEach(() => {
    if (tree) act(() => tree?.unmount());
    tree = null;
    jest.useRealTimers();
  });

  test('小视口 + 大内容 → scrollEnabled true；内容未测到前不误开', () => {
    tree = mountSheet();
    const t = tree;
    expect(driveLayout(t, 260)).toBe(false);
    expect(driveContent(t, 900)).toBe(true);
  });

  test('内容小于视口 → scrollEnabled false（竖屏不位移、不回弹）', () => {
    tree = mountSheet();
    const t = tree;
    driveLayout(t, 400);
    expect(driveContent(t, 200)).toBe(false);
  });

  test('切 Tab 后仅收到 onLayout，不得清掉已测内容高度', () => {
    tree = mountSheet();
    const t = tree;
    driveLayout(t, 260);
    expect(driveContent(t, 900)).toBe(true);

    mockState.activeTab = 'wheel';
    act(() => { t.update(<ControlSheet />); });
    // 同一 ScrollView：仅重报视口，不得把 contentH 清 0（旧代码此处得 false）
    expect(driveLayout(t, 260)).toBe(true);
    expect(driveContent(t, 600)).toBe(true);

    mockState.activeTab = 'preset';
    act(() => { t.update(<ControlSheet />); });
    driveLayout(t, 260);
    expect(driveContent(t, 900)).toBe(true);
    expect(driveContent(t, 200)).toBe(false);
  });
});

function mountSheet(): Tree {
  let tree!: Tree;
  act(() => { tree = create(<ControlSheet />); });
  return tree;
}
