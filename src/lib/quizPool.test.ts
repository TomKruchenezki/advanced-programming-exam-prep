import { describe, it, expect } from 'vitest'
import { buildQuizPool } from './quizPool'
import { activeQuestions, topicsSorted } from './dataStore'
import { combinedActiveQuestions } from './questionPackStore'
import { createEmptyProgress } from './progressStore'

const progress = createEmptyProgress()

describe('buildQuizPool', () => {
  it('core-only mode never includes a supplemental (packId) question', () => {
    const pool = buildQuizPool({
      mode: 'core-only',
      coreQuestions: activeQuestions,
      combinedQuestions: combinedActiveQuestions,
      topics: topicsSorted,
      progress,
      size: 1000,
    })
    expect(pool.length).toBeGreaterThan(0)
    expect(pool.every((q) => !q.packId)).toBe(true)
  })

  it('supplemental-only mode never includes a core (non-packId) question', () => {
    const pool = buildQuizPool({
      mode: 'supplemental-only',
      coreQuestions: activeQuestions,
      combinedQuestions: combinedActiveQuestions,
      topics: topicsSorted,
      progress,
      size: 1000,
    })
    expect(pool.length).toBeGreaterThan(0)
    expect(pool.every((q) => !!q.packId)).toBe(true)
  })

  it('supplemental-pack mode only returns questions from the requested pack', () => {
    const pool = buildQuizPool({
      mode: 'supplemental-pack',
      coreQuestions: activeQuestions,
      combinedQuestions: combinedActiveQuestions,
      topics: topicsSorted,
      progress,
      size: 1000,
      packId: 'supplemental-practice1',
    })
    expect(pool.length).toBeGreaterThan(0)
    expect(pool.every((q) => q.packId === 'supplemental-practice1')).toBe(true)
  })

  it('all-verified mode includes both core and supplemental questions', () => {
    const pool = buildQuizPool({
      mode: 'all-verified',
      coreQuestions: activeQuestions,
      combinedQuestions: combinedActiveQuestions,
      topics: topicsSorted,
      progress,
      size: 10000,
    })
    expect(pool.some((q) => !!q.packId)).toBe(true)
    expect(pool.some((q) => !q.packId)).toBe(true)
  })

  it('adaptive mode never includes a needsReview question, and may include supplemental questions', () => {
    const pool = buildQuizPool({
      mode: 'adaptive',
      coreQuestions: activeQuestions,
      combinedQuestions: combinedActiveQuestions,
      topics: topicsSorted,
      progress,
      size: 200,
    })
    expect(pool.every((q) => !q.needsReview)).toBe(true)
  })
})
