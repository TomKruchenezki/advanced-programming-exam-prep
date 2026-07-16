import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { questionsById, topicsById, topicsSorted } from '../lib/dataStore'
import { useProgress } from '../lib/ProgressContext'
import { PageContainer } from '../components/layout/PageContainer'

type SortMode = 'date' | 'timesWrong'

export function MistakeNotebook() {
  const { progress } = useProgress()
  const [topicFilter, setTopicFilter] = useState<string>('all')
  const [showResolved, setShowResolved] = useState(true)
  const [sortMode, setSortMode] = useState<SortMode>('date')

  const grouped = useMemo(() => {
    const byTopic = new Map<string, typeof progress.mistakeLog>()
    for (const entry of progress.mistakeLog) {
      if (!showResolved && entry.resolved) continue
      for (const topicId of entry.topicIds) {
        if (topicFilter !== 'all' && topicId !== topicFilter) continue
        if (!byTopic.has(topicId)) byTopic.set(topicId, [])
        byTopic.get(topicId)!.push(entry)
      }
    }
    for (const entries of byTopic.values()) {
      entries.sort((a, b) =>
        sortMode === 'timesWrong' ? b.timesWrong - a.timesWrong : new Date(b.timestampISO).getTime() - new Date(a.timestampISO).getTime(),
      )
    }
    return byTopic
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.mistakeLog, topicFilter, showResolved, sortMode])

  const topicsWithMistakes = topicsSorted.filter((t) => progress.mistakeLog.some((m) => m.topicIds.includes(t.id)))

  if (progress.mistakeLog.length === 0) {
    return (
      <PageContainer className="space-y-2">
        <h1 className="text-page-title font-bold">מחברת טעויות</h1>
        <p className="text-body-lg text-[var(--color-text-muted)]">עדיין לא נרשמו טעויות. המשך לתרגל!</p>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="space-y-8">
      <div>
        <h1 className="text-page-title font-bold">מחברת טעויות</h1>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-meta mb-1 block font-medium text-[var(--color-text-muted)]">סינון לפי נושא</label>
            <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className="text-body-lg w-full rounded-lg border border-[var(--color-border)] bg-transparent p-2.5">
              <option value="all">כל הנושאים</option>
              {topicsWithMistakes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titleHe}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-meta mb-1 block font-medium text-[var(--color-text-muted)]">מיון</label>
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className="text-body-lg w-full rounded-lg border border-[var(--color-border)] bg-transparent p-2.5">
              <option value="date">לפי תאריך (חדש קודם)</option>
              <option value="timesWrong">לפי מספר טעויות</option>
            </select>
          </div>
          <label className="text-body-lg flex items-end gap-2">
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
            הצג גם טעויות שתוקנו
          </label>
        </div>
      </div>

      {grouped.size === 0 && <p className="text-body-lg text-[var(--color-text-muted)]">אין טעויות התואמות את הסינון הנוכחי.</p>}

      {[...grouped.entries()].map(([topicId, entries]) => (
        <section key={topicId}>
          <h2 className="text-section-title mb-2 font-bold">{topicsById.get(topicId)?.titleHe ?? topicId}</h2>
          <div className="space-y-3">
            {entries.map((entry) => {
              const q = questionsById.get(entry.questionId)
              if (!q) return null
              return (
                <div key={entry.id} className="rounded-xl border border-[var(--color-border)] p-4">
                  <div className="text-meta mb-1 flex items-center justify-between">
                    <span className={entry.resolved ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
                      {entry.resolved ? 'תוקן בהמשך' : `טעית ${entry.timesWrong} פעמים`}
                    </span>
                    <span className="text-[var(--color-text-muted)]">{new Date(entry.timestampISO).toLocaleDateString('he-IL')}</span>
                  </div>
                  <p className="text-body-lg mb-1">{q.stemHe}</p>
                  <p className="text-meta text-[var(--color-text-muted)]">
                    בחרת: {entry.chosenOptionId.toUpperCase()} · נכון: {entry.correctOptionId.toUpperCase()}
                  </p>
                  {entry.possibleReason && <p className="text-meta text-[var(--color-warning)]">סיבה אפשרית: {entry.possibleReason}</p>}
                  <p className="text-body-lg mt-1">{q.explanation}</p>
                  <Link to={`/learn/${topicId}`} className="text-meta mt-1 inline-block text-[var(--color-accent)] hover:underline">
                    חזור ללמידה בנושא זה
                  </Link>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </PageContainer>
  )
}
