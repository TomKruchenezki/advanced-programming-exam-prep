import { describe, it, expect } from 'vitest'
import questionsJson from '../data/questions.json'
import snapshot from '../data/__snapshots__/originalActiveQuestions.snapshot.json'
import type { Question } from '../types/domain'

describe('original question bank regression', () => {
  const currentActive = (questionsJson as unknown as Question[]).filter((q) => q.active)
  const frozenActive = snapshot as unknown as Question[]

  it('still has exactly the same number of active questions as the frozen snapshot', () => {
    expect(currentActive.length).toBe(frozenActive.length)
    expect(currentActive.length).toBe(293)
  })

  it('has not lost, gained, or renamed any original active question id', () => {
    const currentIds = new Set(currentActive.map((q) => q.id))
    const frozenIds = new Set(frozenActive.map((q) => q.id))
    expect(currentIds).toEqual(frozenIds)
  })

  it('every original active question is byte-for-byte identical to its frozen snapshot record', () => {
    const currentById = new Map(currentActive.map((q) => [q.id, q]))
    for (const frozen of frozenActive) {
      const current = currentById.get(frozen.id)
      expect(current, `question ${frozen.id} should still exist`).toBeTruthy()
      expect(current).toEqual(frozen)
    }
  })
})
