import { useEffect, type ReactNode } from 'react'
import { useProgress } from '../../lib/ProgressContext'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { progress } = useProgress()
  const theme = progress.settings.theme

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [theme])

  return <>{children}</>
}
