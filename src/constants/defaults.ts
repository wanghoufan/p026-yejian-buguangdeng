import type { FillLightState } from '../types/fillLight';

export const PERSISTENCE_KEY = 'fill-light:v1:last-state';

export const DEFAULT_STATE: FillLightState = {
  targetColor: '#FFF2E2',
  colorSource: 'preset',
  presetId: 'warm-white',
  colorIntensity: 1,
  screenBrightness: 1,
  activeTab: 'preset',
  isSheetOpen: false,
  isHydrated: false,
};
