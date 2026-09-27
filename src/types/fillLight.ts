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

// 预设只保留稳定 id 与颜色；显示名按 id 到 i18n 词典查（presets.<id>）。
export type FillLightPreset = {
  id: string;
  color: string;
};

export type FillLightAction =
  | { type: 'HYDRATE'; state: Partial<FillLightState> }
  | { type: 'SET_TARGET_COLOR'; targetColor: string; colorSource: ColorSource; presetId: string | null }
  | { type: 'SET_COLOR_INTENSITY'; colorIntensity: number }
  | { type: 'SET_SCREEN_BRIGHTNESS'; screenBrightness: number }
  | { type: 'SET_ACTIVE_TAB'; activeTab: ControlTab }
  | { type: 'SET_SHEET_OPEN'; isSheetOpen: boolean }
  | { type: 'RESET_DEFAULTS' };
