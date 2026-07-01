"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { en } from "./dictionaries/en";
import { id } from "./dictionaries/id";

type Language = "en" | "id";
type Dictionary = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionaries: Record<Language, Dictionary> = { en, id };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  // On mount, read from localStorage if available
  useEffect(() => {
    const savedLang = localStorage.getItem("ldv_lang") as Language;
    if (savedLang === "en" || savedLang === "id") {
      setLanguage(savedLang);
    } else {
      // Check browser preference
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("id")) {
        setLanguage("id");
      }
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("ldv_lang", lang);
  };

  // Helper to safely get nested values like 'nav.about'
  const t = (key: string): string => {
    const keys = key.split(".");
    let current: any = dictionaries[language];
    
    for (const k of keys) {
      if (current[k] === undefined) {
        console.warn(`Translation key not found: ${key} for language: ${language}`);
        // Fallback to English if not found in current language
        let fallback: any = dictionaries.en;
        for (const fk of keys) {
          if (fallback[fk] === undefined) return key;
          fallback = fallback[fk];
        }
        return fallback;
      }
      current = current[k];
    }
    
    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
