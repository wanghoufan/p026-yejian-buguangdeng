import { I18n } from 'i18n-js';
import en from './locales/en';
import zhCN from './locales/zh-CN';

/** 语言偏好独立存储键，与补光参数（fill-light:v1:last-state）互不影响。 */
export const LANGUAGE_STORAGE_KEY = 'fill-light:v2:language';

/** 受支持语言清单：新增语言只在此处与 dictionaries / locales 增项。 */
export const SUPPORTED_LOCALES = ['zh-CN', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'zh-CN';

/** 语言选项自称：两种界面下都保持可识别，不随当前语言翻译。 */
export const LOCALE_LABELS: Record<Locale, string> = {
  'zh-CN': '简体中文',
  en: 'English',
};

export const dictionaries: Record<Locale, object> = {
  'zh-CN': zhCN,
  en,
};

export const i18n = new I18n(dictionaries);
i18n.defaultLocale = DEFAULT_LOCALE;
i18n.enableFallback = true;
i18n.locale = DEFAULT_LOCALE;

export function isSupportedLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * 设备 languageCode → 支持语言。
 * en → en；zh → zh-CN；其他值、null、undefined 一律回退 zh-CN。
 */
export function localeFromDeviceLanguage(languageCode: string | null | undefined): Locale {
  if (languageCode === 'en') return 'en';
  if (languageCode === 'zh') return 'zh-CN';
  return DEFAULT_LOCALE;
}

/**
 * 启动语言决策：有效持久化偏好优先；否则按设备语言映射；设备检测失败回退 zh-CN。
 * 只接受支持清单里的精确值，空值/损坏值/未知值都视为无偏好。
 */
export function resolveInitialLocale(
  persisted: string | null | undefined,
  deviceLanguageCode: string | null | undefined,
): Locale {
  if (isSupportedLocale(persisted)) return persisted;
  return localeFromDeviceLanguage(deviceLanguageCode);
}

export type TranslateParams = Record<string, string | number | boolean | null | undefined>;
export type Translate = (key: string, params?: TranslateParams) => string;

/** 受限翻译函数：按传入 locale 取词，调用方（Provider）在 locale 变化时重建它。 */
export function translate(locale: Locale, key: string, params?: TranslateParams): string {
  i18n.locale = locale;
  return params ? i18n.t(key, params) : i18n.t(key);
}

/** 展平词典为点分键路径，用于键集合一致性校验。 */
export function flattenKeys(dict: object, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(dict as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as object, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

/** 相对默认语言缺失/多余的键；非空即视为词条遗漏门禁失败。 */
export function findMissingKeys(): string[] {
  const base = new Set(flattenKeys(dictionaries[DEFAULT_LOCALE]));
  const missing: string[] = [];
  for (const locale of SUPPORTED_LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    const keys = new Set(flattenKeys(dictionaries[locale]));
    for (const key of base) if (!keys.has(key)) missing.push(`${locale} 缺少 ${key}`);
    for (const key of keys) if (!base.has(key)) missing.push(`${DEFAULT_LOCALE} 缺少 ${key}`);
  }
  return missing;
}

// 开发门禁：词典键集合不一致时立即报错，避免漏翻以中文/占位符形式漏到界面。
if (process.env.NODE_ENV !== 'production') {
  const missing = findMissingKeys();
  if (missing.length > 0) {
    console.error(`[i18n] dictionary keys mismatch: ${missing.join('; ')}`);
  }
}
