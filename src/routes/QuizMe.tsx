import { useState } from 'react'
import type { Difficulty, Question } from '../types/domain'
import { activeQuestions, topicsSorted } from '../lib/dataStore'
import { selectAdaptiveQuestions } from '../lib/adaptiveSelector'
import { useProgress } from '../lib/ProgressContext'
import { recordPracticeAnswer } from '../lib/progressActions'
import { ExamRunner } from '../components/exam/ExamRunner'
import { shuffleArray } from '../lib/shuffle'
import { PageContainer } from '../components/layout/PageContainer'

type FilterMode = 'adaptive' | 'topic' | 'difficulty' | 'past-exam-only' | 'past-exam-style' | 'code' | 'definitions' | 'mistakes' | 'flagged' | 'unseen'

const SIZE_OPTIONS = [5, 10, 20] as const

export function QuizMe() {
  const { progress, updateProgress } = useProgress()
  const [mode, setMode] = useState<FilterMode>('adaptive')
  const [topicId, setTopicId] = useState<string>(topicsSorted[0]?.id ?? '')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [size, setSize] = useState<(typeof SIZE_OPTIONS)[number]>(10)
  const [session, setSession] = useState<Question[] | null>(null)
  const [lastGuessFlag, setLastGuessFlag] = useState(false)

  function buildPool(): Question[] {
    switch (mode) {
      case 'adaptive':
        return selectAdaptiveQuestions(activeQuestions, topicsSorted, progress, { count: size })
      case 'topic':
        return shuffleArray(activeQuestions.filter((q) => q.topicIds.includes(topicId))).slice(0, size)
      case 'difficulty':
        return shuffleArray(activeQuestions.filter((q) => q.difficulty === difficulty)).slice(0, size)
      case 'past-exam-only':
        return shuffleArray(activeQuestions.filter((q) => q.source === 'past-exam')).slice(0, size)
      case 'past-exam-style':
        return shuffleArray(activeQuestions.filter((q) => q.origin === 'new_past_exam_style' || q.source === 'past-exam')).slice(0, size)
      case 'code':
        return shuffleArray(activeQuestions.filter((q) => !!q.code || q.questionType.startsWith('code'))).slice(0, size)
      case 'definitions':
        return shuffleArray(activeQuestions.filter((q) => q.questionType === 'definition')).slice(0, size)
      case 'mistakes': {
        const wrongIds = new Set(progress.mistakeLog.filter((m) => !m.resolved).map((m) => m.questionId))
        return shuffleArray(activeQuestions.filter((q) => wrongIds.has(q.id))).slice(0, size)
      }
      case 'flagged': {
        const savedIds = new Set(Object.entries(progress.questionStats).filter(([, s]) => s.saved).map(([id]) => id))
        return shuffleArray(activeQuestions.filter((q) => savedIds.has(q.id))).slice(0, size)
      }
      case 'unseen':
        return shuffleArray(activeQuestions.filter((q) => !progress.questionStats[q.id])).slice(0, size)
    }
  }

  const canStart = buildPool().length > 0

  function start() {
    setSession(buildPool())
  }

  function handleAnswer(question: Question, _chosenOptionId: string, _correct: boolean) {
    updateProgress((prev) => recordPracticeAnswer(prev, question, _chosenOptionId, { guessed: lastGuessFlag }))
    setLastGuessFlag(false)
  }

  if (session) {
    return (
      <ExamRunner
        questions={session}
        mode="practice"
        title="תרגול"
        onAnswerPractice={handleAnswer}
        onFinish={() => setSession(null)}
      />
    )
  }

  return (
    <PageContainer className="space-y-6">
      <h1 className="text-page-title font-bold">תרגול (Quiz Me)</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="text-body-lg mb-1 block font-medium">סוג תרגול</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as FilterMode)} className="text-body-lg w-full rounded-lg border border-[var(--color-border)] bg-transparent p-2.5">
            <option value="adaptive">אדפטיבי (מומלץ)</option>
            <option value="topic">לפי נושא</option>
            <option value="difficulty">לפי רמת קושי</option>
            <option value="past-exam-only">שאלות ממבחני עבר בלבד</option>
            <option value="past-exam-style">שאלות בסגנון מבחני עבר</option>
            <option value="code">שאלות קוד</option>
            <option value="definitions">שאלות הגדרות</option>
            <option value="mistakes">שאלות שטעיתי בהן</option>
            <option value="flagged">שאלות ששמרתי</option>
            <option value="unseen">שאלות שלא ראיתי</option>
          </select>
        </div>

        {mode === 'topic' && (
          <div>
            <label className="text-body-lg mb-1 block font-medium">נושא</label>
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="text-body-lg w-full rounded-lg border border-[var(--color-border)] bg-transparent p-2.5">
              {topicsSorted.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titleHe}
                </option>
              ))}
            </select>
          </div>
        )}

        {mode === 'difficulty' && (
          <div>
            <label className="text-body-lg mb-1 block font-medium">רמת קושי</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="text-body-lg w-full rounded-lg border border-[var(--color-border)] bg-transparent p-2.5">
              <option value="easy">קלות</option>
              <option value="medium">בינוניות</option>
              <option value="hard">קשות</option>
            </select>
          </div>
        )}

        <div>
          <label className="text-body-lg mb-1 block font-medium">מספר שאלות</label>
          <div className="flex gap-2">
            {SIZE_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`rounded-lg border px-4 py-2 text-base ${size === s ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'border-[var(--color-border)]'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        disabled={!canStart}
        onClick={start}
        className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-base font-medium text-[var(--color-accent-contrast)] disabled:opacity-40"
      >
        התחל תרגול
      </button>
      {!canStart && <p className="text-meta text-[var(--color-text-muted)]">אין שאלות זמינות לפי הסינון הנוכחי (ייתכן שמאגר השאלות עדיין לא נטען).</p>}
    </PageContainer>
  )
}
