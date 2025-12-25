import { atom, withLocalStorage } from '@reatom/core'
import { reatomComponent } from '@reatom/react'
import { useEffect } from 'react'

export type Theme = 'dark' | 'light' | 'system'

interface ThemeState {
  theme: Theme
}

export const themeAtom = atom<ThemeState>({ theme: 'system' }, 'themeAtom').extend(
  withLocalStorage('vite-ui-theme'),
)

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider = reatomComponent<ThemeProviderProps>(({ children }) => {
  const state = themeAtom()
  const theme = state.theme

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  return <>{children}</>
})
