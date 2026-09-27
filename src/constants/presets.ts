import type { FillLightPreset } from '../types/fillLight';

// 显示名不进 PRESETS：按 id 到词典查 presets.<id>，语言切换不改动补光数据。
export const PRESETS: FillLightPreset[] = [
  { id: 'warm-white', color: '#FFF2E2' },
  { id: 'neutral-white', color: '#FFFFFF' },
  { id: 'cool-white', color: '#EEF5FF' },
  { id: 'cream', color: '#FFE9C7' },
  { id: 'peach-pink', color: '#FFD2CE' },
  { id: 'rose-pink', color: '#FFB3C7' },
  { id: 'ambient-purple', color: '#C9B6FF' },
  { id: 'ice-blue', color: '#BBD7FF' },
];
