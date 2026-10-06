'use client'

import { createContext, useContext, useSyncExternalStore } from 'react'
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

// Source externe : localStorage, sinon la langue du navigateur.
// Rendu serveur en 'fr', puis bascule après hydratation (comme l'ancien effet).
const STORAGE_KEY = 'geodatle-lang'
const listeners = new Set<() => void>()

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => { listeners.delete(callback) }
}

function getSnapshot(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'fr' || stored === 'en') return stored
  return navigator.language.startsWith('fr') ? 'fr' : 'en'
}

function getServerSnapshot(): Lang {
  return 'fr'
}

function setLang(l: Lang) {
  localStorage.setItem(STORAGE_KEY, l)
  listeners.forEach((callback) => callback())
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
