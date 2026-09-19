import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { FillLightAction, FillLightState } from '../types/fillLight';
import { fillLightReducer, initialState } from './fillLightReducer';
import { displayColor } from '../utils/color';
import { useFillLightPersistence } from '../hooks/useFillLightPersistence';

type Ctx = {
  state: FillLightState;
  display: string;
  dispatch: React.Dispatch<FillLightAction>;
  persistNow: () => void;
};

const FillLightContext = createContext<Ctx | null>(null);

export function FillLightProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(fillLightReducer, initialState);
  const { load, saveNow, saveDebounced } = useFillLightPersistence();
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // T053: hydrate 但强制 Sheet Closed（reducer HYDRATE 分支强制 isSheetOpen=false）。
  useEffect(() => {
    let alive = true;
    void load().then((persisted) => {
      if (alive && persisted) dispatch({ type: 'HYDRATE', state: persisted });
      else if (alive) dispatch({ type: 'HYDRATE', state: {} });
    });
    return () => {
      alive = false;
    };
  }, [load]);

  // T054: 预设/Tab/持久字段变化 debounce 自动持久化（end 事件由调用方立即 saveNow）。
  const hydrated = state.isHydrated;
  useEffect(() => {
    if (!hydrated) return;
    saveDebounced(stateRef.current, 300);
  }, [hydrated, state.targetColor, state.colorSource, state.presetId, state.colorIntensity, state.screenBrightness, state.activeTab, saveDebounced]);

  // 稳定身份：ControlSheet 的 useCallback 依赖它，不稳定会让 Slider 回调每渲染换新（P0 拖动断续）。
  const persistNow = useCallback(() => {
    void saveNow(stateRef.current);
  }, [saveNow]);

  const value = useMemo<Ctx>(
    () => ({ state, dispatch, display: displayColor(state.targetColor, state.colorIntensity), persistNow }),
    [state, dispatch, persistNow],
  );
  return <FillLightContext.Provider value={value}>{children}</FillLightContext.Provider>;
}

export function useFillLight(): Ctx {
  const ctx = useContext(FillLightContext);
  if (!ctx) throw new Error('useFillLight must be used within FillLightProvider');
  return ctx;
}
