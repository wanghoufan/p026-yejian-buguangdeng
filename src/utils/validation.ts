import { DEFAULT_STATE, PERSISTENCE_KEY } from '../constants/defaults';
import type { FillLightState } from '../types/fillLight';
import { clamp01 } from './color';

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function isHex(v: unknown): v is string {
  return typeof v === 'string' && HEX_RE.test(v);
}

function toNum(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return clamp01(n);
}

export type PersistedFillLight = Pick<
  FillLightState,
  'targetColor' | 'colorSource' | 'presetId' | 'colorIntensity' | 'screenBrightness' | 'activeTab'
>;

/** T052: 校验 + 默认回退。任何非法字段回退到 DEFAULT_STATE 对应字段；整体非法输入回退默认。 */
export function sanitizePersistedState(raw: unknown): PersistedFillLight {
  const d = DEFAULT_STATE;
  if (typeof raw !== 'object' || raw === null) {
    return {
      targetColor: d.targetColor,
      colorSource: d.colorSource,
      presetId: d.presetId,
      colorIntensity: d.colorIntensity,
      screenBrightness: d.screenBrightness,
      activeTab: d.activeTab,
    };
  }
  const r = raw as Record<string, unknown>;
  const colorSource = r.colorSource === 'custom' || r.colorSource === 'preset' ? r.colorSource : d.colorSource;
  const activeTab = r.activeTab === 'wheel' || r.activeTab === 'preset' ? r.activeTab : d.activeTab;
  const presetId =
    colorSource === 'preset' && typeof r.presetId === 'string' && r.presetId.length > 0 ? r.presetId : d.presetId;
  return {
    targetColor: isHex(r.targetColor) ? (r.targetColor as string).toUpperCase() : d.targetColor,
    colorSource,
    presetId: colorSource === 'custom' ? null : presetId,
    colorIntensity: toNum(r.colorIntensity, d.colorIntensity),
    screenBrightness: toNum(r.screenBrightness, d.screenBrightness),
    activeTab,
  };
}

export function toPersisted(state: FillLightState): PersistedFillLight {
  return sanitizePersistedState({
    targetColor: state.targetColor,
    colorSource: state.colorSource,
    presetId: state.presetId,
    colorIntensity: state.colorIntensity,
    screenBrightness: state.screenBrightness,
    activeTab: state.activeTab,
  });
}

export { PERSISTENCE_KEY };
