export type Difficulty = 'easy' | 'medium' | 'hard'

export type QuestionSource = 'past-exam' | 'authored' | 'adapted'

export type QuestionType =
  | 'definition'
  | 'comparison'
  | 'true-false'
  | 'code-analysis'
  | 'code-output'
  | 'compilation-error'
  | 'runtime-error'
  | 'design-pattern-choice'
  | 'solid-violation'
  | 'threads-scheduling'
  | 'race-condition-sync'
  | 'java-api'
  | 'client-server-sockets'
  | 'javafx-mvc'
  | 'homework-code'
  | 'blockchain'
  | 'mixed-topics'

export type Confidence = 'high' | 'medium' | 'low'

export interface SourceRef {
  /** manifest file id or a human label, e.g. "lec_4" or "reconstruction_of_time_a" */
  fileId: string
  /** human readable file name for display */
  fileName: string
  /** slide number, page number, or free-text locator */
  locator: string
}

export interface Topic {
  id: string
  order: number
  titleHe: string
  titleEn: string
  lectureRefs: number[]
  examFrequency: 'high' | 'medium' | 'low'
  summary: string
  sectionIds: string[]
}

export interface CodeExample {
  language: string
  code: string
  captionHe?: string
}

export interface StudySection {
  id: string
  topicId: string
  order: number
  headingHe: string
  headingEn: string
  /** Layer 1: simple, human, short explanation of the idea and why it matters */
  intuitionHe: string
  /** Layer 2: precise definitions, differences, rules, API details that can be asked on the exam */
  examKnowledgeHe: string
  /** Layer 3: applied code example / scenario / test question, described in prose */
  applicationHe: string
  keyPoints: string[]
  mustRemember: string[]
  easyToConfuse: string[]
  howProfessorMightAsk: string[]
  codeExamples?: CodeExample[]
  mnemonicHe?: string
  termsHeEn: { he: string; en: string }[]
  sourceRefs: SourceRef[]
  /** ids of quick self-check questions tied to this section */
  checkQuestionIds?: string[]
}

export interface QuestionOption {
  id: 'a' | 'b' | 'c' | 'd' | 'e'
  text: string
}

export interface Question {
  id: string
  topicIds: string[]
  subtopic: string
  stemHe: string
  code?: string
  options: QuestionOption[]
  correctOptionId: QuestionOption['id']
  explanation: string
  optionExplanations: Record<string, string>
  difficulty: Difficulty
  questionType: QuestionType
  source: QuestionSource
  sourceReferences: SourceRef[]
  confidence: Confidence
  basedOnPastExam: boolean
  pastExamYear: number | null
  origin: 'original' | 'reconstruction' | 'adapted' | 'new_past_exam_style' | 'unknown_source' | 'supplemental_generated'
  tags: string[]
  keyLearningPoint: string
  points: number
  active: boolean
  needsReview?: boolean
  /** id of the supplemental question pack this question belongs to; absent for the core 293-question bank */
  packId?: string
  /** Increments when a generated question's stem/options/correctOptionId change materially
   * (e.g. a distractor-quality rewrite) - absent/undefined is equivalent to version 1. Never
   * set on authentic/reconstructed Past Exam questions, which are never rewritten. Lets a
   * future progress-migration step invalidate only the answer record for the changed version,
   * without touching unrelated progress. */
  contentVersion?: number
}

export interface Flashcard {
  id: string
  topicId: string
  frontHe: string
  backHe: string
  code?: string
  difficulty: Difficulty
  source: string
  mnemonic?: string
  commonConfusion?: string
  tags: string[]
}

export interface MockExam {
  id: string
  titleHe: string
  isAuthenticPastExam?: boolean
  questionIds: string[]
  durationMinutesDefault: number
  totalPoints: number
}

export interface PastExamFile {
  id: string
  fileName: string
  year: number | string
  docType: 'official_no_answers' | 'reconstruction' | 'student_solution' | 'handwritten_notes'
  isScanned: boolean
  questionIds: string[]
  warning?: string
}

// ---------------- Progress / runtime state (never bundled with static data) ----------------

export interface TopicMastery {
  topicId: string
  attempts: number
  correct: number
  lastReviewed: string | null
  masteryScore: number // 0-1
}

export interface QuestionStat {
  seen: number
  correct: number
  lastResult: boolean | null
  lastSeenAt: string | null
  guessedLastTime: boolean
  markedDidNotUnderstand: boolean
  saved: boolean
}

export interface MistakeLogEntry {
  id: string
  questionId: string
  timestampISO: string
  chosenOptionId: string
  correctOptionId: string
  topicIds: string[]
  timesWrong: number
  resolved: boolean
  possibleReason?: string
}

export interface MockExamAnswer {
  questionId: string
  chosenOptionId: string | null
  flaggedForReview: boolean
}

export interface MockExamResult {
  id: string
  mockExamId: string
  timestampISO: string
  answers: MockExamAnswer[]
  scorePercent: number
  correctCount: number
  durationSeconds: number
  topicBreakdown: Record<string, { correct: number; total: number }>
  wouldPass55: boolean
}

export interface FlashcardReviewState {
  cardId: string
  box: number // 0-4 leitner-style box
  nextReview: string
  lastRating: 'again' | 'hard' | 'good' | 'easy' | null
  reviewHistory: { timestampISO: string; rating: 'again' | 'hard' | 'good' | 'easy' }[]
}

export interface StudyPlanTask {
  id: string
  day: 1 | 2 | 3
  titleHe: string
  estimatedMinutes: number
  topicIds: string[]
  kind: 'learn' | 'quiz' | 'mock' | 'flashcards' | 'review' | 'diagnostic'
  completed: boolean
}

export interface UserProgress {
  version: 2
  createdAt: string
  diagnosticCompleted: boolean
  topicMastery: Record<string, TopicMastery>
  questionStats: Record<string, QuestionStat>
  mistakeLog: MistakeLogEntry[]
  mockExamResults: MockExamResult[]
  flashcardReviews: Record<string, FlashcardReviewState>
  studiedSectionIds: string[]
  sectionConfidence: Record<string, 1 | 2 | 3 | 4 | 5>
  studyPlan: StudyPlanTask[]
  availableHoursPerDay: { day1: number; day2: number; day3: number }
  settings: {
    theme: 'light' | 'dark' | 'system'
  }
}

export const EMPTY_PROGRESS_VERSION = 2 as const

// ---------------- Supplemental question packs ----------------

export interface QuestionPackMetadata {
  packId: string
  titleHe: string
  titleEn?: string
  description: string
  sourceFiles: string[]
  sourceType: 'official' | 'reconstruction' | 'student-created' | 'unknown'
  year: number | string | null
  dateAdded: string
  confidence: Confidence
  activeQuestionCount: number
  needsReviewCount: number
  topics: string[]
  adaptivePracticeEligible: boolean
  mockExamEligible: boolean
}
