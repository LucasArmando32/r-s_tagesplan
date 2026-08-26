"use client";

import { createContext, useContext, useMemo } from "react";
import { getDictionary } from "./dictionaries";

const I18nContext = createContext(null);

function readPath(dict, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], dict);
}

export function I18nProvider({ locale, children }) {
  const value = useMemo(() => {
    const dict = getDictionary(locale);
    const t = (path) => readPath(dict, path) ?? path;
    return { locale, dict, t };
  }, [locale]);

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n debe usarse dentro de <I18nProvider>");
  }
  return ctx;
}
