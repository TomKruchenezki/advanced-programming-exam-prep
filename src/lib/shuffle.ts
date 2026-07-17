import type { Question, QuestionOption } from '../types/domain'

/** Deterministic seeded PRNG (mulberry32) so shuffles are reproducible in tests. */
export function mulberry32(seed: number) {
  let a = seed
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffleArray<T>(items: T[], rng: () => number = Math.random): T[] {
  const arr = items.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = arr[i]!
    arr[i] = arr[j]!
    arr[j] = tmp
  }
  return arr
}

const OPTION_IDS: QuestionOption['id'][] = ['a', 'b', 'c', 'd', 'e']

export interface ShuffledQuestion extends Omit<Question, 'options' | 'correctOptionId'> {
  options: QuestionOption[]
  correctOptionId: QuestionOption['id']
  /** maps the shuffled option id back to the original option id, for looking up optionExplanations */
  displayToOriginal: Record<string, string>
}

/**
 * Shuffles a question's option order for display while preserving which option text
 * is actually correct, and keeping a mapping back to the original option ids so
 * optionExplanations (keyed by original id) can still be looked up.
 */
export function shuffleQuestionOptions(question: Question, rng: () => number = Math.random): ShuffledQuestion {
  const originalCorrect = question.options.find((o) => o.id === question.correctOptionId)
  if (!originalCorrect) {
    throw new Error(`Question ${question.id} has correctOptionId not present in options`)
  }
  const shuffledTexts = shuffleArray(question.options, rng)
  const displayToOriginal: Record<string, string> = {}
  const newOptions: QuestionOption[] = shuffledTexts.map((opt, idx) => {
    const newId = OPTION_IDS[idx]!
    displayToOriginal[newId] = opt.id
    return { id: newId, text: opt.text }
  })
  const newCorrectId = newOptions.find((o) => displayToOriginal[o.id] === question.correctOptionId)?.id
  if (!newCorrectId) {
    throw new Error(`Failed to relocate correct option for question ${question.id}`)
  }
  return {
    ...question,
    options: newOptions,
    correctOptionId: newCorrectId,
    displayToOriginal,
  }
}

/** Deterministic string hash (djb2-style), used to derive a stable PRNG seed from a key. */
export function hashStringToSeed(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(31, hash) + input.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

/**
 * Shuffles a question's options using a seed derived purely from `seedKey`, so the same
 * seedKey always produces the exact same order - safe to call on every render (no reliance
 * on memoization for correctness), and stable across unrelated state changes as long as the
 * seedKey (e.g. question id, or attempt id + question id) stays the same.
 */
export function stableShuffleQuestionOptions(question: Question, seedKey: string): ShuffledQuestion {
  return shuffleQuestionOptions(question, mulberry32(hashStringToSeed(seedKey)))
}
