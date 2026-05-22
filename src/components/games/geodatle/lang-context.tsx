'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import type { Lang, Translations } from '@/lib/i18n'
import { translations } from '@/lib/i18n'

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: Translations
}

const LangContext = createContext<LangContextValue>({
  lang: 'fr',
  setLang: () => {},
  t: translations.fr,
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr')

  useEffect(() => {
    const stored = localStorage.getItem('geodatle-lang') as Lang | null
    if (stored === 'fr' || stored === 'en') {
      setLangState(stored)
    } else {
      setLangState(navigator.language.startsWith('fr') ? 'fr' : 'en')
    }
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('geodatle-lang', l)
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
