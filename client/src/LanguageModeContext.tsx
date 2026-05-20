import { createContext, useContext, type ReactNode } from "react";

export type LangMode = "monolingual" | "bilingual";
export type UILanguage = "en" | "fr" | "pt" | "es";

interface LanguageModeValue {
  mode: LangMode;
  primaryLang: UILanguage;
  secondaryLang: UILanguage;
}

const Ctx = createContext<LanguageModeValue>({
  mode: "monolingual",
  primaryLang: "en",
  secondaryLang: "fr",
});

export function LanguageModeProvider({
  mode,
  primaryLang,
  secondaryLang,
  children,
}: LanguageModeValue & { children: ReactNode }) {
  return (
    <Ctx.Provider value={{ mode, primaryLang, secondaryLang }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLanguageMode(): LanguageModeValue {
  return useContext(Ctx);
}
