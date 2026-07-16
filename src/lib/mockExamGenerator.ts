import type { Question, Topic } from '../types/domain'
import { shuffleArray } from './shuffle'

export interface CustomMockExamOptions {
  size?: number
  rng?: () => number
  excludeQuestionIds?: string[]
}

/**
 * Builds an on-demand mock exam: exactly `size` unique questions (default 20),
 * summing to size*5 points, with a topic distribution roughly proportional to
 * each topic's exam frequency (falls back to uniform if not enough questions exist).
 */
export function buildCustomMockExam(allQuestions: Question[], topics: Topic[], options: CustomMockExamOptions = {}): Question[] {
  const { size = 20, rng = Math.random, excludeQuestionIds = [] } = options
  const excluded = new Set(excludeQuestionIds)
  const pool = allQuestions.filter((q) => q.active && !q.needsReview && !excluded.has(q.id))

  const freqWeight: Record<Topic['examFrequency'], number> = { high: 3, medium: 1.8, low: 1 }
  const topicWeights = new Map(topics.map((t) => [t.id, freqWeight[t.examFrequency]]))

  const byTopic = new Map<string, Question[]>()
  for (const q of pool) {
    for (const topicId of q.topicIds) {
      if (!byTopic.has(topicId)) byTopic.set(topicId, [])
      byTopic.get(topicId)!.push(q)
    }
  }

  const totalWeight = topics.reduce((sum, t) => sum + (topicWeights.get(t.id) ?? 1), 0)
  const selected: Question[] = []
  const usedIds = new Set<string>()

  for (const topic of topics) {
    const share = (topicWeights.get(topic.id) ?? 1) / totalWeight
    const target = Math.round(share * size)
    const candidates = shuffleArray(byTopic.get(topic.id) ?? [], rng).filter((q) => !usedIds.has(q.id))
    for (const q of candidates.slice(0, target)) {
      selected.push(q)
      usedIds.add(q.id)
    }
  }

  if (selected.length < size) {
    const remaining = shuffleArray(
      pool.filter((q) => !usedIds.has(q.id)),
      rng,
    )
    for (const q of remaining) {
      if (selected.length >= size) break
      selected.push(q)
      usedIds.add(q.id)
    }
  }

  return shuffleArray(selected, rng).slice(0, size)
}
