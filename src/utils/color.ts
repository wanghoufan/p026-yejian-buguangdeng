export function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, '0').toUpperCase();
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** PLAN §7: display = round(255*(1-t) + target*t), t=clamp(intensity,0,1) */
export function mixWithWhite(targetHex: string, intensity: number): string {
  const t = clamp01(intensity);
  const [r, g, b] = hexToRgb(targetHex);
  return rgbToHex(255 * (1 - t) + r * t, 255 * (1 - t) + g * t, 255 * (1 - t) + b * t);
}

export function displayColor(targetHex: string, colorIntensity: number): string {
  return mixWithWhite(targetHex, colorIntensity);
}
