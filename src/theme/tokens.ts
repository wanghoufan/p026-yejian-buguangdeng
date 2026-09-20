export const ui = {
  accent: '#4C8DFF',
  textPrimary: '#14213A',
  textSecondary: 'rgba(20,33,58,0.62)',
  glassBg: 'rgba(248,252,255,0.76)',
  glassBorder: 'rgba(255,255,255,0.72)',
  inactivePill: 'rgba(255,255,255,0.36)',
  activePill: 'rgba(255,255,255,0.90)',
  trackInactive: 'rgba(35,64,96,0.16)',
  shadow: 'rgba(25,45,75,0.18)',
  dragHandle: 'rgba(20,33,58,0.18)',
} as const;

export const radius = {
  sheetTop: 28,
  segmented: 22,
  preset: 999,
  thumb: 999,
  dragHandle: 999,
} as const;

export const spacing = {
  screenPadding: 20,
  sheetHorizontal: 20,
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
} as const;

export const typography = {
  tab: { fontSize: 15, fontWeight: '500' as const },
  presetLabel: { fontSize: 12, fontWeight: '400' as const },
  sliderLabel: { fontSize: 14, fontWeight: '500' as const },
  sliderValue: { fontSize: 13, fontWeight: '500' as const },
} as const;

export const sheet = {
  heightRatio: 0.46,
  minHeight: 340,
  maxHeight: 420,
} as const;

export function clampSheetHeight(screenHeight: number): number {
  const target = screenHeight * sheet.heightRatio;
  return Math.min(sheet.maxHeight, Math.max(260, Math.min(target, screenHeight - 12)));
}

export const motion = {
  sheetOpenMs: 220,
  sheetCloseMs: 200,
  tabIndicatorMs: 160,
  presetSelectionMs: 120,
} as const;

// T008 图标规范：线性图标（outline），统一 2dp 线宽、圆端点；
// 禁止新增风格；实现层仅使用 RN 内置（Text glyph / View 绘制），不引入新图标依赖。
// 允许的 glyph：预设=◉/● 风格圆点由色块承担，色轮=◐，灯泡=☀/💡文字 glyph（白色）。
export const icons = {
  style: 'linear-outline',
  strokeWidth: 2,
  glyphs: { preset: '▦', wheel: '◐', lightSource: '●' },
} as const;
