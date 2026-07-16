import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { MockExamAnswer, MockExamResult, Question } from '../types/domain'
import { mockExams, questionsById, activeQuestions, topicsSorted } from '../lib/dataStore'
import { useProgress } from '../lib/ProgressContext'
import { recordMockExamResult } from '../lib/progressActions'
import { ExamRunner } from '../components/exam/ExamRunner'
import { ExamResultView } from '../components/exam/ExamResultView'
import { buildCustomMockExam } from '../lib/mockExamGenerator'
import { PageContainer } from '../components/layout/PageContainer'

const DEFAULT_DURATION = 90 // matches the 1.5h duration seen on the most recent (2024) real exam; configurable below

export function MockExam() {
  const { examId } = useParams()
  const { progress, updateProgress } = useProgress()
  const [useTimer, setUseTimer] = useState(true)
  const [duration, setDuration] = useState(DEFAULT_DURATION)
  const [started, setStarted] = useState(false)
  const [result, setResult] = useState<{ result: MockExamResult; qs: Question[] } | null>(null)

  const selectedExam = mockExams.find((m) => m.id === examId)
  const questions: Question[] = useMemo(() => {
    if (selectedExam) return selectedExam.questionIds.map((id) => questionsById.get(id)).filter((q): q is Question => !!q)
    return []
  }, [selectedExam])

  function handleFinish({ answers, durationSeconds }: { answers: MockExamAnswer[]; durationSeconds: number }) {
    // Compute the new progress first, then apply it via a pure updater and set local
    // result state separately - setState updaters must stay pure (no nested setState calls).
    const { progress: p1, result: r } = recordMockExamResult(progress, examId ?? 'custom', questions, answers, durationSeconds)
    updateProgress(() => p1)
    setResult({ result: r, qs: questions })
  }

  if (!examId) {
    return (
      <PageContainer className="space-y-4">
        <h1 className="text-page-title font-bold">מבחן מדומה</h1>
        <p className="text-body-lg text-[var(--color-text-muted)]">בחר מבחן מדומה מהרשימה:</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {mockExams.map((exam) => (
            <Link key={exam.id} to={`/mock/${exam.id}`} className="text-body-lg block rounded-lg border border-[var(--color-border)] p-4 hover:border-[var(--color-accent)]">
              {exam.titleHe} {exam.isAuthenticPastExam && <span className="text-meta text-[var(--color-text-muted)]">(מבחן עבר אמיתי)</span>}
            </Link>
          ))}
          {mockExams.length === 0 && <p className="text-meta text-[var(--color-text-muted)]">מאגר המבחנים המדומים עדיין לא נטען.</p>}
        </div>
      </PageContainer>
    )
  }

  if (result) {
    const previousResults = progress.mockExamResults.filter((r) => r.mockExamId === examId && r.id !== result.result.id)
    return (
      <>
        <PageContainer size="wide" className="mb-6">
          <h1 className="text-page-title font-bold">{selectedExam?.titleHe ?? 'תוצאות מבחן מדומה'}</h1>
        </PageContainer>
        <ExamResultView result={result.result} questions={result.qs} previousResults={previousResults} />
      </>
    )
  }

  if (started) {
    return (
      <ExamRunner
        questions={questions}
        mode="exam"
        durationMinutes={useTimer ? duration : null}
        title={selectedExam?.titleHe}
        onFinish={handleFinish}
      />
    )
  }

  if (questions.length === 0) {
    return (
      <PageContainer className="space-y-4">
        <p className="text-body-lg text-[var(--color-text-muted)]">מבחן זה עדיין לא זמין, או שמאגר השאלות לא נטען.</p>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="space-y-6">
      <h1 className="text-page-title font-bold">{selectedExam?.titleHe}</h1>
      <p className="text-body-lg text-[var(--color-text-muted)]">20 שאלות, 5 נקודות לכל שאלה, ציון מתוך 100.</p>

      <div className="text-body-lg space-y-3 rounded-xl border border-[var(--color-border)] p-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={useTimer} onChange={(e) => setUseTimer(e.target.checked)} />
          מצב עם טיימר
        </label>
        {useTimer && (
          <label className="flex items-center gap-2">
            משך זמן (דקות):
            <input
              type="number"
              min={10}
              max={240}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-20 rounded border border-[var(--color-border)] bg-transparent p-1"
            />
          </label>
        )}
        <p className="text-meta text-[var(--color-text-muted)]">
          משך המבחן האמיתי אינו ידוע בוודאות מהמקורות (נראו 90 ו-150 דקות במבחני עבר שונים) — ניתן לשנות את הזמן.
        </p>
      </div>

      <button onClick={() => setStarted(true)} className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-base font-medium text-[var(--color-accent-contrast)]">
        התחל מבחן
      </button>
    </PageContainer>
  )
}

export function buildOnDemandMock() {
  return buildCustomMockExam(activeQuestions, topicsSorted)
}
