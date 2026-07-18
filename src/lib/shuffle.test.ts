import { describe, it, expect } from 'vitest'
import { mulberry32, shuffleArray, shuffleQuestionOptions, hashStringToSeed, stableShuffleQuestionOptions } from './shuffle'
import type { Question } from '../types/domain'
import { combinedActiveQuestions } from './questionPackStore'

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q-test-001',
    topicIds: ['topic-a'],
    subtopic: 'test',
    stemHe: 'שאלה',
    options: [
      { id: 'a', text: 'Option A' },
      { id: 'b', text: 'Option B' },
      { id: 'c', text: 'Option C' },
      { id: 'd', text: 'Option D' },
      { id: 'e', text: 'Option E' },
    ],
    correctOptionId: 'c',
    explanation: 'explanation',
    optionExplanations: { a: 'wrong', b: 'wrong', c: 'right', d: 'wrong', e: 'wrong' },
    difficulty: 'medium',
    questionType: 'definition',
    source: 'authored',
    sourceReferences: [],
    confidence: 'high',
    basedOnPastExam: false,
    pastExamYear: null,
    origin: 'original',
    tags: [],
    keyLearningPoint: 'point',
    points: 5,
    active: true,
    ...overrides,
  }
}

describe('shuffleArray', () => {
  it('returns a permutation of the original array', () => {
    const rng = mulberry32(42)
    const original = [1, 2, 3, 4, 5]
    const shuffled = shuffleArray(original, rng)
    expect(shuffled.slice().sort()).toEqual(original.slice().sort())
    expect(shuffled).toHaveLength(original.length)
  })

  it('does not mutate the input array', () => {
    const original = [1, 2, 3]
    const copy = original.slice()
    shuffleArray(original, mulberry32(1))
    expect(original).toEqual(copy)
  })

  it('is deterministic given the same seed', () => {
    const a = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8], mulberry32(7))
    const b = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8], mulberry32(7))
    expect(a).toEqual(b)
  })

  it('produces different orders across many runs (not identity every time)', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    let sawDifferentOrder = false
    for (let seed = 0; seed < 20; seed++) {
      const shuffled = shuffleArray(original, mulberry32(seed))
      if (JSON.stringify(shuffled) !== JSON.stringify(original)) {
        sawDifferentOrder = true
        break
      }
    }
    expect(sawDifferentOrder).toBe(true)
  })
})

describe('shuffleQuestionOptions', () => {
  it('keeps the same option texts as a set after shuffling', () => {
    const q = makeQuestion()
    const shuffled = shuffleQuestionOptions(q, mulberry32(3))
    const originalTexts = q.options.map((o) => o.text).sort()
    const shuffledTexts = shuffled.options.map((o) => o.text).sort()
    expect(shuffledTexts).toEqual(originalTexts)
  })

  it('preserves which option text is correct after shuffling', () => {
    const q = makeQuestion()
    for (let seed = 0; seed < 30; seed++) {
      const shuffled = shuffleQuestionOptions(q, mulberry32(seed))
      const correctOption = shuffled.options.find((o) => o.id === shuffled.correctOptionId)
      expect(correctOption?.text).toBe('Option C')
    }
  })

  it('maps displayToOriginal back to the correct original option ids', () => {
    const q = makeQuestion()
    const shuffled = shuffleQuestionOptions(q, mulberry32(11))
    for (const opt of shuffled.options) {
      const originalId = shuffled.displayToOriginal[opt.id]
      const originalOption = q.options.find((o) => o.id === originalId)
      expect(originalOption?.text).toBe(opt.text)
    }
  })

  it('always produces exactly 5 options with unique ids a-e', () => {
    const q = makeQuestion()
    const shuffled = shuffleQuestionOptions(q, mulberry32(99))
    expect(shuffled.options).toHaveLength(5)
    expect(new Set(shuffled.options.map((o) => o.id)).size).toBe(5)
  })

  it('throws if correctOptionId does not match any option', () => {
    const q = makeQuestion({ correctOptionId: 'z' as Question['correctOptionId'] })
    expect(() => shuffleQuestionOptions(q)).toThrow()
  })
})

describe('hashStringToSeed', () => {
  it('is deterministic - the same input always produces the same output', () => {
    for (let i = 0; i < 50; i++) {
      expect(hashStringToSeed('question-check-001')).toBe(hashStringToSeed('question-check-001'))
    }
  })

  it('produces different seeds for different keys (in the overwhelming majority of cases)', () => {
    const keys = Array.from({ length: 40 }, (_, i) => `q-${i}`)
    const seeds = new Set(keys.map(hashStringToSeed))
    expect(seeds.size).toBe(keys.length)
  })

  it('always returns a non-negative integer', () => {
    for (const key of ['', 'a', 'q-pastexam-2019-012', 'attempt-123:q-045']) {
      const seed = hashStringToSeed(key)
      expect(Number.isInteger(seed)).toBe(true)
      expect(seed).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('stableShuffleQuestionOptions', () => {
  it('produces an identical ShuffledQuestion every time for the same question + seedKey, across many repeated calls', () => {
    const q = makeQuestion()
    const first = stableShuffleQuestionOptions(q, 'seed-key-abc')
    for (let i = 0; i < 25; i++) {
      const again = stableShuffleQuestionOptions(q, 'seed-key-abc')
      expect(again.options).toEqual(first.options)
      expect(again.correctOptionId).toBe(first.correctOptionId)
      expect(again.displayToOriginal).toEqual(first.displayToOriginal)
    }
  })

  it('is unaffected by unrelated calls in between - simulates re-renders triggered by unrelated state changes', () => {
    const q = makeQuestion()
    const before = stableShuffleQuestionOptions(q, 'section-check-question-9')
    // Simulate intervening renders caused by confidence clicks / "learned" toggles / progress updates.
    stableShuffleQuestionOptions(makeQuestion({ id: 'other' }), 'unrelated-seed-1')
    stableShuffleQuestionOptions(makeQuestion({ id: 'other' }), 'unrelated-seed-2')
    const after = stableShuffleQuestionOptions(q, 'section-check-question-9')
    expect(after).toEqual(before)
  })

  it('can (but need not) produce a different order for a different seedKey', () => {
    const q = makeQuestion()
    const seedKeys = Array.from({ length: 15 }, (_, i) => `attempt-${i}`)
    const orders = seedKeys.map((k) => stableShuffleQuestionOptions(q, k).options.map((o) => o.text).join(''))
    expect(new Set(orders).size).toBeGreaterThan(1)
  })

  it('always maps the correct option id back to the original correctOptionId (scoring invariant)', () => {
    const q = makeQuestion()
    for (const seedKey of ['a', 'b', 'q-1', 'attempt-1:q-1', 'attempt-2:q-1']) {
      const shuffled = stableShuffleQuestionOptions(q, seedKey)
      expect(shuffled.displayToOriginal[shuffled.correctOptionId]).toBe(q.correctOptionId)
    }
  })

  it('shuffles a genuine 4-option question (authentic Past Exam format) without error', () => {
    const q = makeQuestion({
      options: [
        { id: 'a', text: 'Option A' },
        { id: 'b', text: 'Option B' },
        { id: 'c', text: 'Option C' },
        { id: 'd', text: 'Option D' },
      ],
      correctOptionId: 'b',
    })
    const shuffled = stableShuffleQuestionOptions(q, q.id)
    expect(shuffled.options).toHaveLength(4)
    expect(shuffled.displayToOriginal[shuffled.correctOptionId]).toBe('b')
  })

  it('holds the scoring invariant across every real active question in the bank (core + supplemental)', () => {
    expect(combinedActiveQuestions.length).toBeGreaterThan(0)
    for (const q of combinedActiveQuestions) {
      const shuffled = stableShuffleQuestionOptions(q, q.id)
      // Almost every question has 5 options, but a handful of authentic Past Exam questions
      // genuinely only had 4 on the real paper - shuffling must preserve whatever count it started with.
      expect(shuffled.options).toHaveLength(q.options.length)
      expect(new Set(shuffled.options.map((o) => o.id)).size).toBe(q.options.length)
      expect(shuffled.displayToOriginal[shuffled.correctOptionId]).toBe(q.correctOptionId)
      // Every displayed id must map back to a real original option id.
      for (const opt of shuffled.options) {
        const originalId = shuffled.displayToOriginal[opt.id]
        expect(q.options.some((o) => o.id === originalId)).toBe(true)
      }
    }
  })
})
