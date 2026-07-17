import { topicsSorted, flashcards, sectionsByTopic, activeQuestions, topicsById } from '../lib/dataStore'
import { useProgress } from '../lib/ProgressContext'
import { shuffleArray } from '../lib/shuffle'
import { useMemo } from 'react'
import { PageContainer } from '../components/layout/PageContainer'
import { BidiText } from '../components/shared/BidiText'

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
      <h1 className="text-page-title font-bold">חזרה אחרונה (Last-Minute Review)</h1>
      <p className="text-body-lg text-[var(--color-text-muted)]">מסך זה מרוכז בכוונה — רק החומר החשוב ביותר. ניתן להדפיס (Ctrl+P).</p>

      <section>
        <h2 className="text-section-title mb-2 font-bold">נושאים בעלי שכיחות גבוהה במבחני עבר</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {highYieldTopics.map((topic) => {
            const sections = sectionsByTopic.get(topic.id) ?? []
            const allKeyPoints = sections.flatMap((s) => s.mustRemember)
            return (
              <div key={topic.id} className="rounded-xl border border-[var(--color-border)] p-4">
                <BidiText as="h3" className="text-body-lg mb-1 font-bold" text={topic.titleHe} />
                <ul className="text-body-lg list-inside list-disc space-y-0.5">
                  {allKeyPoints.slice(0, 6).map((p, i) => (
                    <BidiText key={i} as="li" text={p} />
                  ))}
                </ul>
              </div>
            )
          })}
          {highYieldTopics.length === 0 && <p className="text-meta text-[var(--color-text-muted)]">מפת הנושאים עדיין לא נטענה.</p>}
        </div>
      </section>

      {personalMistakeTopics.size > 0 && (
        <section>
          <h2 className="text-section-title mb-2 font-bold">הטעויות האישיות שלך שעדיין לא תוקנו</h2>
          <div className="flex flex-wrap gap-2">
            {[...personalMistakeTopics].map((topicId) => (
              <BidiText
                key={topicId}
                as="span"
                className="text-meta rounded-full bg-[var(--color-danger)]/10 px-3 py-1"
                text={topicsById.get(topicId)?.titleHe ?? topicId}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-section-title mb-2 font-bold">כרטיסיות מפתח</h2>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {topFlashcards.map((c) => (
            <div key={c.id} className="rounded-lg border border-[var(--color-border)] p-3">
              <BidiText as="p" className="text-body-lg font-medium" text={c.frontHe} />
              <BidiText as="p" className="text-meta text-[var(--color-text-muted)]" text={c.backHe} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-section-title mb-2 font-bold">שאלות מהירות ({quickQuestions.length})</h2>
        <p className="text-meta text-[var(--color-text-muted)]">
          עבור לכרטיסייה &quot;תרגול&quot; ובחר &quot;שאלות ממבחני עבר בלבד&quot; כדי לתרגל את השאלות האלה בפועל.
        </p>
      </section>
    </PageContainer>
  )
}
