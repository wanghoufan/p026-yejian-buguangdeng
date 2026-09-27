import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import {
  DEFAULT_LOCALE,
  LANGUAGE_STORAGE_KEY,
  resolveInitialLocale,
  translate,
  type Locale,
  type Translate,
  type TranslateParams,
} from './index';

export type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
  isReady: boolean;
  /** 最近一次语言偏好写入失败（界面需显示可翻译提示并允许重试）。 */
  saveError: boolean;
  retrySave: () => void;
};

export const LanguageContext = createContext<LanguageContextValue | null>(null);

/** 设备首选语言码；getLocales 抛错、空列表、首项缺失或 languageCode 异常时返回 null。 */
export function detectDeviceLanguageCode(): string | null {
  try {
    const locales = getLocales();
    const first = Array.isArray(locales) ? locales[0] : undefined;
    const code = first?.languageCode;
    return typeof code === 'string' && code.length > 0 ? code : null;
  } catch {
    return null;
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isReady, setIsReady] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // 手动选择优先级最高：初始化读取与设备检测都不得覆盖用户本次选择。
  const userChosen = useRef(false);
  // 末次写入保护：写入按顺序串行，只有最后一次请求能改写 saveError。
  const lastWrite = useRef(0);
  const writeChain = useRef<Promise<void>>(Promise.resolve());
  const localeRef = useRef<Locale>(DEFAULT_LOCALE);

  const applyLocale = useCallback((next: Locale) => {
    localeRef.current = next;
    setLocaleState(next);
  }, []);

  // 启动：先读偏好，无有效值再用设备语言；画布可先渲染，翻译控件等 isReady。
  useEffect(() => {
    let alive = true;
    void (async () => {
      let persisted: string | null = null;
      try {
        persisted = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      } catch {
        persisted = null;
      }
      if (!alive || userChosen.current) return;
      applyLocale(resolveInitialLocale(persisted, detectDeviceLanguageCode()));
      setIsReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [applyLocale]);

  // 串行写入：快速连续切换时按调用顺序落盘，最终持久值与界面最后选择一致。
  const persist = useCallback((next: Locale) => {
    const seq = ++lastWrite.current;
    writeChain.current = writeChain.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next))
      .then(() => {
        if (seq === lastWrite.current) setSaveError(false);
      })
      .catch(() => {
        if (seq === lastWrite.current) setSaveError(true);
      });
  }, []);

  const setLocale = useCallback(
    (next: Locale) => {
      userChosen.current = true;
      applyLocale(next);
      // 初始化未完成时用户就已切换：以本次选择为准，立即放行界面。
      setIsReady(true);
      setSaveError(false);
      persist(next);
    },
    [applyLocale, persist],
  );

  const retrySave = useCallback(() => {
    setSaveError(false);
    persist(localeRef.current);
  }, [persist]);

  const t = useCallback<Translate>(
    (key: string, params?: TranslateParams) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, setLocale, t, isReady, saveError, retrySave }),
    [locale, setLocale, t, isReady, saveError, retrySave],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguageContext(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
