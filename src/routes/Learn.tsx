import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { topicsSorted, sectionsByTopic, questionsById } from '../lib/dataStore'
import { useProgress } from '../lib/ProgressContext'
import { CodeBlock } from '../components/question/CodeBlock'
import { Ltr } from '../components/question/Ltr'
import { QuestionCard } from '../components/question/QuestionCard'
import { shuffleQuestionOptions } from '../lib/shuffle'
import { recordPracticeAnswer } from '../lib/progressActions'
import { PageContainer } from '../components/layout/PageContainer'

const FREQ_LABEL: Record<string, string> = { high: 'שכיחות גבוהה', medium: 'שכיחות בינונית', low: 'שכיחות נמוכה' }

function TopicList() {
  const { progress } = useProgress()
  return (
    <PageContainer size="wide" className="space-y-3">
      <h1 className="text-page-title font-bold">למידה לפי נושא</h1>
      {topicsSorted.map((topic) => {
        const mastery = progress.topicMastery[topic.id]?.masteryScore ?? 0
        return (
          <Link key={topic.id} to={`/learn/${topic.id}`} className="block rounded-xl border border-[var(--color-border)] p-4 hover:border-[var(--color-accent)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{topic.titleHe}</h2>
                <p className="text-meta text-[var(--color-text-muted)]">
                  <Ltr>{topic.titleEn}</Ltr> · {FREQ_LABEL[topic.examFrequency]}
                </p>
              </div>
              <span className="text-meta text-[var(--color-text-muted)]">{Math.round(mastery * 100)}%</span>
            </div>
          </Link>
        )
      })}
      {topicsSorted.length === 0 && <p className="text-body-lg text-[var(--color-text-muted)]">מפת הנושאים עדיין לא נטענה.</p>}
    </PageContainer>
  )
}

function SectionCheckQuestion({ questionId }: { questionId: string }) {
  const { updateProgress } = useProgress()
  const [answered, setAnswered] = useState<string | null>(null)
  const question = questionsById.get(questionId)
  if (!question) return null
  const shuffled = shuffleQuestionOptions(question)

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
      <QuestionCard
        question={shuffled}
        selectedOptionId={answered}
        revealed={!!answered}
        onSelect={(optId) => {
          setAnswered(optId)
          const original = shuffled.displayToOriginal[optId] ?? optId
          updateProgress((prev) => recordPracticeAnswer(prev, question, original))
        }}
      />
    </div>
  )
}

function TopicReader({ topicId }: { topicId: string }) {
  const { progress, updateProgress } = useProgress()
  const topic = topicsSorted.find((t) => t.id === topicId)
  const sections = sectionsByTopic.get(topicId) ?? []

  if (!topic) {
    return (
      <PageContainer size="wide">
        <p className="text-body-lg text-[var(--color-text-muted)]">נושא לא נמצא.</p>
        <Link to="/learn" className="text-nav-link text-[var(--color-accent)] hover:underline">
          חזרה לרשימת הנושאים
        </Link>
      </PageContainer>
    )
  }

  const currentIndex = topicsSorted.findIndex((t) => t.id === topicId)
  const prevTopic = currentIndex > 0 ? topicsSorted[currentIndex - 1] : null
  const nextTopic = currentIndex >= 0 && currentIndex < topicsSorted.length - 1 ? topicsSorted[currentIndex + 1] : null

  function markLearned(sectionId: string) {
    updateProgress((prev) => ({
      ...prev,
      studiedSectionIds: prev.studiedSectionIds.includes(sectionId) ? prev.studiedSectionIds : [...prev.studiedSectionIds, sectionId],
    }))
  }

  function setConfidence(sectionId: string, level: 1 | 2 | 3 | 4 | 5) {
    updateProgress((prev) => ({ ...prev, sectionConfidence: { ...prev.sectionConfidence, [sectionId]: level } }))
  }

  return (
    <PageContainer size="wide" className="space-y-10">
      <div>
        <Link to="/learn" className="text-nav-link text-[var(--color-accent)] hover:underline">
          ← כל הנושאים
        </Link>
        <h1 className="text-page-title mt-2 font-bold">{topic.titleHe}</h1>
        <p className="text-meta text-[var(--color-text-muted)]">
          <Ltr>{topic.titleEn}</Ltr> · הרצאות {topic.lectureRefs.join(', ')}
        </p>
        <p className="text-body-lg mt-2">{topic.summary}</p>
      </div>

      {sections.map((section) => {
        const isLearned = progress.studiedSectionIds.includes(section.id)
        const confidence = progress.sectionConfidence[section.id]
        return (
          <section key={section.id} className="space-y-4 border-t border-[var(--color-border)] pt-6">
            <h2 className="text-section-title font-bold">{section.headingHe}</h2>

            <div>
              <h3 className="text-meta mb-1 font-bold text-[var(--color-accent)]">אינטואיציה</h3>
              <p className="text-body-lg leading-relaxed">{section.intuitionHe}</p>
            </div>

            <div>
              <h3 className="text-meta mb-1 font-bold text-[var(--color-accent)]">ידע למבחן</h3>
              <p className="text-body-lg whitespace-pre-wrap leading-relaxed">{section.examKnowledgeHe}</p>
            </div>

            {section.codeExamples?.map((ex, i) => (
              <div key={i}>
                {ex.captionHe && <p className="text-meta mb-1 text-[var(--color-text-muted)]">{ex.captionHe}</p>}
                <CodeBlock code={ex.code} language={ex.language} />
              </div>
            ))}

            <div>
              <h3 className="text-meta mb-1 font-bold text-[var(--color-accent)]">יישום</h3>
              <p className="text-body-lg leading-relaxed">{section.applicationHe}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="text-body-lg rounded-lg bg-[var(--color-bg-subtle)] p-3">
                <p className="mb-1 font-bold">מה חובה לזכור</p>
                <ul className="list-inside list-disc space-y-0.5">
                  {section.mustRemember.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
              <div className="text-body-lg rounded-lg bg-[var(--color-bg-subtle)] p-3">
                <p className="mb-1 font-bold">מה קל לבלבל</p>
                <ul className="list-inside list-disc space-y-0.5">
                  {section.easyToConfuse.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>

            {section.howProfessorMightAsk.length > 0 && (
              <div className="text-body-lg rounded-lg border border-[var(--color-warning)] p-3">
                <p className="mb-1 font-bold">איך המרצה עשוי לשאול על זה</p>
                <ul className="list-inside list-disc space-y-0.5">
                  {section.howProfessorMightAsk.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {section.mnemonicHe && <p className="text-body-lg text-[var(--color-accent)]">זכרון: {section.mnemonicHe}</p>}

            {section.termsHeEn.length > 0 && (
              <p className="text-meta text-[var(--color-text-muted)]">
                מונחים: {section.termsHeEn.map((t) => `${t.he} (${t.en})`).join(' · ')}
              </p>
            )}

            {section.checkQuestionIds && section.checkQuestionIds.length > 0 && (
              <div className="space-y-3">
                <p className="text-body-lg font-bold">שאלות בדיקה</p>
                {section.checkQuestionIds.map((qid) => (
                  <SectionCheckQuestion key={qid} questionId={qid} />
                ))}
              </div>
            )}

            {section.sourceRefs.length > 0 && (
              <p className="text-meta text-[var(--color-text-muted)]">
                מקורות: {section.sourceRefs.map((r) => `${r.fileName} (${r.locator})`).join(', ')}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 border-t border-[var(--color-border)] pt-3">
              <button
                onClick={() => markLearned(section.id)}
                className={`rounded-lg px-3 py-1.5 text-base ${isLearned ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' : 'border border-[var(--color-border)]'}`}
              >
                {isLearned ? '✓ למדתי' : 'סמן כלמדתי'}
              </button>
              <div className="flex items-center gap-1 text-base">
                <span className="text-[var(--color-text-muted)]">רמת ביטחון:</span>
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfidence(section.id, level as 1 | 2 | 3 | 4 | 5)}
                    className={`h-8 w-8 rounded-full text-sm ${confidence === level ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]' : 'bg-[var(--color-bg-subtle)]'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      {sections.length === 0 && <p className="text-body-lg text-[var(--color-text-muted)]">חומר הלימוד לנושא זה עדיין לא נטען.</p>}

      <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-6">
        {prevTopic ? (
          <Link to={`/learn/${prevTopic.id}`} className="text-nav-link text-[var(--color-accent)] hover:underline">
            → {prevTopic.titleHe}
          </Link>
        ) : (
          <span />
        )}
        {nextTopic ? (
          <Link to={`/learn/${nextTopic.id}`} className="text-nav-link text-[var(--color-accent)] hover:underline">
            {nextTopic.titleHe} ←
          </Link>
        ) : (
          <span />
        )}
      </div>
    </PageContainer>
  )
}

export function Learn() {
  const { topicId } = useParams()
  if (!topicId) return <TopicList />
  return <TopicReader topicId={topicId} />
}
