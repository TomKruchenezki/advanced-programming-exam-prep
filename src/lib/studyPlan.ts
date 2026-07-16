import type { StudyPlanTask, Topic, UserProgress } from '../types/domain'

const FREQ_RANK: Record<Topic['examFrequency'], number> = { high: 0, medium: 1, low: 2 }

/**
 * Builds a 3-day study plan. Day 1 favors diagnostic + foundational/high-frequency topics,
 * day 2 adds a mock exam + more high-frequency practice, day 3 rounds out remaining topics
 * plus mistakes/flashcards/last-minute review. Topic ordering within each day is driven by
 * real exam-frequency (high first) and, once available, the student's own weak topics.
 */
export function generateStudyPlan(topics: Topic[], progress: UserProgress): StudyPlanTask[] {
  const sortedByPriority = [...topics].sort((a, b) => {
    const freqDiff = FREQ_RANK[a.examFrequency] - FREQ_RANK[b.examFrequency]
    if (freqDiff !== 0) return freqDiff
    const masteryA = progress.topicMastery[a.id]?.masteryScore ?? 0
    const masteryB = progress.topicMastery[b.id]?.masteryScore ?? 0
    return masteryA - masteryB
  })

  const tasks: StudyPlanTask[] = []
  let taskCounter = 1
  const nextId = () => `plan-task-${taskCounter++}`

  if (!progress.diagnosticCompleted) {
    tasks.push({ id: nextId(), day: 1, titleHe: 'מבחן אבחון (30 שאלות)', estimatedMinutes: 40, topicIds: [], kind: 'diagnostic', completed: false })
  }

  const day1Topics = sortedByPriority.slice(0, Math.ceil(sortedByPriority.length * 0.4))
  const day2Topics = sortedByPriority.slice(Math.ceil(sortedByPriority.length * 0.4), Math.ceil(sortedByPriority.length * 0.75))
  const day3Topics = sortedByPriority.slice(Math.ceil(sortedByPriority.length * 0.75))

  for (const topic of day1Topics) {
    tasks.push({ id: nextId(), day: 1, titleHe: `למידה: ${topic.titleHe}`, estimatedMinutes: 25, topicIds: [topic.id], kind: 'learn', completed: false })
    tasks.push({ id: nextId(), day: 1, titleHe: `תרגול: ${topic.titleHe}`, estimatedMinutes: 15, topicIds: [topic.id], kind: 'quiz', completed: false })
  }
  tasks.push({ id: nextId(), day: 1, titleHe: 'חזרה על טעויות מהיום', estimatedMinutes: 15, topicIds: [], kind: 'review', completed: false })

  for (const topic of day2Topics) {
    tasks.push({ id: nextId(), day: 2, titleHe: `למידה: ${topic.titleHe}`, estimatedMinutes: 20, topicIds: [topic.id], kind: 'learn', completed: false })
    tasks.push({ id: nextId(), day: 2, titleHe: `תרגול: ${topic.titleHe}`, estimatedMinutes: 15, topicIds: [topic.id], kind: 'quiz', completed: false })
  }
  tasks.push({ id: nextId(), day: 2, titleHe: 'מבחן מדומה ראשון', estimatedMinutes: 90, topicIds: [], kind: 'mock', completed: false })
  tasks.push({ id: nextId(), day: 2, titleHe: 'תיקון חולשות מהמבחן המדומה', estimatedMinutes: 30, topicIds: [], kind: 'review', completed: false })

  for (const topic of day3Topics) {
    tasks.push({ id: nextId(), day: 3, titleHe: `למידה: ${topic.titleHe}`, estimatedMinutes: 15, topicIds: [topic.id], kind: 'learn', completed: false })
  }
  tasks.push({ id: nextId(), day: 3, titleHe: 'מבחן מדומה שני', estimatedMinutes: 90, topicIds: [], kind: 'mock', completed: false })
  tasks.push({ id: nextId(), day: 3, titleHe: 'כרטיסיות זיכרון (כל הנושאים)', estimatedMinutes: 30, topicIds: [], kind: 'flashcards', completed: false })
  tasks.push({ id: nextId(), day: 3, titleHe: 'חזרה אחרונה (Last-Minute Review)', estimatedMinutes: 30, topicIds: [], kind: 'review', completed: false })

  return tasks
}

export function totalMinutesForDay(tasks: StudyPlanTask[], day: 1 | 2 | 3): number {
  return tasks.filter((t) => t.day === day).reduce((sum, t) => sum + t.estimatedMinutes, 0)
}
