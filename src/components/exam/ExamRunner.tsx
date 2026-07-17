import { useMemo, useState } from 'react'
import type { MockExamAnswer, Question } from '../../types/domain'
import { stableShuffleQuestionOptions, type ShuffledQuestion } from '../../lib/shuffle'
import { QuestionCard } from '../question/QuestionCard'
import { ExamTimer } from './ExamTimer'
import { PageContainer } from '../layout/PageContainer'
import { BidiText } from '../shared/BidiText'

export type ExamMode = 'exam' | 'practice'

interface ExamRunnerProps {
  questions: Question[]
  mode: ExamMode
  durationMinutes?: number | null
  onFinish: (result: { answers: MockExamAnswer[]; durationSeconds: number }) => void
  onAnswerPractice?: (question: Question, chosenOptionId: string, correct: boolean) => void
  title?: string
}

export function ExamRunner({ questions, mode, durationMinutes = null, onFinish, onAnswerPractice, title }: ExamRunnerProps) {
  // Lazy initializer: the recognized React pattern for a one-time impure read (exam start time).
  const [startedAt] = useState(() => ({ current: Date.now() }))
  // Lazy initializer: a per-mount attempt id, stable for this attempt's lifetime, so the
  // seeded shuffle below stays deterministic across re-renders without depending on the
  // `questions` array reference alone - a fresh attempt (a new mount) draws a new id.
  const [attemptId] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const shuffled: ShuffledQuestion[] = useMemo(
    () => questions.map((q) => stableShuffleQuestionOptions(q, `${attemptId}:${q.id}`)),
    [questions, attemptId],
  )

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  const current = shuffled[index]
  if (!current) return null

  function buildAnswers(): MockExamAnswer[] {
    return shuffled.map((q) => {
      const displayChoice = answers[q.id]
      const original = displayChoice ? (q.displayToOriginal[displayChoice] ?? displayChoice) : null
      return { questionId: q.id, chosenOptionId: original, flaggedForReview: !!flagged[q.id] }
    })
  }

  function finish() {
    const durationSeconds = Math.round((Date.now() - startedAt.current) / 1000)
    onFinish({ answers: buildAnswers(), durationSeconds })
  }

  function handleSubmitClick() {
    if (mode === 'exam' && answeredCount < shuffled.length) {
      const remaining = shuffled.length - answeredCount
      if (!confirm(`נותרו ${remaining} שאלות שלא נענו. להגיש את המבחן בכל זאת?`)) return
    }
    finish()
  }

  function selectOption(optionId: string) {
    const q = current!
    setAnswers((prev) => ({ ...prev, [q.id]: optionId }))
    if (mode === 'practice') {
      setRevealed((prev) => ({ ...prev, [q.id]: true }))
      const original = q.displayToOriginal[optionId] ?? optionId
      const originalQuestion = questions.find((qq) => qq.id === q.id)!
      // Pass the ORIGINAL (unshuffled) option id - callers compare it against
      // question.correctOptionId, which is always in original id-space.
      onAnswerPractice?.(originalQuestion, original, original === originalQuestion.correctOptionId)
    }
  }

  const answeredCount = Object.keys(answers).length
  const isLast = index === shuffled.length - 1

  return (
    <PageContainer size="wide" className="space-y-6">
      <h1 className="sr-only">{title ?? (mode === 'exam' ? 'מבחן פעיל' : 'תרגול פעיל')}</h1>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          {title && <BidiText as="h2" className="text-section-title font-bold" text={title} />}
          <p className="text-meta text-[var(--color-text-muted)]">
            שאלה {index + 1} מתוך {shuffled.length} · נענו: {answeredCount}
          </p>
        </div>
        <ExamTimer durationMinutes={mode === 'exam' ? durationMinutes : null} onExpire={mode === 'exam' ? finish : undefined} />
      </div>

      {mode === 'exam' && (
        <div className="flex flex-wrap gap-1.5">
          {shuffled.map((q, i) => {
            const isAnswered = !!answers[q.id]
            const isFlagged = !!flagged[q.id]
            const isCurrent = i === index
            return (
              <button
                key={q.id}
                onClick={() => setIndex(i)}
                className={`h-10 w-10 rounded text-sm font-medium ${
                  isCurrent
                    ? 'ring-2 ring-[var(--color-accent)]'
                    : isFlagged
                      ? 'bg-[var(--color-warning)]/30'
                      : isAnswered
                        ? 'bg-[var(--color-success)]/20'
                        : 'bg-[var(--color-bg-subtle)]'
                }`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      )}

      <QuestionCard
        question={current}
        selectedOptionId={answers[current.id] ?? null}
        revealed={mode === 'practice' && !!revealed[current.id]}
        onSelect={selectOption}
      />

      <div className="flex items-center justify-between">
        <button
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-base disabled:opacity-40"
        >
          הקודם
        </button>

        {mode === 'exam' && (
          <button
            onClick={() => setFlagged((prev) => ({ ...prev, [current.id]: !prev[current.id] }))}
            className="rounded-lg border border-[var(--color-warning)] px-4 py-2.5 text-base text-[var(--color-warning)]"
          >
            {flagged[current.id] ? 'בטל סימון' : 'סמן לחזרה'}
          </button>
        )}

        {isLast ? (
          <button onClick={handleSubmitClick} className="rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-base font-medium text-[var(--color-accent-contrast)]">
            {mode === 'exam' ? 'הגש מבחן' : 'סיים תרגול'}
          </button>
        ) : (
          <button
            onClick={() => setIndex((i) => Math.min(shuffled.length - 1, i + 1))}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-base font-medium text-[var(--color-accent-contrast)]"
          >
            הבא
          </button>
        )}
      </div>
    </PageContainer>
  )
}
