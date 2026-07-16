import topicsJson from '../data/topics.json'
import questionsJson from '../data/questions.json'
import flashcardsJson from '../data/flashcards.json'
import studySectionsJson from '../data/studySections.json'
import mockExamsJson from '../data/mockExams.json'
import pastExamIndexJson from '../data/pastExamIndex.json'
import type { Flashcard, MockExam, PastExamFile, Question, StudySection, Topic } from '../types/domain'

export const topics = topicsJson as unknown as Topic[]
export const questions = questionsJson as unknown as Question[]
export const flashcards = flashcardsJson as unknown as Flashcard[]
export const studySections = studySectionsJson as unknown as StudySection[]
export const mockExams = mockExamsJson as unknown as MockExam[]
export const pastExamIndex = pastExamIndexJson as unknown as PastExamFile[]

export const activeQuestions = questions.filter((q) => q.active && !q.needsReview)

export const questionsById = new Map(questions.map((q) => [q.id, q]))
export const topicsById = new Map(topics.map((t) => [t.id, t]))
export const sectionsByTopic = new Map<string, StudySection[]>()
for (const s of studySections) {
  if (!sectionsByTopic.has(s.topicId)) sectionsByTopic.set(s.topicId, [])
  sectionsByTopic.get(s.topicId)!.push(s)
}
for (const list of sectionsByTopic.values()) list.sort((a, b) => a.order - b.order)

export const topicsSorted = [...topics].sort((a, b) => a.order - b.order)
