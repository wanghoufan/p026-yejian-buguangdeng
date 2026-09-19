import { DEFAULT_STATE } from '../src/constants/defaults';
import { fillLightReducer, initialState } from '../src/state/fillLightReducer';
import { sanitizePersistedState, toPersisted } from '../src/utils/validation';

describe('T055 persistence edge cases', () => {
  it('null/非对象回退默认', () => {
    expect(sanitizePersistedState(null).targetColor).toBe(DEFAULT_STATE.targetColor);
    expect(sanitizePersistedState('oops').activeTab).toBe('preset');
    expect(sanitizePersistedState(undefined).colorIntensity).toBe(1);
  });

  it('非法 hex 回退默认 targetColor', () => {
    expect(sanitizePersistedState({ targetColor: 'red' }).targetColor).toBe(DEFAULT_STATE.targetColor);
    expect(sanitizePersistedState({ targetColor: '#12345' }).targetColor).toBe(DEFAULT_STATE.targetColor);
    expect(sanitizePersistedState({ targetColor: '#FFD9E3' }).targetColor).toBe('#FFD9E3');
  });

  it('越界/NaN/字符串数字 clamp 与回退', () => {
    expect(sanitizePersistedState({ colorIntensity: 5 }).colorIntensity).toBe(1);
    expect(sanitizePersistedState({ colorIntensity: -2 }).colorIntensity).toBe(0);
    expect(sanitizePersistedState({ colorIntensity: NaN }).colorIntensity).toBe(DEFAULT_STATE.colorIntensity);
    expect(sanitizePersistedState({ screenBrightness: '0.5' }).screenBrightness).toBe(0.5);
    expect(sanitizePersistedState({ screenBrightness: Infinity }).screenBrightness).toBe(
      DEFAULT_STATE.screenBrightness,
    );
  });

  it('非法枚举回退；custom 时 presetId 强制 null', () => {
    expect(sanitizePersistedState({ colorSource: 'x' }).colorSource).toBe('preset');
    expect(sanitizePersistedState({ activeTab: 'x' }).activeTab).toBe('preset');
    const s = sanitizePersistedState({ colorSource: 'custom', presetId: 'warm-white' });
    expect(s.presetId).toBeNull();
  });

  it('toPersisted 不含 isSheetOpen/isHydrated', () => {
    const p = toPersisted({ ...initialState, isSheetOpen: true, isHydrated: true });
    expect(p).not.toHaveProperty('isSheetOpen');
    expect(p).not.toHaveProperty('isHydrated');
  });

  it('HYDRATE 强制 Sheet Closed + isHydrated=true', () => {
    const next = fillLightReducer(
      { ...initialState, isSheetOpen: true },
      { type: 'HYDRATE', state: { ...(sanitizePersistedState({ targetColor: '#FFD9E3' }) as object), isSheetOpen: true } },
    );
    expect(next.isSheetOpen).toBe(false);
    expect(next.isHydrated).toBe(true);
    expect(next.targetColor).toBe('#FFD9E3');
  });

  it('损坏 JSON 由调用方捕获：sanitize 对解析失败输入仍可用', () => {
    expect(() => sanitizePersistedState(JSON.parse('{{{'))).toThrow();
    expect(sanitizePersistedState(null).screenBrightness).toBe(1);
  });
});
