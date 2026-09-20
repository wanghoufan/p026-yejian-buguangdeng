import { fillLightReducer, initialState } from '../src/state/fillLightReducer';

describe('fillLightReducer', () => {
  test('intensity and brightness are separated', () => {
    const s1 = fillLightReducer(initialState, { type: 'SET_COLOR_INTENSITY', colorIntensity: 0.2 });
    expect(s1.colorIntensity).toBe(0.2);
    expect(s1.screenBrightness).toBe(initialState.screenBrightness);
    const s2 = fillLightReducer(s1, { type: 'SET_SCREEN_BRIGHTNESS', screenBrightness: 0.5 });
    expect(s2.screenBrightness).toBe(0.5);
    expect(s2.colorIntensity).toBe(0.2);
  });
  test('preset selection keeps intensity', () => {
    const s = fillLightReducer(initialState, {
      type: 'SET_TARGET_COLOR',
      targetColor: '#FFD9E3',
      colorSource: 'preset',
      presetId: 'peach-pink',
    });
    expect(s.targetColor).toBe('#FFD9E3');
    expect(s.colorIntensity).toBe(initialState.colorIntensity);
  });
  test('hydrate forces sheet closed', () => {
    const s = fillLightReducer({ ...initialState, isSheetOpen: true }, { type: 'HYDRATE', state: {} });
    expect(s.isSheetOpen).toBe(false);
    expect(s.isHydrated).toBe(true);
  });

});
