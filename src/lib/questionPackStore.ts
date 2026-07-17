import manifestJson from '../data/question-packs/manifest.json'
import practice1Json from '../data/question-packs/supplemental-practice1.json'
import practice2Json from '../data/question-packs/supplemental-practice2.json'
import practice3Json from '../data/question-packs/supplemental-practice3.json'
import type { Question, QuestionPackMetadata } from '../types/domain'
import { activeQuestions, questions, questionsById } from './dataStore'

export const packs = manifestJson as unknown as QuestionPackMetadata[]

export const packQuestions: Question[] = [
  ...(practice1Json as unknown as Question[]),
  ...(practice2Json as unknown as Question[]),
  ...(practice3Json as unknown as Question[]),
]

export const packQuestionsById = new Map(packQuestions.map((q) => [q.id, q]))

export const activePackQuestions = packQuestions.filter((q) => q.active && !q.needsReview)

/** Core bank + supplemental packs merged, without mutating either source array. */
export const combinedActiveQuestions: Question[] = [...activeQuestions, ...activePackQuestions]

export const combinedQuestionsById = new Map<string, Question>([...questionsById, ...packQuestionsById])

export const supplementalQuestionsByTopic = new Map<string, Question[]>()
for (const q of activePackQuestions) {
  for (const topicId of q.topicIds) {
    if (!supplementalQuestionsByTopic.has(topicId)) supplementalQuestionsByTopic.set(topicId, [])
    supplementalQuestionsByTopic.get(topicId)!.push(q)
  }
}

export const packsById = new Map(packs.map((p) => [p.packId, p]))

/** Guard used by validation/tests: every core question id must be untouched by pack ids. */
export const hasIdCollisionWithCore = questions.some((q) => packQuestionsById.has(q.id))
