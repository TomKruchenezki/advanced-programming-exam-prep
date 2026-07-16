import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import type { Flashcard, MockExam, Question, Topic } from '../src/types/domain'
import { validateFlashcards, validateMockExams, validateQuestions } from '../src/lib/validateData'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../src/data')
const STUDY_CONTENT_DIR = path.resolve(__dirname, '../study_content')

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(DATA_DIR, file), 'utf-8')) as T
}

const topics = loadJSON<Topic[]>('topics.json')
const questions = loadJSON<Question[]>('questions.json')
const flashcards = loadJSON<Flashcard[]>('flashcards.json')
const mockExams = loadJSON<MockExam[]>('mockExams.json')
const questionsById = new Map(questions.map((q) => [q.id, q]))

const questionIssues = validateQuestions(questions, topics)
const flashcardIssues = validateFlashcards(flashcards, topics)
const mockExamIssues = validateMockExams(mockExams, questionsById)

const allIssues = [...questionIssues, ...flashcardIssues, ...mockExamIssues]
const errors = allIssues.filter((i) => i.severity === 'error')
const warnings = allIssues.filter((i) => i.severity === 'warning')

const activeQuestions = questions.filter((q) => q.active && !q.needsReview)
const needsReviewInActive = questions.filter((q) => q.active && q.needsReview)

const lines: string[] = []
lines.push('# Question Bank Validation Report')
lines.push('')
lines.push(`Generated: ${new Date().toISOString()}`)
lines.push('')
lines.push('## Summary')
lines.push(`- Topics: ${topics.length}`)
lines.push(`- Questions total: ${questions.length} (active: ${activeQuestions.length})`)
lines.push(`- Flashcards: ${flashcards.length}`)
lines.push(`- Mock exams: ${mockExams.length}`)
lines.push(`- Errors: ${errors.length}`)
lines.push(`- Warnings: ${warnings.length}`)
lines.push('')

if (errors.length > 0) {
  lines.push('## Errors')
  for (const e of errors) lines.push(`- [${e.itemId ?? '-'}] ${e.message}`)
  lines.push('')
}
if (warnings.length > 0) {
  lines.push('## Warnings')
  for (const w of warnings) lines.push(`- [${w.itemId ?? '-'}] ${w.message}`)
  lines.push('')
}

writeFileSync(path.join(STUDY_CONTENT_DIR, 'question_validation_report.md'), lines.join('\n'), 'utf-8')

console.log(`Topics: ${topics.length}, Questions: ${questions.length} (active: ${activeQuestions.length}), Flashcards: ${flashcards.length}, Mock exams: ${mockExams.length}`)
console.log(`Errors: ${errors.length}, Warnings: ${warnings.length}`)
if (needsReviewInActive.length > 0) {
  console.error(`FATAL: ${needsReviewInActive.length} questions are active=true but needsReview=true`)
}

if (errors.length > 0 || needsReviewInActive.length > 0) {
  console.error(`\nValidation FAILED with ${errors.length} error(s). See study_content/question_validation_report.md`)
  process.exit(1)
} else {
  console.log('\nValidation PASSED')
}
