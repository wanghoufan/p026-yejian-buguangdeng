import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { AppState } from 'react-native';
import * as Brightness from 'expo-brightness';
import { APPLY_THROTTLE_MS, useAppBrightness } from '../src/hooks/useAppBrightness';

jest.mock('expo-brightness', () => ({
  setBrightnessAsync: jest.fn(async () => {}),
  restoreSystemBrightnessAsync: jest.fn(async () => {}),
  getBrightnessAsync: jest.fn(async () => 0.8),
}));

const native = () => Brightness.setBrightnessAsync as jest.Mock;

function Probe({ value }: { value: number }) {
  useAppBrightness(value);
  return null;
}

// P0 真机闪动：拖动每像素改 brightness，原生调用必须节流。
describe('useAppBrightness 原生调用节流 (P0)', () => {
  let prevState: unknown;

  beforeEach(() => {
    jest.useFakeTimers();
    prevState = AppState.currentState;
    (AppState as { currentState: unknown }).currentState = 'active';
    native().mockClear();
  });

  afterEach(() => {
    (AppState as { currentState: unknown }).currentState = prevState;
    jest.useRealTimers();
  });

  test('连续 10 次同步 brightness 变化：原生调用远小于 10，且最后一次值正确', async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<Probe value={0.05} />);
    });
    native().mockClear(); // 只统计拖动这段窗口

    for (let i = 1; i <= 10; i++) {
      await act(async () => {
        tree.update(<Probe value={i / 10} />);
      });
    }
    // 窗口内不逐次直调原生（最多一次）
    expect(native().mock.calls.length).toBeLessThanOrEqual(2);

    // trailing 必达：窗口结束后补发最后一个值
    await act(async () => {
      jest.advanceTimersByTime(APPLY_THROTTLE_MS * 3);
    });

    const calls = native().mock.calls;
    expect(calls.length).toBeLessThan(10);
    expect(calls[calls.length - 1][0]).toBeCloseTo(1, 5);

    act(() => tree.unmount());
  });

  test('跨窗口的后续变化仍会落地新值（节流不吞最后一次）', async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<Probe value={0.2} />);
    });
    native().mockClear();

    await act(async () => {
      tree.update(<Probe value={0.4} />);
      tree.update(<Probe value={0.6} />);
    });
    await act(async () => {
      jest.advanceTimersByTime(APPLY_THROTTLE_MS);
    });
    expect(native().mock.calls[native().mock.calls.length - 1][0]).toBeCloseTo(0.6, 5);

    await act(async () => {
      tree.update(<Probe value={0.9} />);
    });
    await act(async () => {
      jest.advanceTimersByTime(APPLY_THROTTLE_MS);
    });
    expect(native().mock.calls[native().mock.calls.length - 1][0]).toBeCloseTo(0.9, 5);

    act(() => tree.unmount());
  });
});
