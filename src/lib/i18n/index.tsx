'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { en, type TranslationKey } from './en'
import { ar } from './ar'

export type Language = 'en' | 'ar'
export type { TranslationKey } from './en'

export type InterpolationParams = Record<string, string | number>

export interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey, paramsOrFallback?: InterpolationParams | string) => string
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

  const t = (key: TranslationKey, paramsOrFallback?: InterpolationParams | string): string => {
    const dict = lang === 'ar' ? ar : en
    let str = (dict && (dict as any)[key]) || (en as any)[key] || (typeof paramsOrFallback === 'string' ? paramsOrFallback : key)
    if (paramsOrFallback && typeof paramsOrFallback === 'object') {
      for (const [k, v] of Object.entries(paramsOrFallback)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return str
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
  const callable = ((key: TranslationKey, paramsOrFallback?: InterpolationParams | string) => context.t(key, paramsOrFallback)) as any
  callable.t = context.t
  callable.lang = context.lang
  callable.setLang = context.setLang
  callable.dir = context.dir

  return callable as {
    (key: TranslationKey, paramsOrFallback?: InterpolationParams | string): string
    t: (key: TranslationKey, paramsOrFallback?: InterpolationParams | string) => string
    lang: Language
    setLang: (lang: Language) => void
    dir: 'ltr' | 'rtl'
  }
}

export function interpolate(text: string, values: Record<string, React.ReactNode>): React.ReactNode[] {
  return text.split(/(\{.*?\})/g).map((part, i) => {
    const match = part.match(/^\{(.*)\}$/)
    if (match && match[1] in values) {
      return <React.Fragment key={i}>{values[match[1]]}</React.Fragment>
    }
    return part
  })
}

export { localizedName } from './names'
export { en } from './en'
export { ar } from './ar'
