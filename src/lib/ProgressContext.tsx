import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { UserProgress } from '../types/domain'
import { loadProgress, saveProgress, resetProgress as resetProgressStore } from './progressStore'

interface ProgressContextValue {
  progress: UserProgress
  updateProgress: (updater: (prev: UserProgress) => UserProgress) => void
  resetProgress: () => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress())

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const updateProgress = useCallback((updater: (prev: UserProgress) => UserProgress) => {
    setProgress((prev) => updater(prev))
  }, [])

  const resetProgress = useCallback(() => {
    setProgress(resetProgressStore())
  }, [])

  return <ProgressContext.Provider value={{ progress, updateProgress, resetProgress }}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider')
  return ctx
}
