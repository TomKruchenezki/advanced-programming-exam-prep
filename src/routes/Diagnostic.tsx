import { useMemo, useState } from 'react'
import type { MockExamResult, Question } from '../types/domain'
import { activeQuestions, topicsSorted } from '../lib/dataStore'
import { selectDiagnosticQuestions } from '../lib/adaptiveSelector'
import { useProgress } from '../lib/ProgressContext'
import { recordMockExamResult, markDiagnosticComplete } from '../lib/progressActions'
import { ExamRunner } from '../components/exam/ExamRunner'
import { ExamResultView } from '../components/exam/ExamResultView'
import { PageContainer } from '../components/layout/PageContainer'
import type { MockExamAnswer } from '../types/domain'

export function Diagnostic() {
  const { progress, updateProgress } = useProgress()
  const [started, setStarted] = useState(false)
  const [result, setResult] = useState<{ result: MockExamResult; qs: Question[] } | null>(null)

  const pool = useMemo(() => selectDiagnosticQuestions(activeQuestions, topicsSorted, 30), [])

  function handleFinish({ answers, durationSeconds }: { answers: MockExamAnswer[]; durationSeconds: number }) {
    // Compute the new progress first, then apply it via a pure updater and set local
    // result state separately - setState updaters must stay pure (no nested setState calls).
    const { progress: p1, result: r } = recordMockExamResult(progress, 'diagnostic', pool, answers, durationSeconds)
    const p2 = markDiagnosticComplete(p1)
    updateProgress(() => p2)
    setResult({ result: r, qs: pool })
  }

  if (result) {
    return (
      <>
        <PageContainer size="wide" className="mb-6 space-y-2">
          <h1 className="text-2xl font-bold">תוצאות מבחן האבחון</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            זהו מבחן אבחון בלבד — מטרתו למפות מה אתה כבר יודע ומה כדאי להתמקד בו. אל תתייחס לציון כמבחן אמיתי.
          </p>
        </PageContainer>
        <ExamResultView result={result.result} questions={result.qs} />
      </>
    )
  }

  if (started) {
    return <ExamRunner questions={pool} mode="exam" durationMinutes={null} title="מבחן אבחון" onFinish={handleFinish} />
  }

  return (
    <PageContainer className="space-y-4">
      <h1 className="text-2xl font-bold">מבחן אבחון</h1>
      <p className="text-sm text-[var(--color-text-muted)]">
        {progress.diagnosticCompleted
          ? 'כבר ביצעת מבחן אבחון בעבר. ניתן לבצע שוב כדי לרענן את המיפוי.'
          : '30 שאלות הפזורות על פני כל נושאי הקורס. אין ציון עובר/נכשל — המטרה היא לבנות עבורך תוכנית לימוד ממוקדת. אל תתייחס לתוצאה כשיפוט.'}
      </p>
      <button onClick={() => setStarted(true)} className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-[var(--color-accent-contrast)]">
        התחל מבחן אבחון
      </button>
    </PageContainer>
  )
}
