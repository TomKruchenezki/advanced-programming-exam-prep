import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { MockExamAnswer, MockExamResult, Question } from '../types/domain'
import { pastExamIndex, questionsById } from '../lib/dataStore'
import { useProgress } from '../lib/ProgressContext'
import { recordMockExamResult } from '../lib/progressActions'
import { ExamRunner } from '../components/exam/ExamRunner'
import { ExamResultView } from '../components/exam/ExamResultView'
import { PageContainer } from '../components/layout/PageContainer'

const DOC_TYPE_LABEL: Record<string, string> = {
  official_no_answers: 'מבחן רשמי (ללא תשובות)',
  reconstruction: 'שחזור מבחן',
  student_solution: 'פתרון סטודנט (סרוק)',
  handwritten_notes: 'הערות כתב יד',
}

export function PastExams() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const { progress, updateProgress } = useProgress()
  const [result, setResult] = useState<{ result: MockExamResult; qs: Question[] } | null>(null)

  const selected = pastExamIndex.find((e) => e.id === examId)
  const questions = useMemo(() => (selected ? selected.questionIds.map((id) => questionsById.get(id)).filter((q): q is Question => !!q) : []), [selected])

  function handleFinish({ answers, durationSeconds }: { answers: MockExamAnswer[]; durationSeconds: number }) {
    // Compute the new progress first, then apply it via a pure updater and set local
    // result state separately - setState updaters must stay pure (no nested setState calls).
    const { progress: p1, result: r } = recordMockExamResult(progress, `past-${examId}`, questions, answers, durationSeconds)
    updateProgress(() => p1)
    setResult({ result: r, qs: questions })
  }

  if (!examId) {
    return (
      <PageContainer className="space-y-4">
        <h1 className="text-2xl font-bold">מבחני עבר</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          מבחנים שחוזרו על ידי סטודנטים אינם בהכרח מדויקים — התשובות המוצגות במערכת עברו אימות מול חומר הקורס ככל האפשר, ואינן מבוססות באופן עיוור על סימון הסטודנט.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {pastExamIndex.map((exam) => (
            <button
              key={exam.id}
              onClick={() => navigate(`/past-exams/${exam.id}`)}
              className="block w-full rounded-lg border border-[var(--color-border)] p-3 text-start text-sm hover:border-[var(--color-accent)]"
            >
              <div className="flex items-center justify-between">
                <span>מבחן {exam.year}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{DOC_TYPE_LABEL[exam.docType]}</span>
              </div>
              {exam.isScanned && <span className="text-xs text-[var(--color-warning)]">מסמך סרוק — עבר תמלול ואימות ידני</span>}
              {exam.warning && <p className="mt-1 text-xs text-[var(--color-danger)]">{exam.warning}</p>}
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{exam.questionIds.length} שאלות זמינות</p>
            </button>
          ))}
          {pastExamIndex.length === 0 && <p className="text-xs text-[var(--color-text-muted)]">מאגר מבחני העבר עדיין לא נטען.</p>}
        </div>
      </PageContainer>
    )
  }

  if (result) {
    return (
      <>
        <PageContainer size="wide" className="mb-6">
          <h1 className="text-2xl font-bold">תוצאות — מבחן {selected?.year}</h1>
        </PageContainer>
        <ExamResultView result={result.result} questions={result.qs} />
      </>
    )
  }

  if (questions.length === 0) {
    return (
      <PageContainer>
        <p className="text-sm text-[var(--color-text-muted)]">מבחן זה עדיין לא זמין.</p>
      </PageContainer>
    )
  }

  return <ExamRunner questions={questions} mode="exam" durationMinutes={null} title={`מבחן ${selected?.year}`} onFinish={handleFinish} />
}
