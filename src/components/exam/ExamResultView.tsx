import type { MockExamResult, Question } from '../../types/domain'
import { topicsById } from '../../lib/dataStore'
import { QuestionCard } from '../question/QuestionCard'
import { shuffleQuestionOptions } from '../../lib/shuffle'
import { PageContainer } from '../layout/PageContainer'

interface ExamResultViewProps {
  result: MockExamResult
  questions: Question[]
  previousResults?: MockExamResult[]
}

export function ExamResultView({ result, questions, previousResults = [] }: ExamResultViewProps) {
  const questionById = new Map(questions.map((q) => [q.id, q]))
  const wrongAnswers = result.answers.filter((a) => {
    const q = questionById.get(a.questionId)
    return q && a.chosenOptionId !== q.correctOptionId
  })

  return (
    <PageContainer size="wide" className="space-y-8">
      <section className="rounded-2xl border border-[var(--color-accent)] p-6 text-center">
        <div className="text-5xl font-bold">{result.scorePercent}</div>
        <div className="text-body-lg text-[var(--color-text-muted)]">מתוך 100 · {result.correctCount} מתוך {questions.length} נכונות</div>
        <div className={`text-body-lg mt-2 font-medium ${result.wouldPass55 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
          {result.wouldPass55 ? 'ציון עובר (מעל 55)' : 'ציון לא עובר (מתחת ל-55)'}
        </div>
        <div className="text-meta mt-1 text-[var(--color-text-muted)]">
          זמן: {Math.floor(result.durationSeconds / 60)} דקות {result.durationSeconds % 60} שניות
        </div>
      </section>

      <section>
        <h2 className="text-section-title mb-3 font-bold">פירוט לפי נושא</h2>
        <div className="space-y-2">
          {Object.entries(result.topicBreakdown).map(([topicId, breakdown]) => {
            const topic = topicsById.get(topicId)
            const pct = breakdown.total > 0 ? Math.round((breakdown.correct / breakdown.total) * 100) : 0
            return (
              <div key={topicId} className="text-meta flex items-center gap-3">
                <span className="w-40 shrink-0">{topic?.titleHe ?? topicId}</span>
                <div className="h-2 flex-1 rounded-full bg-[var(--color-bg-subtle)]">
                  <div className="h-2 rounded-full bg-[var(--color-accent)]" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-16 shrink-0 text-end text-[var(--color-text-muted)]">
                  {breakdown.correct}/{breakdown.total}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {previousResults.length > 0 && (
        <section>
          <h2 className="text-section-title mb-2 font-bold">השוואה למבחנים קודמים</h2>
          <div className="flex gap-2">
            {previousResults.map((r) => (
              <span key={r.id} className="text-meta rounded-full bg-[var(--color-bg-subtle)] px-3 py-1">
                {r.scorePercent}
              </span>
            ))}
            <span className="text-meta rounded-full bg-[var(--color-accent)] px-3 py-1 text-[var(--color-accent-contrast)]">{result.scorePercent} (נוכחי)</span>
          </div>
        </section>
      )}

      {wrongAnswers.length > 0 && (
        <section>
          <h2 className="text-section-title mb-3 font-bold">טעויות והסברים</h2>
          <div className="space-y-6">
            {wrongAnswers.map((a) => {
              const q = questionById.get(a.questionId)
              if (!q) return null
              const shuffledForDisplay = shuffleQuestionOptions(q, Math.random)
              const selectedDisplayId = a.chosenOptionId
                ? Object.entries(shuffledForDisplay.displayToOriginal).find(([, orig]) => orig === a.chosenOptionId)?.[0] ?? null
                : null
              return (
                <div key={a.questionId} className="rounded-xl border border-[var(--color-border)] p-4">
                  <QuestionCard question={shuffledForDisplay} selectedOptionId={selectedDisplayId} revealed onSelect={() => {}} />
                </div>
              )
            })}
          </div>
        </section>
      )}
    </PageContainer>
  )
}
