import type { MockExamAnswer, MockExamResult, Question, UserProgress } from '../types/domain'
import { computeMasteryScore, difficultyWeight, scoreMockExam } from './scoring'

function updateTopicMastery(progress: UserProgress, topicId: string, correct: boolean, weight: number): UserProgress {
  const existing = progress.topicMastery[topicId] ?? { topicId, attempts: 0, correct: 0, lastReviewed: null, masteryScore: 0 }
  const attempts = existing.attempts + 1
  const correctCount = existing.correct + (correct ? 1 : 0)
  // Reconstruct weighted sums from stored aggregates isn't exact across weight changes,
  // but using attempts as the confidence denominator and a weighted running average is
  // a reasonable, simple approximation that satisfies "never 100% after one question".
  const prevWeightedTotal = existing.attempts // approximate: 1 unit per prior attempt
  const prevWeightedCorrect = existing.masteryScore * prevWeightedTotal
  const weightedTotalSum = prevWeightedTotal + weight
  const weightedCorrectSum = prevWeightedCorrect + (correct ? weight : 0)
  const masteryScore = computeMasteryScore({ attempts, weightedCorrectSum, weightedTotalSum })

  return {
    ...progress,
    topicMastery: {
      ...progress.topicMastery,
      [topicId]: { topicId, attempts, correct: correctCount, lastReviewed: new Date().toISOString(), masteryScore },
    },
  }
}

export interface RecordAnswerOptions {
  guessed?: boolean
  markedDidNotUnderstand?: boolean
}

/**
 * Updates questionStats and mistakeLog for a single answered question. Shared by practice
 * mode and mock/diagnostic/past-exam mode so mistakes made under ANY mode land in the
 * Mistake Notebook and feed the adaptive selector - not just Quiz Me practice answers.
 * `chosenOptionId` is null for questions left unanswered (e.g. an exam ran out of time).
 */
function recordQuestionOutcome(progress: UserProgress, question: Question, chosenOptionId: string | null, options: RecordAnswerOptions = {}): UserProgress {
  const correct = chosenOptionId !== null && chosenOptionId === question.correctOptionId
  let next = progress

  const prevStat = next.questionStats[question.id]
  next = {
    ...next,
    questionStats: {
      ...next.questionStats,
      [question.id]: {
        seen: (prevStat?.seen ?? 0) + 1,
        correct: (prevStat?.correct ?? 0) + (correct ? 1 : 0),
        lastResult: chosenOptionId === null ? prevStat?.lastResult ?? null : correct,
        lastSeenAt: new Date().toISOString(),
        guessedLastTime: !!options.guessed,
        markedDidNotUnderstand: !!options.markedDidNotUnderstand,
        saved: prevStat?.saved ?? false,
      },
    },
  }

  if (!correct && chosenOptionId !== null) {
    const existingMistakeIdx = next.mistakeLog.findIndex((m) => m.questionId === question.id && !m.resolved)
    if (existingMistakeIdx >= 0) {
      const updated = next.mistakeLog.slice()
      const entry = updated[existingMistakeIdx]!
      updated[existingMistakeIdx] = { ...entry, timesWrong: entry.timesWrong + 1, timestampISO: new Date().toISOString(), chosenOptionId }
      next = { ...next, mistakeLog: updated }
    } else {
      next = {
        ...next,
        mistakeLog: [
          ...next.mistakeLog,
          {
            id: `mistake-${question.id}-${Date.now()}`,
            questionId: question.id,
            timestampISO: new Date().toISOString(),
            chosenOptionId,
            correctOptionId: question.correctOptionId,
            topicIds: question.topicIds,
            timesWrong: 1,
            resolved: false,
            possibleReason: options.guessed ? 'ניחוש' : options.markedDidNotUnderstand ? 'לא הובן החומר' : undefined,
          },
        ],
      }
    }
  } else if (correct) {
    // Mark any unresolved mistake for this question as resolved once answered correctly.
    next = {
      ...next,
      mistakeLog: next.mistakeLog.map((m) => (m.questionId === question.id && !m.resolved ? { ...m, resolved: true } : m)),
    }
  }

  return next
}

export function recordPracticeAnswer(progress: UserProgress, question: Question, chosenOptionId: string, options: RecordAnswerOptions = {}): UserProgress {
  const correct = chosenOptionId === question.correctOptionId
  let next = recordQuestionOutcome(progress, question, chosenOptionId, options)

  const weight = difficultyWeight(question.difficulty)
  for (const topicId of question.topicIds) {
    next = updateTopicMastery(next, topicId, correct, weight)
  }

  return next
}

export function recordMockExamResult(progress: UserProgress, mockExamId: string, questions: Question[], answers: MockExamAnswer[], durationSeconds: number): { progress: UserProgress; result: MockExamResult } {
  const scored = scoreMockExam(questions, answers)
  let next = progress

  const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a]))
  const weight = 2.5 // mock exam performance weighted more heavily than casual quiz answers
  for (const q of questions) {
    const answer = answerByQuestionId.get(q.id)
    const correct = !!answer && answer.chosenOptionId === q.correctOptionId

    next = recordQuestionOutcome(next, q, answer?.chosenOptionId ?? null)
    for (const topicId of q.topicIds) {
      next = updateTopicMastery(next, topicId, correct, weight)
    }
  }

  const result: MockExamResult = {
    id: `mockresult-${Date.now()}`,
    mockExamId,
    timestampISO: new Date().toISOString(),
    answers,
    scorePercent: scored.scorePercent,
    correctCount: scored.correctCount,
    durationSeconds,
    topicBreakdown: scored.topicBreakdown,
    wouldPass55: scored.wouldPass55,
  }

  next = { ...next, mockExamResults: [...next.mockExamResults, result] }
  return { progress: next, result }
}

export function markDiagnosticComplete(progress: UserProgress): UserProgress {
  return { ...progress, diagnosticCompleted: true }
}
