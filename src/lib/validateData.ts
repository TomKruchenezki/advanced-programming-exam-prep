import type { Flashcard, MockExam, Question, Topic } from '../types/domain'

export interface ValidationIssue {
  severity: 'error' | 'warning'
  message: string
  itemId?: string
}

const OPTION_IDS = ['a', 'b', 'c', 'd', 'e']

function normalizeStem(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function validateQuestions(
  questions: Question[],
  topics: Topic[],
  options?: { pastExamIds?: Set<string> },
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const topicIds = new Set(topics.map((t) => t.id))
  const seenIds = new Set<string>()
  const stemSeen = new Map<string, string>()
  const pastExamIds = options?.pastExamIds ?? new Set<string>()

  for (const q of questions) {
    if (seenIds.has(q.id)) {
      issues.push({ severity: 'error', message: `Duplicate question id: ${q.id}`, itemId: q.id })
    }
    seenIds.add(q.id)

    if (!q.stemHe || !q.stemHe.trim()) {
      issues.push({ severity: 'error', message: 'Empty question stem', itemId: q.id })
    }

    // Most questions have 5 options, but a small number of authentic Past Exam questions
    // genuinely only had 4 options on the real paper (verified against source transcripts) -
    // padding those to 5 with an invented distractor would misrepresent the real exam, so 4 is
    // accepted too. What must never happen is a duplicate or out-of-range option id.
    if (q.options.length !== 5 && q.options.length !== 4) {
      issues.push({ severity: 'error', message: `Expected 4 or 5 options, got ${q.options.length}`, itemId: q.id })
    }
    const optionIdsPresent = q.options.map((o) => o.id)
    if (new Set(optionIdsPresent).size !== optionIdsPresent.length) {
      issues.push({ severity: 'error', message: 'Duplicate option id within question', itemId: q.id })
    }
    for (const id of optionIdsPresent) {
      if (!OPTION_IDS.includes(id)) {
        issues.push({ severity: 'error', message: `Invalid option id "${id}"`, itemId: q.id })
      }
    }
    const optionTexts = q.options.map((o) => o.text.trim().toLowerCase())
    if (new Set(optionTexts).size !== optionTexts.length) {
      issues.push({ severity: 'error', message: 'Duplicate option text within question', itemId: q.id })
    }
    if (!optionIdsPresent.includes(q.correctOptionId)) {
      issues.push({ severity: 'error', message: `correctOptionId "${q.correctOptionId}" not among options`, itemId: q.id })
    }

    if (!q.explanation || !q.explanation.trim()) {
      issues.push({ severity: 'error', message: 'Missing explanation', itemId: q.id })
    }
    for (const optId of optionIdsPresent) {
      if (!q.optionExplanations[optId] || !q.optionExplanations[optId]?.trim()) {
        issues.push({ severity: 'error', message: `Missing optionExplanations["${optId}"]`, itemId: q.id })
      }
    }

    for (const topicId of q.topicIds) {
      if (!topicIds.has(topicId)) {
        issues.push({ severity: 'error', message: `Unknown topicId "${topicId}"`, itemId: q.id })
      }
    }
    if (q.topicIds.length === 0) {
      issues.push({ severity: 'error', message: 'Question has no topicIds', itemId: q.id })
    }

    if (q.needsReview && q.active) {
      issues.push({ severity: 'error', message: 'Question marked needsReview but still active', itemId: q.id })
    }

    if (q.active && !q.needsReview) {
      // Include the code snippet in the fingerprint: many code-output questions share a
      // generic Hebrew prompt ("what does this code print?") but differ entirely in the
      // actual code, so stem-only comparison produces false-positive duplicates.
      const norm = normalizeStem(q.stemHe + '\n' + (q.code ?? ''))
      const existing = stemSeen.get(norm)
      if (existing) {
        issues.push({ severity: 'warning', message: `Possible duplicate stem with ${existing}`, itemId: q.id })
      } else {
        stemSeen.set(norm, q.id)
      }
    }

    // Length-based guessing cue: warn (never error) when the correct option is both the
    // longest of the five and much longer than the typical distractor - a test-taker could
    // learn to just pick the longest answer without knowing the material. Authentic Past Exam
    // questions (by id or by reconstruction/adapted origin) are explicitly exempt: their
    // wording is real exam evidence and must never be flagged or altered for this reason.
    const isPastExamProtected = pastExamIds.has(q.id) || q.origin === 'reconstruction' || q.origin === 'adapted'
    if (q.active && !q.needsReview && !isPastExamProtected && q.options.length === 5) {
      const correctText = q.options.find((o) => o.id === q.correctOptionId)?.text ?? ''
      const correctLen = correctText.length
      const distractorLens = q.options
        .filter((o) => o.id !== q.correctOptionId)
        .map((o) => o.text.length)
        .sort((a, b) => a - b)
      const median = distractorLens[Math.floor(distractorLens.length / 2)] ?? 0
      const isLongest = correctLen === Math.max(correctLen, ...distractorLens)
      if (median > 0 && isLongest && correctLen / median >= 2.5) {
        issues.push({
          severity: 'warning',
          message: `Correct option is the longest by a wide margin (${correctLen} vs median distractor ${median} chars) - possible length-based guessing cue`,
          itemId: q.id,
        })
      }
    }
  }

  return issues
}

export function validateFlashcards(cards: Flashcard[], topics: Topic[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const topicIds = new Set(topics.map((t) => t.id))
  const seen = new Set<string>()
  for (const c of cards) {
    if (seen.has(c.id)) issues.push({ severity: 'error', message: `Duplicate flashcard id: ${c.id}`, itemId: c.id })
    seen.add(c.id)
    if (!c.frontHe?.trim() || !c.backHe?.trim()) {
      issues.push({ severity: 'error', message: 'Flashcard missing front or back text', itemId: c.id })
    }
    if (!topicIds.has(c.topicId)) {
      issues.push({ severity: 'error', message: `Unknown topicId "${c.topicId}"`, itemId: c.id })
    }
  }
  return issues
}

export function validateMockExams(exams: MockExam[], questionsById: Map<string, Question>): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const exam of exams) {
    if (exam.questionIds.length !== 20) {
      issues.push({ severity: 'error', message: `Mock exam must have exactly 20 questions, got ${exam.questionIds.length}`, itemId: exam.id })
    }
    if (new Set(exam.questionIds).size !== exam.questionIds.length) {
      issues.push({ severity: 'error', message: 'Duplicate question ids within mock exam', itemId: exam.id })
    }
    let totalPoints = 0
    for (const qid of exam.questionIds) {
      const q = questionsById.get(qid)
      if (!q) {
        issues.push({ severity: 'error', message: `Mock exam references unknown question id ${qid}`, itemId: exam.id })
        continue
      }
      totalPoints += q.points
    }
    if (totalPoints !== exam.totalPoints || totalPoints !== 100) {
      issues.push({ severity: 'error', message: `Mock exam points sum to ${totalPoints}, expected 100`, itemId: exam.id })
    }
  }
  return issues
}
