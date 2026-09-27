import {
  DEFAULT_LOCALE,
  LANGUAGE_STORAGE_KEY,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  dictionaries,
  findMissingKeys,
  flattenKeys,
  isSupportedLocale,
  localeFromDeviceLanguage,
  resolveInitialLocale,
  translate,
} from '../src/i18n';
import { PRESETS } from '../src/constants/presets';

// V2.1 F1/F4/F5：词典完整性 + 启动语言映射 + 存储键边界。

describe('i18n 词典（F1/F5）', () => {
  test('存储键冻结为 fill-light:v2:language，与补光参数键分离', () => {
    expect(LANGUAGE_STORAGE_KEY).toBe('fill-light:v2:language');
    expect(LANGUAGE_STORAGE_KEY).not.toContain('last-state');
  });

  test('受支持语言为 zh-CN 与 en，默认 zh-CN，选项自称固定', () => {
    expect([...SUPPORTED_LOCALES]).toEqual(['zh-CN', 'en']);
    expect(DEFAULT_LOCALE).toBe('zh-CN');
    expect(LOCALE_LABELS).toEqual({ 'zh-CN': '简体中文', en: 'English' });
  });

  test('中英词典键集合完全一致（缺词门禁）', () => {
    expect(findMissingKeys()).toEqual([]);
    expect(flattenKeys(dictionaries['zh-CN'])).toEqual(flattenKeys(dictionaries.en));
    expect(flattenKeys(dictionaries.en).length).toBeGreaterThan(0);
  });

  test('现有 14 项文案中英都有对应且无 missing 占位', () => {
    const pairs: [string, string, string][] = [
      ['controls.colorIntensity', '颜色强度', 'Color intensity'],
      ['controls.screenBrightness', '屏幕亮度', 'Screen brightness'],
      ['controls.resetWarmWhite', '恢复暖白默认', 'Reset to warm white'],
      ['tabs.presets', '预设颜色', 'Presets'],
      ['tabs.colorWheel', '色轮', 'Color wheel'],
      ['accessibility.colorWheel', '色相色盘', 'Hue color wheel'],
    ];
    for (const [key, zh, en] of pairs) {
      expect(translate('zh-CN', key)).toBe(zh);
      expect(translate('en', key)).toBe(en);
    }
    for (const locale of SUPPORTED_LOCALES) {
      for (const [key] of pairs) expect(translate(locale, key)).not.toContain('missing');
    }
  });

  test('8 个预设 id 在两种语言下都有词条，且不出现中文混入英文页', () => {
    for (const preset of PRESETS) {
      const zh = translate('zh-CN', `presets.${preset.id}`);
      const en = translate('en', `presets.${preset.id}`);
      expect(zh).not.toContain('missing');
      expect(en).not.toContain('missing');
      expect(zh).not.toBe(en);
      expect(en).not.toMatch(/[\u4e00-\u9fa5]/); // 英文词典不得残留中文
    }
  });

  test('设置页文案中英对照', () => {
    expect(translate('zh-CN', 'settings.title')).toBe('设置');
    expect(translate('en', 'settings.title')).toBe('Settings');
    expect(translate('zh-CN', 'settings.language')).toBe('语言');
    expect(translate('en', 'settings.language')).toBe('Language');
    expect(translate('zh-CN', 'settings.back')).toBe('返回');
    expect(translate('en', 'settings.back')).toBe('Back');
    expect(translate('zh-CN', 'settings.entry')).toBe('设置');
    expect(translate('en', 'settings.entry')).toBe('Settings');
    expect(translate('zh-CN', 'settings.saveFailed')).toBe('语言未能保存，请重试');
    expect(translate('en', 'settings.saveFailed')).toBe("Language couldn't be saved. Try again");
  });

  test('英文词典不得残留中文，双语都不得出现 missing 占位', () => {
    for (const key of flattenKeys(dictionaries.en)) {
      expect(translate('en', key)).not.toMatch(/[\u4e00-\u9fa5]/);
    }
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of flattenKeys(dictionaries[locale])) {
        expect(translate(locale, key)).not.toContain('missing');
      }
    }
  });
});

describe('设备语言映射与启动决策（F4）', () => {
  test('en → en；zh → zh-CN；其他、空值、异常 → zh-CN', () => {
    expect(localeFromDeviceLanguage('en')).toBe('en');
    expect(localeFromDeviceLanguage('zh')).toBe('zh-CN');
    expect(localeFromDeviceLanguage('ja')).toBe('zh-CN');
    expect(localeFromDeviceLanguage('zh-Hans')).toBe('zh-CN');
    expect(localeFromDeviceLanguage('')).toBe('zh-CN');
    expect(localeFromDeviceLanguage(null)).toBe('zh-CN');
    expect(localeFromDeviceLanguage(undefined)).toBe('zh-CN');
  });

  test('有效持久化偏好优先于设备语言（手动选择覆盖设备语言）', () => {
    expect(resolveInitialLocale('en', 'zh')).toBe('en');
    expect(resolveInitialLocale('zh-CN', 'en')).toBe('zh-CN');
  });

  test('无偏好/非法偏好走设备语言，设备检测失败回退 zh-CN', () => {
    expect(resolveInitialLocale(null, 'en')).toBe('en');
    expect(resolveInitialLocale('', 'en')).toBe('en');
    expect(resolveInitialLocale('fr', 'en')).toBe('en');
    expect(resolveInitialLocale('EN', 'zh')).toBe('zh-CN'); // 只认精确值
    expect(resolveInitialLocale(undefined, null)).toBe(DEFAULT_LOCALE);
    expect(resolveInitialLocale(null, undefined)).toBe(DEFAULT_LOCALE);
    expect(resolveInitialLocale('ja', 'ja')).toBe('zh-CN'); // 不支持的语言仍回退
  });

  test('isSupportedLocale 只接受支持清单里的精确值', () => {
    expect(isSupportedLocale('zh-CN')).toBe(true);
    expect(isSupportedLocale('en')).toBe(true);
    expect(isSupportedLocale('en-US')).toBe(false);
    expect(isSupportedLocale('zh')).toBe(false);
    expect(isSupportedLocale(null)).toBe(false);
    expect(isSupportedLocale(42)).toBe(false);
  });
});
