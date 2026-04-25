"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DICTS, HTML_LANG, type Dict, type Locale, detectLocale } from "./i18n";

const STORAGE_KEY = "chess-arena:locale";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt");

  useEffect(() => {
    let initial: Locale | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "pt" || raw === "en" || raw === "es") initial = raw;
    } catch { /* ignore */ }
    if (!initial) initial = detectLocale(navigator.language);
    setLocaleState(initial);
    document.documentElement.lang = HTML_LANG[initial];
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.documentElement.lang = HTML_LANG[l];
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  }, []);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: DICTS[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): Ctx {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n must be used inside <I18nProvider>");
  return c;
}
