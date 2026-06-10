import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type Locale = 'pt' | 'en';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const STORAGE_KEY = 'ispgaya_locale';

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'pt',
  setLocale: () => undefined,
  toggleLocale: () => undefined
});

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'pt';

  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === 'en' ? 'en' : 'pt';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      toggleLocale: () => setLocaleState((current) => (current === 'pt' ? 'en' : 'pt'))
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function getLocaleText<T>(locale: Locale, pt: T, en: T): T {
  return locale === 'en' ? en : pt;
}

