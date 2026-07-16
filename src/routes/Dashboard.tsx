import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCountdown } from '../lib/useCountdown'
import { useProgress } from '../lib/ProgressContext'
import { topicsSorted, activeQuestions, flashcards } from '../lib/dataStore'
import { Ltr } from '../components/question/Ltr'
import { generateStudyPlan, totalMinutesForDay } from '../lib/studyPlan'
import { PageContainer } from '../components/layout/PageContainer'

const DAY_LABEL: Record<1 | 2 | 3, string> = { 1: 'יום 1', 2: 'יום 2', 3: 'יום 3' }

function StudyPlanSection() {
  const { progress, updateProgress } = useProgress()
  const plan = progress.studyPlan

  function regenerate() {
    updateProgress((prev) => ({ ...prev, studyPlan: generateStudyPlan(topicsSorted, prev) }))
  }

  function toggleTask(taskId: string) {
    updateProgress((prev) => ({
      ...prev,
      studyPlan: prev.studyPlan.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
    }))
  }

  function setHours(day: 'day1' | 'day2' | 'day3', hours: number) {
    updateProgress((prev) => ({ ...prev, availableHoursPerDay: { ...prev.availableHoursPerDay, [day]: hours } }))
  }

  return (
    <section className="rounded-xl border border-[var(--color-border)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-section-title font-bold">תוכנית לימוד ל-3 ימים</h2>
        <button onClick={regenerate} className="text-meta rounded-lg border border-[var(--color-accent)] px-3 py-1.5 text-[var(--color-accent)]">
          {plan.length > 0 ? 'בנה מחדש' : 'בנה תוכנית'}
        </button>
      </div>

      <div className="text-meta mb-4 flex flex-wrap gap-4">
        {(['day1', 'day2', 'day3'] as const).map((day, i) => (
          <label key={day} className="flex items-center gap-1">
            שעות פנויות ביום {i + 1}:
            <input
              type="number"
              min={1}
              max={12}
              value={progress.availableHoursPerDay[day]}
              onChange={(e) => setHours(day, Number(e.target.value))}
              className="w-14 rounded border border-[var(--color-border)] bg-transparent p-1"
            />
          </label>
        ))}
      </div>

      {plan.length === 0 ? (
        <p className="text-body-lg text-[var(--color-text-muted)]">לחץ על &quot;בנה תוכנית&quot; כדי ליצור תוכנית לימוד מותאמת אישית.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {([1, 2, 3] as const).map((day) => {
            const dayTasks = plan.filter((t) => t.day === day)
            const totalMin = totalMinutesForDay(plan, day)
            const availableMin = progress.availableHoursPerDay[`day${day}` as const] * 60
            return (
              <div key={day}>
                <h3 className="text-body-lg mb-1 font-bold">
                  {DAY_LABEL[day]} · {Math.round(totalMin / 60)} שעות מתוכננות {totalMin > availableMin && <span className="text-[var(--color-warning)]">(מעל הזמן הפנוי)</span>}
                </h3>
                <ul className="space-y-1">
                  {dayTasks.map((task) => (
                    <li key={task.id} className="text-meta flex items-start gap-2">
                      <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="mt-0.5" />
                      <span className={task.completed ? 'text-[var(--color-text-muted)] line-through' : ''}>
                        {task.titleHe} ({task.estimatedMinutes} דק')
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
      <div className="text-section-title font-bold">{value}</div>
      <div className="text-meta text-[var(--color-text-muted)]">{label}</div>
    </div>
  )
}

export function Dashboard() {
  const countdown = useCountdown()
  const { progress } = useProgress()
  // Lazy initializer: one-time snapshot of "now" for the due-flashcards count (doesn't need per-second reactivity).
  const [nowMs] = useState(() => Date.now())

  const masteryEntries = Object.values(progress.topicMastery)
  const overallMastery =
    masteryEntries.length > 0 ? Math.round((masteryEntries.reduce((s, m) => s + m.masteryScore, 0) / masteryEntries.length) * 100) : 0

  const topicsWithMastery = topicsSorted.map((t) => ({
    topic: t,
    mastery: progress.topicMastery[t.id]?.masteryScore ?? 0,
    attempts: progress.topicMastery[t.id]?.attempts ?? 0,
  }))
  const attempted = topicsWithMastery.filter((t) => t.attempts > 0)
  const weakest = [...attempted].sort((a, b) => a.mastery - b.mastery).slice(0, 3)
  const strongest = [...attempted].sort((a, b) => b.mastery - a.mastery).slice(0, 3)

  const questionsAnswered = Object.keys(progress.questionStats).length
  const correctAnswers = Object.values(progress.questionStats).filter((s) => s.lastResult === true).length
  const successRate = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0

  const dueFlashcards = flashcards.filter((c) => {
    const rev = progress.flashcardReviews[c.id]
    if (!rev) return true
    return new Date(rev.nextReview).getTime() <= nowMs
  }).length

  const mockCount = progress.mockExamResults.length
  const lastScores = progress.mockExamResults.slice(-3).map((r) => r.scorePercent)

  const nextTask = !progress.diagnosticCompleted
    ? { label: 'התחל מבחן אבחון כדי למפות את נקודות החוזק והחולשה שלך', to: '/diagnostic' }
    : weakest.length > 0
      ? { label: `תרגל את הנושא החלש ביותר שלך: ${weakest[0]!.topic.titleHe}`, to: '/quiz' }
      : { label: 'המשך לתרגול אדפטיבי', to: '/quiz' }

  return (
    <PageContainer className="space-y-8">
      <section>
        <h1 className="text-page-title mb-1 font-bold">לוח בקרה</h1>
        <p className="text-body-lg text-[var(--color-text-muted)]">
          מבחן <Ltr>Advanced Topics in Programming</Ltr> — 19.07.2026, 17:30
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--color-accent)] bg-[var(--color-bg-subtle)] p-6 text-center">
        <div className="text-body-lg text-[var(--color-text-muted)]">זמן שנותר עד המבחן</div>
        <div className="mt-2 flex justify-center gap-4 text-4xl font-bold">
          <div>
            {countdown.days}
            <div className="text-meta font-normal text-[var(--color-text-muted)]">ימים</div>
          </div>
          <div>
            {countdown.hours}
            <div className="text-meta font-normal text-[var(--color-text-muted)]">שעות</div>
          </div>
          <div>
            {countdown.minutes}
            <div className="text-meta font-normal text-[var(--color-text-muted)]">דקות</div>
          </div>
          <div>
            {countdown.seconds}
            <div className="text-meta font-normal text-[var(--color-text-muted)]">שניות</div>
          </div>
        </div>
        {countdown.isPast && <div className="text-body-lg mt-2 text-[var(--color-danger)]">מועד המבחן כבר עבר</div>}
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="שליטה כללית" value={`${overallMastery}%`} />
        <StatCard label="שאלות נענו" value={questionsAnswered} />
        <StatCard label="אחוז הצלחה" value={`${successRate}%`} />
        <StatCard label="כרטיסיות ממתינות" value={dueFlashcards} />
        <StatCard label="מבחנים מדומים שבוצעו" value={mockCount} />
        <StatCard label="ציונים אחרונים" value={lastScores.length ? lastScores.join(', ') : '—'} />
        <StatCard label="נושאים במאגר" value={topicsSorted.length} />
        <StatCard label="שאלות פעילות במאגר" value={activeQuestions.length} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-border)] p-4">
          <h2 className="text-section-title mb-2 font-bold">נושאים חלשים</h2>
          {weakest.length === 0 && <p className="text-body-lg text-[var(--color-text-muted)]">עדיין אין מספיק נתונים — התחל לתרגל.</p>}
          <ul className="text-body-lg space-y-1">
            {weakest.map(({ topic, mastery }) => (
              <li key={topic.id} className="flex justify-between">
                <span>{topic.titleHe}</span>
                <span className="text-[var(--color-danger)]">{Math.round(mastery * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] p-4">
          <h2 className="text-section-title mb-2 font-bold">נושאים חזקים</h2>
          {strongest.length === 0 && <p className="text-body-lg text-[var(--color-text-muted)]">עדיין אין מספיק נתונים.</p>}
          <ul className="text-body-lg space-y-1">
            {strongest.map(({ topic, mastery }) => (
              <li key={topic.id} className="flex justify-between">
                <span>{topic.titleHe}</span>
                <span className="text-[var(--color-success)]">{Math.round(mastery * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-accent)] p-4">
        <h2 className="text-section-title mb-2 font-bold">המשימה המומלצת הבאה</h2>
        <p className="text-body-lg mb-3">{nextTask.label}</p>
        <Link to={nextTask.to} className="inline-block rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-base font-medium text-[var(--color-accent-contrast)]">
          המשך
        </Link>
      </section>

      <StudyPlanSection />
    </PageContainer>
  )
}
