import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import en from './en';
import ru from './ru';
import type { TranslationKeys } from './en';

export type Lang = 'en' | 'ru';

const translations = { en, ru };

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKeys) => string;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType>(null!);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem('vj_lang') as Lang) || 'en'
  );
  const [darkMode, setDarkModeState] = useState<boolean>(
    () => localStorage.getItem('vj_dark') === 'true'
  );

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('vj_lang', l);
  };

  const setDarkMode = (v: boolean) => {
    setDarkModeState(v);
    localStorage.setItem('vj_dark', String(v));
  };

  const t = (key: TranslationKeys): string => translations[lang][key];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, darkMode, setDarkMode }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
