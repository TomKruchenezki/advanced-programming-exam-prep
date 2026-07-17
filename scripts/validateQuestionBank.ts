import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import type { Flashcard, MockExam, Question, QuestionPackMetadata, Topic } from '../src/types/domain'
import { validateFlashcards, validateMockExams, validateQuestions } from '../src/lib/validateData'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../src/data')
const PACKS_DIR = path.resolve(DATA_DIR, 'question-packs')
const STUDY_CONTENT_DIR = path.resolve(__dirname, '../study_content')
const REPORTS_DIR = path.resolve(__dirname, '../reports')

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(DATA_DIR, file), 'utf-8')) as T
}

function loadPackJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(PACKS_DIR, file), 'utf-8')) as T
}

const topics = loadJSON<Topic[]>('topics.json')
const questions = loadJSON<Question[]>('questions.json')
const flashcards = loadJSON<Flashcard[]>('flashcards.json')
const mockExams = loadJSON<MockExam[]>('mockExams.json')
const questionsById = new Map(questions.map((q) => [q.id, q]))

const packManifest = loadPackJSON<QuestionPackMetadata[]>('manifest.json')
const packQuestions: Question[] = packManifest.flatMap((pack) => loadPackJSON<Question[]>(`${pack.packId}.json`))

const questionIssues = validateQuestions(questions, topics)
const flashcardIssues = validateFlashcards(flashcards, topics)
const mockExamIssues = validateMockExams(mockExams, questionsById)

// Packs are validated with the same generic rule set, but kept in a SEPARATE issue list so a
// problem in supplemental content never gets conflated with the core 293-question bank's report.
const packQuestionIssues = validateQuestions(packQuestions, topics)
const coreIds = new Set(questions.map((q) => q.id))
const packIdCollisions = packQuestions.filter((q) => coreIds.has(q.id))
for (const q of packIdCollisions) {
  packQuestionIssues.push({ severity: 'error', message: `Pack question id collides with a core bank id: ${q.id}`, itemId: q.id })
}
const packErrors = packQuestionIssues.filter((i) => i.severity === 'error')
const packWarnings = packQuestionIssues.filter((i) => i.severity === 'warning')
const packActiveQuestions = packQuestions.filter((q) => q.active && !q.needsReview)
const packNeedsReviewInActive = packQuestions.filter((q) => q.active && q.needsReview)

const packLines: string[] = []
packLines.push('# Additional Question Validation Report')
packLines.push('')
packLines.push(`Generated: ${new Date().toISOString()}`)
packLines.push('')
packLines.push('## Summary')
packLines.push(`- Packs: ${packManifest.length}`)
packLines.push(`- Pack questions total: ${packQuestions.length} (active: ${packActiveQuestions.length})`)
packLines.push(`- Errors: ${packErrors.length}`)
packLines.push(`- Warnings: ${packWarnings.length}`)
packLines.push(`- ID collisions with core bank: ${packIdCollisions.length}`)
packLines.push('')
if (packErrors.length > 0) {
  packLines.push('## Errors')
  for (const e of packErrors) packLines.push(`- [${e.itemId ?? '-'}] ${e.message}`)
  packLines.push('')
}
if (packWarnings.length > 0) {
  packLines.push('## Warnings')
  for (const w of packWarnings) packLines.push(`- [${w.itemId ?? '-'}] ${w.message}`)
  packLines.push('')
}
packLines.push('## Per-pack breakdown')
for (const pack of packManifest) {
  const inPack = packQuestions.filter((q) => q.packId === pack.packId)
  packLines.push(`- **${pack.packId}** (${pack.titleHe}): ${inPack.length} questions, ${inPack.filter((q) => q.active && !q.needsReview).length} active`)
}
writeFileSync(path.join(REPORTS_DIR, 'additional_question_validation.md'), packLines.join('\n'), 'utf-8')

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
console.log(`Question packs: ${packManifest.length}, pack questions: ${packQuestions.length} (active: ${packActiveQuestions.length}), pack errors: ${packErrors.length}, pack warnings: ${packWarnings.length}`)
if (needsReviewInActive.length > 0) {
  console.error(`FATAL: ${needsReviewInActive.length} questions are active=true but needsReview=true`)
}
if (packNeedsReviewInActive.length > 0) {
  console.error(`FATAL: ${packNeedsReviewInActive.length} pack questions are active=true but needsReview=true`)
}

if (errors.length > 0 || needsReviewInActive.length > 0 || packErrors.length > 0 || packNeedsReviewInActive.length > 0) {
  console.error(`\nValidation FAILED with ${errors.length} core error(s), ${packErrors.length} pack error(s). See study_content/question_validation_report.md and reports/additional_question_validation.md`)
  process.exit(1)
} else {
  console.log('\nValidation PASSED')
}
