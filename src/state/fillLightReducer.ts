import { DEFAULT_STATE } from '../constants/defaults';
import type { FillLightAction, FillLightState } from '../types/fillLight';
import { clamp01 } from '../utils/color';

export const initialState: FillLightState = { ...DEFAULT_STATE };

export function fillLightReducer(state: FillLightState, action: FillLightAction): FillLightState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.state, isSheetOpen: false, isHydrated: true };
    case 'SET_TARGET_COLOR':
      return { ...state, targetColor: action.targetColor, colorSource: action.colorSource, presetId: action.presetId };
    case 'SET_COLOR_INTENSITY':
      return { ...state, colorIntensity: clamp01(action.colorIntensity) };
    case 'SET_SCREEN_BRIGHTNESS':
      return { ...state, screenBrightness: clamp01(action.screenBrightness) };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.activeTab };
    case 'SET_SHEET_OPEN':
      return { ...state, isSheetOpen: action.isSheetOpen };
    case 'RESET_DEFAULTS':
      return {
        ...state,
        ...DEFAULT_STATE,
        isHydrated: state.isHydrated,
      };
    default:
      return state;
  }
}
