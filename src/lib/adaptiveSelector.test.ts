import { describe, it, expect } from 'vitest'
import { selectAdaptiveQuestions, selectDiagnosticQuestions } from './adaptiveSelector'
import { createEmptyProgress } from './progressStore'
import { mulberry32 } from './shuffle'
import type { Question, Topic } from '../types/domain'

function makeQuestion(id: string, topicIds: string[], overrides: Partial<Question> = {}): Question {
  return {
    id,
    topicIds,
    subtopic: 'test',
    stemHe: `שאלה ${id}`,
    options: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
      { id: 'c', text: 'C' },
      { id: 'd', text: 'D' },
      { id: 'e', text: 'E' },
    ],
    correctOptionId: 'a',
    explanation: 'exp',
    optionExplanations: { a: 'x', b: 'x', c: 'x', d: 'x', e: 'x' },
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

function makeTopic(id: string, examFrequency: Topic['examFrequency'] = 'medium'): Topic {
  return { id, order: 1, titleHe: id, titleEn: id, lectureRefs: [], examFrequency, summary: '', sectionIds: [] }
}

describe('selectAdaptiveQuestions', () => {
  const topics = [makeTopic('weak-topic', 'high'), makeTopic('strong-topic', 'low')]
  const questions = [
    ...Array.from({ length: 10 }, (_, i) => makeQuestion(`weak-${i}`, ['weak-topic'])),
    ...Array.from({ length: 10 }, (_, i) => makeQuestion(`strong-${i}`, ['strong-topic'])),
  ]

  it('never returns more questions than requested', () => {
    const progress = createEmptyProgress()
    const selected = selectAdaptiveQuestions(questions, topics, progress, { count: 5, rng: mulberry32(1) })
    expect(selected.length).toBeLessThanOrEqual(5)
  })

  it('never returns duplicate questions in one selection', () => {
    const progress = createEmptyProgress()
    const selected = selectAdaptiveQuestions(questions, topics, progress, { count: 15, rng: mulberry32(2) })
    const ids = selected.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('favors the topic with lower mastery over many draws', () => {
    const progress = createEmptyProgress()
    progress.topicMastery['weak-topic'] = { topicId: 'weak-topic', attempts: 5, correct: 1, lastReviewed: null, masteryScore: 0.1 }
    progress.topicMastery['strong-topic'] = { topicId: 'strong-topic', attempts: 5, correct: 5, lastReviewed: null, masteryScore: 0.95 }

    let weakCount = 0
    let strongCount = 0
    for (let seed = 0; seed < 50; seed++) {
      const selected = selectAdaptiveQuestions(questions, topics, progress, { count: 4, rng: mulberry32(seed) })
      for (const q of selected) {
        if (q.topicIds.includes('weak-topic')) weakCount++
        if (q.topicIds.includes('strong-topic')) strongCount++
      }
    }
    expect(weakCount).toBeGreaterThan(strongCount)
  })

  it('excludes inactive and needsReview questions', () => {
    const withInactive = [...questions, makeQuestion('inactive-1', ['weak-topic'], { active: false }), makeQuestion('review-1', ['weak-topic'], { needsReview: true })]
    const progress = createEmptyProgress()
    const selected = selectAdaptiveQuestions(withInactive, topics, progress, { count: 20, rng: mulberry32(3) })
    expect(selected.find((q) => q.id === 'inactive-1')).toBeUndefined()
    expect(selected.find((q) => q.id === 'review-1')).toBeUndefined()
  })

  it('respects topicFilter', () => {
    const progress = createEmptyProgress()
    const selected = selectAdaptiveQuestions(questions, topics, progress, { count: 20, topicFilter: ['strong-topic'], rng: mulberry32(4) })
    expect(selected.every((q) => q.topicIds.includes('strong-topic'))).toBe(true)
  })
})

describe('selectDiagnosticQuestions', () => {
  it('spreads selection across all topics', () => {
    const topics = [makeTopic('t1'), makeTopic('t2'), makeTopic('t3')]
    const questions = topics.flatMap((t) => Array.from({ length: 5 }, (_, i) => makeQuestion(`${t.id}-${i}`, [t.id])))
    const selected = selectDiagnosticQuestions(questions, topics, 9, mulberry32(5))
    const topicsCovered = new Set(selected.flatMap((q) => q.topicIds))
    expect(topicsCovered.size).toBe(3)
  })

  it('never returns duplicates', () => {
    const topics = [makeTopic('t1'), makeTopic('t2')]
    const questions = topics.flatMap((t) => Array.from({ length: 20 }, (_, i) => makeQuestion(`${t.id}-${i}`, [t.id])))
    const selected = selectDiagnosticQuestions(questions, topics, 30, mulberry32(6))
    const ids = selected.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
