import { useLanguageContext, type LanguageContextValue } from '../i18n/LanguageContext';

/** 语言消费入口：只做转发，逻辑与状态都在 LanguageProvider。 */
export function useLanguage(): LanguageContextValue {
  return useLanguageContext();
}

export type { LanguageContextValue };
