import type { MockExamAnswer, Question } from '../types/domain'

export interface ScoreResult {
  correctCount: number
  totalCount: number
  scorePercent: number
  wouldPass55: boolean
  topicBreakdown: Record<string, { correct: number; total: number }>
}

export function scoreMockExam(questions: Question[], answers: MockExamAnswer[]): ScoreResult {
  const answerMap = new Map(answers.map((a) => [a.questionId, a]))
  let correctCount = 0
  const topicBreakdown: Record<string, { correct: number; total: number }> = {}

  for (const q of questions) {
    const answer = answerMap.get(q.id)
    const isCorrect = !!answer && answer.chosenOptionId === q.correctOptionId
    if (isCorrect) correctCount++
    for (const topicId of q.topicIds) {
      topicBreakdown[topicId] ??= { correct: 0, total: 0 }
      topicBreakdown[topicId].total++
      if (isCorrect) topicBreakdown[topicId].correct++
    }
  }

  const totalCount = questions.length
  const scorePercent = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100)

  return {
    correctCount,
    totalCount,
    scorePercent,
    wouldPass55: scorePercent >= 55,
    topicBreakdown,
  }
}

/**
 * Computes an exponentially-weighted mastery score in [0,1] for a topic.
 * Never returns 1.0 from a single data point - confidence grows with attempts,
 * and harder questions / mock-exam performance are weighted more heavily than
 * easy quiz answers.
 */
export function computeMasteryScore(params: {
  attempts: number
  weightedCorrectSum: number
  weightedTotalSum: number
}): number {
  const { attempts, weightedCorrectSum, weightedTotalSum } = params
  if (attempts === 0 || weightedTotalSum === 0) return 0
  const rawRatio = weightedCorrectSum / weightedTotalSum
  // Confidence dampener: with few attempts, pull the score toward a conservative midpoint (0.5)
  // so a single correct answer never reports 100% mastery.
  const confidence = Math.min(1, attempts / 8)
  const dampened = rawRatio * confidence + 0.5 * (1 - confidence)
  return Math.max(0, Math.min(1, dampened))
}

export function difficultyWeight(difficulty: 'easy' | 'medium' | 'hard'): number {
  switch (difficulty) {
    case 'easy':
      return 1
    case 'medium':
      return 1.5
    case 'hard':
      return 2
  }
}
