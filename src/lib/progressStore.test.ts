import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createEmptyProgress, loadProgress, saveProgress, resetProgress, importProgressFromJSON, STORAGE_PREFIX } from './progressStore'

const CURRENT_KEY = `${STORAGE_PREFIX}:progress:v1`
const LEGACY_KEY = 'atp-exam-prep:progress:v1'
const UNRELATED_KEY = 'some-other-project:settings'
const UNRELATED_VALUE = 'do-not-touch-me'

function allLocalStorageKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) keys.push(key)
  }
  return keys
}

describe('progressStore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('creates an empty progress object with version 2', () => {
    const progress = createEmptyProgress()
    expect(progress.version).toBe(2)
    expect(progress.diagnosticCompleted).toBe(false)
    expect(progress.mistakeLog).toEqual([])
  })

  it('loads empty progress when nothing is stored', () => {
    const progress = loadProgress()
    expect(progress.version).toBe(2)
  })

  it('round-trips save and load', () => {
    const progress = createEmptyProgress()
    progress.diagnosticCompleted = true
    progress.mockExamResults.push({
      id: 'r1',
      mockExamId: 'mock-1',
      timestampISO: new Date().toISOString(),
      answers: [],
      scorePercent: 80,
      correctCount: 16,
      durationSeconds: 100,
      topicBreakdown: {},
      wouldPass55: true,
    })
    saveProgress(progress)
    const loaded = loadProgress()
    expect(loaded.diagnosticCompleted).toBe(true)
    expect(loaded.mockExamResults).toHaveLength(1)
    expect(loaded.mockExamResults[0]?.scorePercent).toBe(80)
  })

  it('resets progress back to empty', () => {
    const progress = createEmptyProgress()
    progress.diagnosticCompleted = true
    saveProgress(progress)
    const reset = resetProgress()
    expect(reset.diagnosticCompleted).toBe(false)
    expect(loadProgress().diagnosticCompleted).toBe(false)
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem(CURRENT_KEY, 'not valid json{{{')
    const progress = loadProgress()
    expect(progress.version).toBe(2)
  })

  it('handles setItem quota errors gracefully without throwing', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    const ok = saveProgress(createEmptyProgress())
    expect(ok).toBe(false)
    spy.mockRestore()
  })

  it('imports progress from a JSON string and persists it', () => {
    const progress = createEmptyProgress()
    progress.diagnosticCompleted = true
    const json = JSON.stringify(progress)
    const imported = importProgressFromJSON(json)
    expect(imported.diagnosticCompleted).toBe(true)
    expect(loadProgress().diagnosticCompleted).toBe(true)
  })

  it('falls back to empty progress when importing an unknown version', () => {
    const imported = importProgressFromJSON(JSON.stringify({ version: 999, foo: 'bar' }))
    expect(imported.version).toBe(2)
  })

  describe('storage key namespacing', () => {
    it('every key this app writes starts with STORAGE_PREFIX', () => {
      const progress = createEmptyProgress()
      progress.diagnosticCompleted = true
      saveProgress(progress)
      resetProgress()
      importProgressFromJSON(JSON.stringify(createEmptyProgress()))

      const appKeys = allLocalStorageKeys()
      expect(appKeys.length).toBeGreaterThan(0)
      for (const key of appKeys) {
        expect(key.startsWith(STORAGE_PREFIX)).toBe(true)
      }
    })

    it('migrates data from the legacy pre-namespacing key and removes it', () => {
      const legacyProgress = { ...createEmptyProgress(), diagnosticCompleted: true }
      localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyProgress))

      const loaded = loadProgress()

      expect(loaded.diagnosticCompleted).toBe(true)
      expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
      expect(localStorage.getItem(CURRENT_KEY)).not.toBeNull()
    })

    it('does not migrate the legacy key if current-key data already exists', () => {
      const currentProgress = { ...createEmptyProgress(), diagnosticCompleted: true }
      localStorage.setItem(CURRENT_KEY, JSON.stringify(currentProgress))
      const legacyProgress = { ...createEmptyProgress(), diagnosticCompleted: false }
      localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyProgress))

      const loaded = loadProgress()

      // Current key wins; legacy key is left alone since it wasn't needed.
      expect(loaded.diagnosticCompleted).toBe(true)
      expect(localStorage.getItem(LEGACY_KEY)).not.toBeNull()
    })

    it('never reads, overwrites, or deletes unrelated localStorage keys during save/load', () => {
      localStorage.setItem(UNRELATED_KEY, UNRELATED_VALUE)

      const progress = createEmptyProgress()
      progress.diagnosticCompleted = true
      saveProgress(progress)
      loadProgress()

      expect(localStorage.getItem(UNRELATED_KEY)).toBe(UNRELATED_VALUE)
    })

    it('never reads, overwrites, or deletes unrelated localStorage keys during import', () => {
      localStorage.setItem(UNRELATED_KEY, UNRELATED_VALUE)

      importProgressFromJSON(JSON.stringify(createEmptyProgress()))

      expect(localStorage.getItem(UNRELATED_KEY)).toBe(UNRELATED_VALUE)
    })

    it('reset progress deletes only this application data, leaving unrelated keys untouched', () => {
      localStorage.setItem(UNRELATED_KEY, UNRELATED_VALUE)
      localStorage.setItem(LEGACY_KEY, 'leftover-legacy-data')
      const progress = createEmptyProgress()
      progress.diagnosticCompleted = true
      saveProgress(progress)

      resetProgress()

      // Unrelated key is completely untouched.
      expect(localStorage.getItem(UNRELATED_KEY)).toBe(UNRELATED_VALUE)
      // Legacy key (belongs to this app under an old name) is cleaned up too.
      expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
      // This app's data was actually reset, not just left as-is.
      expect(loadProgress().diagnosticCompleted).toBe(false)
      // Every remaining key still belongs either to this app or is the untouched unrelated key.
      for (const key of allLocalStorageKeys()) {
        expect(key === UNRELATED_KEY || key.startsWith(STORAGE_PREFIX)).toBe(true)
      }
    })
  })
})
