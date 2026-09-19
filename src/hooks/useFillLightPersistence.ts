import { useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PERSISTENCE_KEY } from '../constants/defaults';
import type { FillLightState } from '../types/fillLight';
import { sanitizePersistedState, toPersisted, type PersistedFillLight } from '../utils/validation';

export { PERSISTENCE_KEY };
export type { PersistedFillLight };

/** T051/T054: persistence schema + key `fill-light:v1:last-state`。仅 interaction end / debounce 写。 */
export function useFillLightPersistence() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (): Promise<PersistedFillLight | null> => {
    try {
      const raw = await AsyncStorage.getItem(PERSISTENCE_KEY);
      if (!raw) return null;
      return sanitizePersistedState(JSON.parse(raw));
    } catch {
      return null;
    }
  }, []);

  const saveNow = useCallback(async (state: FillLightState | PersistedFillLight): Promise<void> => {
    try {
      const payload =
        'targetColor' in state && !('isSheetOpen' in state)
          ? sanitizePersistedState(state)
          : toPersisted(state as FillLightState);
      await AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(payload));
    } catch {
      // 本地持久化失败静默忽略，不阻塞 UI
    }
  }, []);

  /** debounce 写（Slider drag / 色轮拖动中节流，end 时调用 saveNow 立即落盘）。 */
  const saveDebounced = useCallback(
    (state: FillLightState | PersistedFillLight, ms = 300): void => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void saveNow(state);
      }, ms);
    },
    [saveNow],
  );

  return { load, saveNow, saveDebounced };
}
