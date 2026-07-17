import { describe, it, expect } from 'vitest'
import { questions, activeQuestions, questionsById } from './dataStore'
import {
  packs,
  packQuestions,
  activePackQuestions,
  packQuestionsById,
  combinedActiveQuestions,
  combinedQuestionsById,
  supplementalQuestionsByTopic,
  hasIdCollisionWithCore,
} from './questionPackStore'

describe('questionPackStore', () => {
  it('loads at least one pack with metadata', () => {
    expect(packs.length).toBeGreaterThan(0)
    for (const pack of packs) {
      expect(pack.packId).toBeTruthy()
      expect(pack.titleHe).toBeTruthy()
    }
  })

  it('has no question id collisions between packs and the core 293-question bank', () => {
    expect(hasIdCollisionWithCore).toBe(false)
    const coreIds = new Set(questions.map((q) => q.id))
    for (const q of packQuestions) {
      expect(coreIds.has(q.id)).toBe(false)
    }
  })

  it('has no duplicate question ids across packs', () => {
    const ids = packQuestions.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every pack question carries the packId of a real pack in the manifest', () => {
    const packIds = new Set(packs.map((p) => p.packId))
    for (const q of packQuestions) {
      expect(q.packId).toBeTruthy()
      expect(packIds.has(q.packId!)).toBe(true)
    }
  })

  it('combinedActiveQuestions is exactly the core active questions plus active pack questions', () => {
    expect(combinedActiveQuestions.length).toBe(activeQuestions.length + activePackQuestions.length)
    for (const q of activeQuestions) expect(combinedActiveQuestions).toContain(q)
    for (const q of activePackQuestions) expect(combinedActiveQuestions).toContain(q)
  })

  it('combinedQuestionsById resolves both core and pack ids', () => {
    const coreSample = questions[0]!
    expect(combinedQuestionsById.get(coreSample.id)).toBe(questionsById.get(coreSample.id))
    const packSample = packQuestions[0]!
    expect(combinedQuestionsById.get(packSample.id)).toBe(packQuestionsById.get(packSample.id))
  })

  it('supplementalQuestionsByTopic groups every active pack question under each of its topicIds', () => {
    for (const q of activePackQuestions) {
      for (const topicId of q.topicIds) {
        const bucket = supplementalQuestionsByTopic.get(topicId) ?? []
        expect(bucket.some((x) => x.id === q.id)).toBe(true)
      }
    }
  })

  it('never includes a needsReview question in activePackQuestions', () => {
    for (const q of activePackQuestions) {
      expect(q.needsReview).not.toBe(true)
      expect(q.active).toBe(true)
    }
  })
})
