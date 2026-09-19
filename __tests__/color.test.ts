import { displayColor, hexToRgb, mixWithWhite, rgbToHex } from '../src/utils/color';

describe('color utils (PLAN §7)', () => {
  test('0% intensity = white', () => {
    expect(mixWithWhite('#FFF2E2', 0)).toBe('#FFFFFF');
  });
  test('100% intensity = target', () => {
    expect(mixWithWhite('#FFF2E2', 1)).toBe('#FFF2E2');
  });
  test('clamp out of range', () => {
    expect(mixWithWhite('#FFF2E2', -1)).toBe('#FFFFFF');
    expect(mixWithWhite('#FFF2E2', 2)).toBe('#FFF2E2');
  });
  test('hex roundtrip', () => {
    expect(rgbToHex(...hexToRgb('#4C8DFF'))).toBe('#4C8DFF');
  });
  test('displayColor aliases mixWithWhite', () => {
    expect(displayColor('#FF0000', 0.5)).toBe('#FF8080');
  });
});
