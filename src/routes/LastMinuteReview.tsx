import { topicsSorted, flashcards, sectionsByTopic, activeQuestions, topicsById } from '../lib/dataStore'
import { useProgress } from '../lib/ProgressContext'
import { shuffleArray } from '../lib/shuffle'
import { useMemo } from 'react'
import { PageContainer } from '../components/layout/PageContainer'

export function LastMinuteReview() {
  const { progress } = useProgress()

  const highYieldTopics = topicsSorted.filter((t) => t.examFrequency === 'high')

  const topFlashcards = useMemo(() => {
    const highYield = flashcards.filter((c) => c.difficulty === 'hard' || c.tags.includes('high-yield'))
    return shuffleArray(highYield).slice(0, 25)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashcards.length])

  const personalMistakeTopics = new Set(progress.mistakeLog.filter((m) => !m.resolved).flatMap((m) => m.topicIds))

  const quickQuestions = useMemo(() => {
    const highValue = activeQuestions.filter((q) => q.difficulty !== 'easy' && (q.source === 'past-exam' || q.tags.includes('high-yield')))
    return shuffleArray(highValue).slice(0, 30)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuestions.length])

  return (
    <PageContainer className="space-y-8 print:max-w-none">
      <h1 className="text-2xl font-bold">חזרה אחרונה (Last-Minute Review)</h1>
      <p className="text-sm text-[var(--color-text-muted)]">מסך זה מרוכז בכוונה — רק החומר החשוב ביותר. ניתן להדפיס (Ctrl+P).</p>

      <section>
        <h2 className="mb-2 font-bold">נושאים בעלי שכיחות גבוהה במבחני עבר</h2>
        <div className="space-y-4">
          {highYieldTopics.map((topic) => {
            const sections = sectionsByTopic.get(topic.id) ?? []
            const allKeyPoints = sections.flatMap((s) => s.mustRemember)
            return (
              <div key={topic.id} className="rounded-xl border border-[var(--color-border)] p-4">
                <h3 className="mb-1 font-bold">{topic.titleHe}</h3>
                <ul className="list-inside list-disc space-y-0.5 text-sm">
                  {allKeyPoints.slice(0, 6).map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )
          })}
          {highYieldTopics.length === 0 && <p className="text-xs text-[var(--color-text-muted)]">מפת הנושאים עדיין לא נטענה.</p>}
        </div>
      </section>

      {personalMistakeTopics.size > 0 && (
        <section>
          <h2 className="mb-2 font-bold">הטעויות האישיות שלך שעדיין לא תוקנו</h2>
          <div className="flex flex-wrap gap-2">
            {[...personalMistakeTopics].map((topicId) => (
              <span key={topicId} className="rounded-full bg-[var(--color-danger)]/10 px-3 py-1 text-xs">
                {topicsById.get(topicId)?.titleHe ?? topicId}
              </span>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-bold">כרטיסיות מפתח</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {topFlashcards.map((c) => (
            <div key={c.id} className="rounded-lg border border-[var(--color-border)] p-3 text-sm">
              <p className="font-medium">{c.frontHe}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{c.backHe}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-bold">שאלות מהירות ({quickQuestions.length})</h2>
        <p className="text-xs text-[var(--color-text-muted)]">
          עבור לכרטיסייה &quot;תרגול&quot; ובחר &quot;שאלות ממבחני עבר בלבד&quot; כדי לתרגל את השאלות האלה בפועל.
        </p>
      </section>
    </PageContainer>
  )
}
