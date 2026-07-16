import type { UserProgress } from '../types/domain'

/**
 * All localStorage keys this application ever writes MUST start with this prefix.
 * GitHub Pages project sites are served from a shared origin (username.github.io), so
 * multiple unrelated projects can end up sharing the same browser-level localStorage area.
 * A generic key like "progress" or "settings" could collide with another project living at
 * a different path under the same origin - namespacing every key under a prefix specific to
 * this app avoids that entirely.
 */
export const STORAGE_PREFIX = 'advanced-programming-exam-prep'

const CURRENT_KEY = `${STORAGE_PREFIX}:progress:v1`

/** Keys used by earlier versions of this app, before keys were namespaced under STORAGE_PREFIX. */
const LEGACY_KEYS = ['atp-exam-prep:progress:v1']

export function createEmptyProgress(): UserProgress {
  return {
    version: 2,
    createdAt: new Date().toISOString(),
    diagnosticCompleted: false,
    topicMastery: {},
    questionStats: {},
    mistakeLog: [],
    mockExamResults: [],
    flashcardReviews: {},
    studiedSectionIds: [],
    sectionConfidence: {},
    studyPlan: [],
    availableHoursPerDay: { day1: 4, day2: 4, day3: 4 },
    settings: { theme: 'system' },
  }
}

function migrate(raw: unknown): UserProgress {
  if (!raw || typeof raw !== 'object') return createEmptyProgress()
  const obj = raw as Partial<UserProgress> & { version?: number }
  if (obj.version !== 2) {
    // No migration path from older/unknown versions yet - start fresh but keep nothing silently lost:
    // callers should have already offered an export before this happens.
    return createEmptyProgress()
  }
  const empty = createEmptyProgress()
  return { ...empty, ...obj }
}

/**
 * One-time migration: if data still exists under a pre-namespacing legacy key and nothing has
 * been written under the current namespaced key yet, copy it over and remove the legacy key.
 * Never touches any key that isn't one of ours.
 */
function migrateLegacyKeyIfNeeded(): void {
  if (localStorage.getItem(CURRENT_KEY) !== null) return
  for (const legacyKey of LEGACY_KEYS) {
    const legacyRaw = localStorage.getItem(legacyKey)
    if (legacyRaw !== null) {
      localStorage.setItem(CURRENT_KEY, legacyRaw)
      localStorage.removeItem(legacyKey)
      return
    }
  }
}

export function loadProgress(): UserProgress {
  try {
    migrateLegacyKeyIfNeeded()
    const raw = localStorage.getItem(CURRENT_KEY)
    if (!raw) return createEmptyProgress()
    return migrate(JSON.parse(raw))
  } catch {
    return createEmptyProgress()
  }
}

export function saveProgress(progress: UserProgress): boolean {
  try {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}

/** Removes every localStorage key belonging to this app (current + any legacy), and nothing else. */
function removeAllAppKeys(): void {
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith(STORAGE_PREFIX) || LEGACY_KEYS.includes(key))) {
      keysToRemove.push(key)
    }
  }
  for (const key of keysToRemove) localStorage.removeItem(key)
}

export function resetProgress(): UserProgress {
  try {
    removeAllAppKeys()
  } catch {
    // ignore - saveProgress below will still attempt to write a fresh empty state
  }
  const fresh = createEmptyProgress()
  saveProgress(fresh)
  return fresh
}

export function exportProgressToFile(progress: UserProgress) {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const dateStr = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `${STORAGE_PREFIX}-progress-${dateStr}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function importProgressFromJSON(json: string): UserProgress {
  const parsed = JSON.parse(json)
  const progress = migrate(parsed)
  saveProgress(progress)
  return progress
}
