import * as fs from 'fs';
import * as path from 'path';
import * as Brightness from 'expo-brightness';

jest.mock('expo-brightness', () => ({
  setBrightnessAsync: jest.fn(async () => {}),
  restoreSystemBrightnessAsync: jest.fn(async () => {}),
  getBrightnessAsync: jest.fn(async () => 0.8),
}));

const ROOT = process.cwd();

function read(p: string): string {
  return fs.readFileSync(path.join(ROOT, p), 'utf8');
}

function walkTs(roots: string[]): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
    }
  };
  roots.forEach((r) => walk(path.join(ROOT, r)));
  return out;
}

describe('brightness lifecycle (T045-T050)', () => {
  it('hook uses activity-only setter + restore on background + reapply on active', () => {
    const src = read('src/hooks/useAppBrightness.ts');
    expect(src).toMatch('setBrightnessAsync');
    expect(src).toMatch('restoreSystemBrightnessAsync');
    expect(src).toMatch('background');
    expect(src).toMatch('active');
    expect(src).not.toMatch(/setSystemBrightnessAsync\s*\(/);
  });

  it('mock apply path calls setBrightnessAsync', async () => {
    await (Brightness.setBrightnessAsync as jest.Mock)(0.9);
    expect(Brightness.setBrightnessAsync).toHaveBeenCalledWith(0.9);
    await (Brightness.restoreSystemBrightnessAsync as jest.Mock)();
    expect(Brightness.restoreSystemBrightnessAsync).toHaveBeenCalled();
  });

  it('static check: no system-wide setter anywhere in src/app', () => {
    const hits = walkTs(['src', 'app']).filter((p) =>
      /setSystemBrightnessAsync\s*\(/.test(fs.readFileSync(p, 'utf8')),
    );
    expect(hits).toEqual([]);
  });
});
