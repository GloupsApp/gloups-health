import { createContext, use, useMemo, useState, useCallback } from "react";
import type { PropsWithChildren } from "react";

import { preferredLanguage, saveLanguage } from "./preferred-language";
import type { Language } from "./preferred-language";
import { en } from "./strings.en";
import { fr } from "./strings.fr";

export type { Language } from "./preferred-language";

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  strings: typeof en;
} | null>(null);

export const LanguageProvider = ({ children }: PropsWithChildren) => {
  const [language, setLanguage] = useState<Language>(preferredLanguage);

  const chooseLanguage = useCallback((next: Language) => {
    saveLanguage(next);
    setLanguage(next);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage: chooseLanguage,
      strings: language === "fr" ? fr : en,
    }),
    [language, chooseLanguage]
  );

  return <LanguageContext value={value}>{children}</LanguageContext>;
};

export const useLanguage = () => {
  const context = use(LanguageContext);

  if (!context) {
    throw new Error("Language provider is missing.");
  }

  return context;
};
