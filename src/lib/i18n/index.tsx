'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { en, type TranslationKey } from './en'
import { ar } from './ar'

export type Language = 'en' | 'ar'
export type { TranslationKey } from './en'

export interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey, fallback?: string) => string
  dir: 'ltr' | 'rtl'
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => en[key] || key,
  dir: 'ltr',
})

const STORAGE_KEY = 'navigen_lang'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  // Restore saved choice in localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null
      if (saved === 'ar' || saved === 'en') {
        setLangState(saved)
        document.documentElement.lang = saved
        document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr'
      }
    } catch {
      // localStorage unavailable / private mode
    }
  }, [])

  const setLang = (nextLang: Language) => {
    setLangState(nextLang)
    try {
      localStorage.setItem(STORAGE_KEY, nextLang)
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLang
      document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr'
    }
  }

  const t = (key: TranslationKey, fallback?: string): string => {
    const dict = lang === 'ar' ? ar : en
    if (dict && dict[key]) {
      return dict[key]
    }
    return en[key] || fallback || key
  }

  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr'

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useT() {
  const context = useContext(LanguageContext)

  // Allow both `const { t, lang, setLang } = useT()` AND `const t = useT(); t('...')`
  const callable = ((key: TranslationKey, fallback?: string) => context.t(key, fallback)) as any
  callable.t = context.t
  callable.lang = context.lang
  callable.setLang = context.setLang
  callable.dir = context.dir

  return callable as {
    (key: TranslationKey, fallback?: string): string
    t: (key: TranslationKey, fallback?: string) => string
    lang: Language
    setLang: (lang: Language) => void
    dir: 'ltr' | 'rtl'
  }
}

export { localizedName } from './names'
export { en } from './en'
export { ar } from './ar'
