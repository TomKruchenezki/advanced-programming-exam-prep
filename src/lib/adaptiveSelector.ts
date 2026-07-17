import type { Question, Topic, UserProgress } from '../types/domain'
import { shuffleArray } from './shuffle'

const FREQUENCY_WEIGHT: Record<Topic['examFrequency'], number> = {
  high: 3,
  medium: 1.8,
  low: 1,
}

export interface AdaptiveSelectionOptions {
  count: number
  topicFilter?: string[]
  rng?: () => number
}

/**
 * Priority order (highest weight wins): exam-frequency of the topic > weak topic mastery >
 * repeated past mistakes > topics never practiced > everything else.
 * Never picks the same question twice within one call.
 */
export function selectAdaptiveQuestions(
  allQuestions: Question[],
  topics: Topic[],
  progress: UserProgress,
  options: AdaptiveSelectionOptions,
): Question[] {
  const { count, topicFilter, rng = Math.random } = options
  const topicById = new Map(topics.map((t) => [t.id, t]))

  const pool = allQuestions.filter((q) => {
    if (!q.active || q.needsReview) return false
    if (topicFilter && topicFilter.length > 0 && !q.topicIds.some((t) => topicFilter.includes(t))) return false
    return true
  })

  const weights = pool.map((q) => {
    let weight = 1
    for (const topicId of q.topicIds) {
      const topic = topicById.get(topicId)
      if (topic) weight *= FREQUENCY_WEIGHT[topic.examFrequency]

      const mastery = progress.topicMastery[topicId]
      if (mastery) {
        // Lower mastery -> higher weight. mastery in [0,1].
        weight *= 1 + (1 - mastery.masteryScore) * 2
      } else {
        // Never attempted topic: moderately boosted so it surfaces without dominating everything.
        weight *= 1.5
      }
    }

    const stat = progress.questionStats[q.id]
    if (stat) {
      const wrongStreak = stat.lastResult === false ? 1 : 0
      weight *= 1 + wrongStreak * 1.5
      // De-prioritize questions answered correctly many times in a row recently.
      if (stat.lastResult === true && stat.correct > 2) weight *= 0.5
    } else {
      // Unseen questions get a mild boost so the pool doesn't stagnate on the same items.
      weight *= 1.3
    }

    const unresolvedMistake = progress.mistakeLog.some((m) => m.questionId === q.id && !m.resolved)
    if (unresolvedMistake) weight *= 2

    // Supplemental (medium-confidence, non-core) questions get a lower initial weight so they
    // supplement adaptive practice without crowding out the validated core bank.
    if (q.packId) weight *= 0.4

    return weight
  })

  // Weighted sampling without replacement.
  const indices = pool.map((_, i) => i)
  const selected: Question[] = []
  const remainingWeights = weights.slice()
  const remainingIndices = indices.slice()

  const n = Math.min(count, pool.length)
  for (let picked = 0; picked < n; picked++) {
    const total = remainingWeights.reduce((a, b) => a + b, 0)
    if (total <= 0) break
    let r = rng() * total
    let chosenPos = 0
    for (let i = 0; i < remainingWeights.length; i++) {
      r -= remainingWeights[i]!
      if (r <= 0) {
        chosenPos = i
        break
      }
    }
    const originalIndex = remainingIndices[chosenPos]!
    selected.push(pool[originalIndex]!)
    remainingWeights.splice(chosenPos, 1)
    remainingIndices.splice(chosenPos, 1)
  }

  return selected
}

export function selectDiagnosticQuestions(allQuestions: Question[], topics: Topic[], count = 30, rng: () => number = Math.random): Question[] {
  const active = allQuestions.filter((q) => q.active && !q.needsReview)
  // Spread roughly evenly across all topics so the diagnostic covers everything.
  const byTopic = new Map<string, Question[]>()
  for (const topic of topics) byTopic.set(topic.id, [])
  for (const q of active) {
    for (const topicId of q.topicIds) {
      byTopic.get(topicId)?.push(q)
    }
  }
  const perTopic = Math.max(1, Math.floor(count / Math.max(1, topics.length)))
  const picked: Question[] = []
  const usedIds = new Set<string>()
  for (const topic of topics) {
    const candidates = shuffleArray(byTopic.get(topic.id) ?? [], rng).filter((q) => !usedIds.has(q.id))
    for (const q of candidates.slice(0, perTopic)) {
      picked.push(q)
      usedIds.add(q.id)
    }
  }
  // Top up to `count` with random remaining questions if under target.
  if (picked.length < count) {
    const rest = shuffleArray(
      active.filter((q) => !usedIds.has(q.id)),
      rng,
    )
    for (const q of rest) {
      if (picked.length >= count) break
      picked.push(q)
      usedIds.add(q.id)
    }
  }
  return shuffleArray(picked, rng).slice(0, count)
}
