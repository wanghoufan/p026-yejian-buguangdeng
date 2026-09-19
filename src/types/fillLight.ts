export type ColorSource = 'preset' | 'custom';
export type ControlTab = 'preset' | 'wheel';

export type FillLightState = {
  targetColor: string;
  colorSource: ColorSource;
  presetId: string | null;
  colorIntensity: number;
  screenBrightness: number;
  activeTab: ControlTab;
  isSheetOpen: boolean;
  isHydrated: boolean;
};

export type FillLightPreset = {
  id: string;
  label: string;
  color: string;
};

export type FillLightAction =
  | { type: 'HYDRATE'; state: Partial<FillLightState> }
  | { type: 'SET_TARGET_COLOR'; targetColor: string; colorSource: ColorSource; presetId: string | null }
  | { type: 'SET_COLOR_INTENSITY'; colorIntensity: number }
  | { type: 'SET_SCREEN_BRIGHTNESS'; screenBrightness: number }
  | { type: 'SET_ACTIVE_TAB'; activeTab: ControlTab }
  | { type: 'SET_SHEET_OPEN'; isSheetOpen: boolean };
