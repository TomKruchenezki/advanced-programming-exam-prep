import { useState } from 'react'
import type { Difficulty, Question } from '../types/domain'
import { topicsById } from '../lib/dataStore'
import { packs, packQuestions, activePackQuestions } from '../lib/questionPackStore'
import { useProgress } from '../lib/ProgressContext'
import { recordPracticeAnswer } from '../lib/progressActions'
import { ExamRunner } from '../components/exam/ExamRunner'
import { shuffleArray } from '../lib/shuffle'
import { PageContainer } from '../components/layout/PageContainer'
import { SupplementalBadge } from '../components/question/SupplementalBadge'
import { BidiText } from '../components/shared/BidiText'

type TopicFilter = 'all' | string
type DifficultyFilter = 'all' | Difficulty
type ConfidenceFilter = 'all' | 'high-only'
type SeenFilter = 'all' | 'unseen' | 'incorrect' | 'saved'

const SOURCE_TYPE_LABEL: Record<string, string> = {
  official: 'רשמי',
  reconstruction: 'שחזור',
  'student-created': 'נוצר על ידי סטודנט',
  unknown: 'מקור לא ידוע',
}

export function SupplementalQuestions() {
  const { progress, updateProgress } = useProgress()
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)
  const [topicFilter, setTopicFilter] = useState<TopicFilter>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>('all')
  const [seenFilter, setSeenFilter] = useState<SeenFilter>('all')
  const [session, setSession] = useState<Question[] | null>(null)
  const [lastGuessFlag, setLastGuessFlag] = useState(false)

  function poolForPack(packId: string): Question[] {
    let pool = activePackQuestions.filter((q) => q.packId === packId)
    if (topicFilter !== 'all') pool = pool.filter((q) => q.topicIds.includes(topicFilter))
    if (difficultyFilter !== 'all') pool = pool.filter((q) => q.difficulty === difficultyFilter)
    if (confidenceFilter === 'high-only') pool = pool.filter((q) => q.confidence === 'high')
    if (seenFilter === 'unseen') pool = pool.filter((q) => !progress.questionStats[q.id])
    if (seenFilter === 'incorrect') {
      const wrongIds = new Set(progress.mistakeLog.filter((m) => !m.resolved).map((m) => m.questionId))
      pool = pool.filter((q) => wrongIds.has(q.id))
    }
    if (seenFilter === 'saved') {
      const savedIds = new Set(Object.entries(progress.questionStats).filter(([, s]) => s.saved).map(([id]) => id))
      pool = pool.filter((q) => savedIds.has(q.id))
    }
    return pool
  }

  function startPractice(packId: string) {
    const pool = shuffleArray(poolForPack(packId))
    if (pool.length === 0) return
    setSelectedPackId(packId)
    setSession(pool)
  }

  function handleAnswer(question: Question, chosenOptionId: string, _correct: boolean) {
    updateProgress((prev) => recordPracticeAnswer(prev, question, chosenOptionId, { guessed: lastGuessFlag }))
    setLastGuessFlag(false)
  }

  if (session) {
    const pack = packs.find((p) => p.packId === selectedPackId)
    return (
      <ExamRunner
        questions={session}
        mode="practice"
        title={pack ? `שאלות נוספות — ${pack.titleHe}` : 'שאלות נוספות'}
        onAnswerPractice={handleAnswer}
        onFinish={() => {
          setSession(null)
          setSelectedPackId(null)
        }}
      />
    )
  }

  const allTopicIds = [...new Set(packQuestions.flatMap((q) => q.topicIds))]

  return (
    <PageContainer size="wide" className="space-y-6">
      <div>
        <h1 className="text-page-title font-bold">שאלות נוספות</h1>
        <p className="text-body-lg mt-2 text-[var(--color-text-muted)]">
          שאלות ממאגרים משלימים, שחולצו ואומתו ממקורות תרגול נוספים ולא מהמאגר המרכזי המאומת. השתמשו בהן כתרגול נוסף - הן משתמשות באותה
          מערכת התקדמות, מחברת טעויות ו-mastery כמו שאר האפליקציה.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="text-body-lg mb-1 block font-medium">נושא</label>
          <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className="text-body-lg w-full rounded-lg border border-[var(--color-border)] bg-transparent p-2.5">
            <option value="all">כל הנושאים</option>
            {allTopicIds.map((tid) => (
              <option key={tid} value={tid}>
                {topicsById.get(tid)?.titleHe ?? tid}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-body-lg mb-1 block font-medium">רמת קושי</label>
          <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)} className="text-body-lg w-full rounded-lg border border-[var(--color-border)] bg-transparent p-2.5">
            <option value="all">כל הרמות</option>
            <option value="easy">קלות</option>
            <option value="medium">בינוניות</option>
            <option value="hard">קשות</option>
          </select>
        </div>
        <div>
          <label className="text-body-lg mb-1 block font-medium">רמת ביטחון</label>
          <select value={confidenceFilter} onChange={(e) => setConfidenceFilter(e.target.value as ConfidenceFilter)} className="text-body-lg w-full rounded-lg border border-[var(--color-border)] bg-transparent p-2.5">
            <option value="all">כל השאלות</option>
            <option value="high-only">רמת ביטחון גבוהה בלבד</option>
          </select>
        </div>
        <div>
          <label className="text-body-lg mb-1 block font-medium">מצב צפייה</label>
          <select value={seenFilter} onChange={(e) => setSeenFilter(e.target.value as SeenFilter)} className="text-body-lg w-full rounded-lg border border-[var(--color-border)] bg-transparent p-2.5">
            <option value="all">הכל</option>
            <option value="unseen">שאלות שלא ראיתי</option>
            <option value="incorrect">שאלות שטעיתי בהן</option>
            <option value="saved">שאלות ששמרתי</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packs.map((pack) => {
          const filteredCount = poolForPack(pack.packId).length
          const verifiedCount = pack.activeQuestionCount
          return (
            <div key={pack.packId} className="space-y-3 rounded-xl border border-[var(--color-border)] p-4">
              <div className="flex items-start justify-between gap-2">
                <BidiText as="h2" className="text-body-lg font-bold" text={pack.titleHe} />
                <SupplementalBadge label="מאגר נוסף" />
              </div>
              <div className="text-meta flex flex-wrap gap-2 text-[var(--color-text-muted)]">
                <span>{SOURCE_TYPE_LABEL[pack.sourceType]}</span>
                <span>·</span>
                <span>{pack.year ?? 'שנה לא ידועה'}</span>
                <span>·</span>
                <span>ביטחון: {pack.confidence === 'high' ? 'גבוה' : pack.confidence === 'medium' ? 'בינוני' : 'נמוך'}</span>
              </div>
              <BidiText as="p" className="text-meta text-[var(--color-text-muted)]" text={pack.description} />
              <div className="text-meta flex flex-wrap gap-2 text-[var(--color-text-muted)]">
                <span>{verifiedCount} שאלות מאומתות</span>
                <span>·</span>
                <span>{pack.needsReviewCount} דורשות בדיקה נוספת</span>
                <span>·</span>
                <span>{filteredCount} תואמות לסינון הנוכחי</span>
              </div>
              <button
                disabled={filteredCount === 0}
                onClick={() => startPractice(pack.packId)}
                className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-base font-medium text-[var(--color-accent-contrast)] disabled:opacity-40"
              >
                התחל תרגול
              </button>
              {filteredCount === 0 && <p className="text-meta text-[var(--color-text-muted)]">אין שאלות תואמות לסינון הנוכחי במאגר זה.</p>}
            </div>
          )
        })}
        {packs.length === 0 && <p className="text-body-lg text-[var(--color-text-muted)]">אין עדיין מאגרים נוספים זמינים.</p>}
      </div>
    </PageContainer>
  )
}
