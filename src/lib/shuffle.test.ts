import { describe, it, expect } from 'vitest'
import { mulberry32, shuffleArray, shuffleQuestionOptions } from './shuffle'
import type { Question } from '../types/domain'

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
