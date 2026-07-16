import { describe, it, expect } from 'vitest'
import { scoreMockExam, computeMasteryScore, difficultyWeight } from './scoring'
import type { MockExamAnswer, Question } from '../types/domain'

function makeQuestion(id: string, topicIds: string[], correctOptionId: Question['correctOptionId'] = 'a'): Question {
  return {
    id,
    topicIds,
    subtopic: 'test',
    stemHe: 'שאלה',
    options: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
      { id: 'c', text: 'C' },
      { id: 'd', text: 'D' },
      { id: 'e', text: 'E' },
    ],
    correctOptionId,
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
  }
}

describe('scoreMockExam', () => {
  it('scores all-correct as 100%', () => {
    const questions = [makeQuestion('q1', ['t1']), makeQuestion('q2', ['t1'])]
    const answers: MockExamAnswer[] = [
      { questionId: 'q1', chosenOptionId: 'a', flaggedForReview: false },
      { questionId: 'q2', chosenOptionId: 'a', flaggedForReview: false },
    ]
    const result = scoreMockExam(questions, answers)
    expect(result.scorePercent).toBe(100)
    expect(result.correctCount).toBe(2)
    expect(result.wouldPass55).toBe(true)
  })

  it('scores all-wrong as 0%', () => {
    const questions = [makeQuestion('q1', ['t1']), makeQuestion('q2', ['t1'])]
    const answers: MockExamAnswer[] = [
      { questionId: 'q1', chosenOptionId: 'b', flaggedForReview: false },
      { questionId: 'q2', chosenOptionId: 'b', flaggedForReview: false },
    ]
    const result = scoreMockExam(questions, answers)
    expect(result.scorePercent).toBe(0)
    expect(result.wouldPass55).toBe(false)
  })

  it('handles unanswered questions as incorrect', () => {
    const questions = [makeQuestion('q1', ['t1']), makeQuestion('q2', ['t1'])]
    const answers: MockExamAnswer[] = [{ questionId: 'q1', chosenOptionId: null, flaggedForReview: false }]
    const result = scoreMockExam(questions, answers)
    expect(result.correctCount).toBe(0)
    expect(result.totalCount).toBe(2)
  })

  it('computes correct 55-pass threshold at the boundary', () => {
    const questions = Array.from({ length: 20 }, (_, i) => makeQuestion(`q${i}`, ['t1']))
    const answers: MockExamAnswer[] = questions.map((q, i) => ({
      questionId: q.id,
      chosenOptionId: i < 11 ? 'a' : 'b', // 11/20 = 55%
      flaggedForReview: false,
    }))
    const result = scoreMockExam(questions, answers)
    expect(result.scorePercent).toBe(55)
    expect(result.wouldPass55).toBe(true)
  })

  it('builds a per-topic breakdown', () => {
    const questions = [makeQuestion('q1', ['threads']), makeQuestion('q2', ['solid']), makeQuestion('q3', ['threads'])]
    const answers: MockExamAnswer[] = [
      { questionId: 'q1', chosenOptionId: 'a', flaggedForReview: false },
      { questionId: 'q2', chosenOptionId: 'b', flaggedForReview: false },
      { questionId: 'q3', chosenOptionId: 'b', flaggedForReview: false },
    ]
    const result = scoreMockExam(questions, answers)
    expect(result.topicBreakdown.threads).toEqual({ correct: 1, total: 2 })
    expect(result.topicBreakdown.solid).toEqual({ correct: 0, total: 1 })
  })
})

describe('computeMasteryScore', () => {
  it('never reports 100% mastery after a single correct answer', () => {
    const score = computeMasteryScore({ attempts: 1, weightedCorrectSum: 1, weightedTotalSum: 1 })
    expect(score).toBeLessThan(1)
    expect(score).toBeLessThan(0.7)
  })

  it('returns 0 for zero attempts', () => {
    expect(computeMasteryScore({ attempts: 0, weightedCorrectSum: 0, weightedTotalSum: 0 })).toBe(0)
  })

  it('approaches the true ratio as attempts grow', () => {
    const score = computeMasteryScore({ attempts: 20, weightedCorrectSum: 18, weightedTotalSum: 20 })
    expect(score).toBeGreaterThan(0.8)
  })

  it('stays within [0,1]', () => {
    const score = computeMasteryScore({ attempts: 50, weightedCorrectSum: 100, weightedTotalSum: 100 })
    expect(score).toBeLessThanOrEqual(1)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

describe('difficultyWeight', () => {
  it('weights hard > medium > easy', () => {
    expect(difficultyWeight('hard')).toBeGreaterThan(difficultyWeight('medium'))
    expect(difficultyWeight('medium')).toBeGreaterThan(difficultyWeight('easy'))
  })
})
