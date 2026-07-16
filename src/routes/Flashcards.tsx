import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { flashcards, topicsSorted, topicsById } from '../lib/dataStore'
import { useProgress } from '../lib/ProgressContext'
import { nextReviewState, isDue, type Rating } from '../lib/spacedRepetition'
import { CodeBlock } from '../components/question/CodeBlock'
import { PageContainer } from '../components/layout/PageContainer'

export function Flashcards() {
  const { topicId } = useParams()
  const { progress, updateProgress } = useProgress()
  const [dueOnly, setDueOnly] = useState(true)
  const [definitionsOnly, setDefinitionsOnly] = useState(false)
  const [lastMinuteMode, setLastMinuteMode] = useState(false)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const pool = useMemo(() => {
    let list = flashcards.slice()
    if (topicId) list = list.filter((c) => c.topicId === topicId)
    if (dueOnly) list = list.filter((c) => isDue(progress.flashcardReviews[c.id]))
    if (definitionsOnly) list = list.filter((c) => c.tags.includes('definition'))
    if (lastMinuteMode) list = list.filter((c) => c.difficulty === 'hard' || c.tags.includes('high-yield')).slice(0, 40)
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, dueOnly, definitionsOnly, lastMinuteMode, flashcards.length])

  const card = pool[index]

  function rate(rating: Rating) {
    if (!card) return
    updateProgress((prev) => ({
      ...prev,
      flashcardReviews: { ...prev.flashcardReviews, [card.id]: nextReviewState(prev.flashcardReviews[card.id], card.id, rating) },
    }))
    setRevealed(false)
    setIndex((i) => Math.min(pool.length - 1, i + 1))
  }

  return (
    <PageContainer className="space-y-6">
      <h1 className="text-page-title font-bold">כרטיסיות</h1>

      <div className="text-body-lg flex flex-wrap gap-4">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={dueOnly} onChange={(e) => { setDueOnly(e.target.checked); setIndex(0) }} />
          רק כרטיסיות שהגיע מועדן
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={definitionsOnly} onChange={(e) => { setDefinitionsOnly(e.target.checked); setIndex(0) }} />
          מצב הגדרות בלבד
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={lastMinuteMode} onChange={(e) => { setLastMinuteMode(e.target.checked); setIndex(0) }} />
          מצב Last Minute
        </label>
        {topicId && <span className="text-[var(--color-text-muted)]">נושא: {topicsById.get(topicId)?.titleHe}</span>}
      </div>

      {!card && <p className="text-body-lg text-[var(--color-text-muted)]">אין כרטיסיות התואמות את הסינון הנוכחי.</p>}

      {card && (
        // Narrower than the page's own wide container: a single flashcard reads better at
        // ~70-90% of the main area than stretched to the full page width.
        <div className="mx-auto w-full max-w-[min(88%,1100px)] space-y-4">
          <p className="text-meta text-[var(--color-text-muted)]">
            כרטיסייה {index + 1} מתוך {pool.length} · {topicsById.get(card.topicId)?.titleHe}
          </p>
          <div
            onClick={() => setRevealed((r) => !r)}
            className="flex min-h-56 cursor-pointer flex-col justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-8 text-center"
          >
            <p className="text-question font-medium">{card.frontHe}</p>
            {revealed && (
              <div className="text-body-lg mt-4 space-y-2 border-t border-[var(--color-border)] pt-4">
                <p>{card.backHe}</p>
                {card.code && <CodeBlock code={card.code} />}
                {card.mnemonic && <p className="text-[var(--color-accent)]">זכרון: {card.mnemonic}</p>}
                {card.commonConfusion && <p className="text-meta text-[var(--color-text-muted)]">בלבול נפוץ: {card.commonConfusion}</p>}
              </div>
            )}
            {!revealed && <p className="text-meta mt-4 text-[var(--color-text-muted)]">לחץ לחשיפת התשובה</p>}
          </div>

          <div className="flex justify-between gap-2">
            <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-base disabled:opacity-40">
              קודם
            </button>
            {revealed ? (
              <div className="flex gap-2">
                <button onClick={() => rate('again')} className="rounded-lg bg-[var(--color-danger)]/20 px-4 py-2 text-base">לא ידעתי</button>
                <button onClick={() => rate('hard')} className="rounded-lg bg-[var(--color-warning)]/20 px-4 py-2 text-base">קשה</button>
                <button onClick={() => rate('good')} className="rounded-lg bg-[var(--color-success)]/20 px-4 py-2 text-base">ידעתי</button>
                <button onClick={() => rate('easy')} className="rounded-lg bg-[var(--color-accent)]/20 px-4 py-2 text-base">קל</button>
              </div>
            ) : (
              <button onClick={() => setIndex((i) => Math.min(pool.length - 1, i + 1))} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-base">
                דלג
              </button>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-[var(--color-border)] pt-4">
        <p className="text-meta mb-2 font-medium text-[var(--color-text-muted)]">סינון לפי נושא</p>
        <div className="flex flex-wrap gap-2">
          {topicsSorted.map((t) => (
            <a key={t.id} href={`#/flashcards/${t.id}`} className="text-meta rounded-full border border-[var(--color-border)] px-3 py-1 hover:border-[var(--color-accent)]">
              {t.titleHe}
            </a>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
