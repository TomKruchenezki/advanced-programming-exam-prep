import type { Difficulty, Question, Topic, UserProgress } from '../types/domain'
import { selectAdaptiveQuestions } from './adaptiveSelector'
import { shuffleArray } from './shuffle'

export type QuizFilterMode =
  | 'adaptive'
  | 'topic'
  | 'difficulty'
  | 'past-exam-only'
  | 'past-exam-style'
  | 'code'
  | 'definitions'
  | 'mistakes'
  | 'flagged'
  | 'unseen'
  | 'core-only'
  | 'supplemental-only'
  | 'all-verified'
  | 'supplemental-pack'

export interface QuizPoolOptions {
  mode: QuizFilterMode
  coreQuestions: Question[]
  combinedQuestions: Question[]
  topics: Topic[]
  progress: UserProgress
  size: number
  topicId?: string
  difficulty?: Difficulty
  packId?: string
}

/**
 * Pure pool-building logic for Quiz Me, extracted out of the route component so it can be
 * unit-tested directly without rendering/interacting with the UI. `coreQuestions` must be the
 * validated 293-question core bank; `combinedQuestions` is core+supplemental packs merged.
 */
export function buildQuizPool(options: QuizPoolOptions): Question[] {
  const { mode, coreQuestions, combinedQuestions, topics, progress, size, topicId, difficulty, packId } = options

  switch (mode) {
    case 'adaptive':
      return selectAdaptiveQuestions(combinedQuestions, topics, progress, { count: size })
    case 'topic':
      return shuffleArray(coreQuestions.filter((q) => q.topicIds.includes(topicId ?? ''))).slice(0, size)
    case 'difficulty':
      return shuffleArray(coreQuestions.filter((q) => q.difficulty === difficulty)).slice(0, size)
    case 'past-exam-only':
      return shuffleArray(coreQuestions.filter((q) => q.source === 'past-exam')).slice(0, size)
    case 'past-exam-style':
      return shuffleArray(coreQuestions.filter((q) => q.origin === 'new_past_exam_style' || q.source === 'past-exam')).slice(0, size)
    case 'code':
      return shuffleArray(coreQuestions.filter((q) => !!q.code || q.questionType.startsWith('code'))).slice(0, size)
    case 'definitions':
      return shuffleArray(coreQuestions.filter((q) => q.questionType === 'definition')).slice(0, size)
    case 'mistakes': {
      const wrongIds = new Set(progress.mistakeLog.filter((m) => !m.resolved).map((m) => m.questionId))
      return shuffleArray(coreQuestions.filter((q) => wrongIds.has(q.id))).slice(0, size)
    }
    case 'flagged': {
      const savedIds = new Set(Object.entries(progress.questionStats).filter(([, s]) => s.saved).map(([id]) => id))
      return shuffleArray(coreQuestions.filter((q) => savedIds.has(q.id))).slice(0, size)
    }
    case 'unseen':
      return shuffleArray(coreQuestions.filter((q) => !progress.questionStats[q.id])).slice(0, size)
    case 'core-only':
      return shuffleArray(coreQuestions).slice(0, size)
    case 'supplemental-only':
      return shuffleArray(combinedQuestions.filter((q) => !!q.packId)).slice(0, size)
    case 'all-verified':
      return shuffleArray(combinedQuestions.filter((q) => q.confidence === 'high' || q.confidence === 'medium')).slice(0, size)
    case 'supplemental-pack':
      return shuffleArray(combinedQuestions.filter((q) => q.packId === packId)).slice(0, size)
  }
}
