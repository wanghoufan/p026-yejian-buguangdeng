import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Brightness from 'expo-brightness';

// P0 真机闪动：拖动时 touchmove 每像素都改 brightness，逐次直调原生会让系统亮度抽搐。
// 原生调用节流窗口（ms）：窗口内只保留最后一次（trailing），窗口结束补发。
export const APPLY_THROTTLE_MS = 80;

// T045-T049: Activity-only 亮度。只用应用内 setter，
// 离开应用 restore，返回重应用。禁 system-wide setter。
export function useAppBrightness(brightness: number) {
  const valueRef = useRef(brightness);
  useEffect(() => {
    valueRef.current = brightness;
  }, [brightness]);
  const [supported, setSupported] = useState(true);

  // 单调序号：进行中的 apply 与更新的值冲突时，旧结果作废（以后者为准）。
  const seqRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<number | null>(null);

  const apply = useCallback(async (v: number) => {
    const seq = ++seqRef.current;
    try {
      await Brightness.setBrightnessAsync(v);
    } catch {
      // 只有最新一次调用的失败才算数（旧的已被更新的值取代）
      if (seq === seqRef.current) setSupported(false);
    }
  }, []);

  // 节流器：窗口内多次变化只调最后一次，trailing 必达（含 touchEnd 后的最终值）。
  const applyThrottled = useCallback(
    (v: number) => {
      pendingRef.current = v;
      if (timerRef.current !== null) return;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const next = pendingRef.current;
        pendingRef.current = null;
        if (next !== null) void apply(next);
      }, APPLY_THROTTLE_MS);
    },
    [apply],
  );

  useEffect(() => {
    apply(valueRef.current);
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') {
        apply(valueRef.current);
      } else if (s === 'background' || s === 'inactive') {
        // T048: 交还系统控制
        Brightness.restoreSystemBrightnessAsync().catch(() => setSupported(false));
      }
    });
    return () => sub.remove();
  }, [apply]);

  // brightness 变化节流应用（T047；apply 内 setSupported 仅走异常路径）
  useEffect(() => {
    if (AppState.currentState === 'active' || AppState.currentState === 'unknown') {
      applyThrottled(brightness);
    }
  }, [brightness, applyThrottled]);

  // 卸载清掉未发出的 trailing，避免卸载后仍调原生。
  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      pendingRef.current = null;
    },
    [],
  );

  return { apply, supported };
}
