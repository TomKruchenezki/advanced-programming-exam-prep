import { describe, it, expect } from 'vitest'
import { generateStudyPlan, totalMinutesForDay } from './studyPlan'
import { createEmptyProgress } from './progressStore'
import type { Topic } from '../types/domain'

function makeTopic(id: string, examFrequency: Topic['examFrequency']): Topic {
  return { id, order: 1, titleHe: id, titleEn: id, lectureRefs: [], examFrequency, summary: '', sectionIds: [] }
}

describe('generateStudyPlan', () => {
  const topics = [
    makeTopic('t-high-1', 'high'),
    makeTopic('t-high-2', 'high'),
    makeTopic('t-medium-1', 'medium'),
    makeTopic('t-low-1', 'low'),
  ]

  it('includes a diagnostic task on day 1 when not yet completed', () => {
    const progress = createEmptyProgress()
    const plan = generateStudyPlan(topics, progress)
    expect(plan.some((t) => t.kind === 'diagnostic' && t.day === 1)).toBe(true)
  })

  it('omits the diagnostic task once already completed', () => {
    const progress = createEmptyProgress()
    progress.diagnosticCompleted = true
    const plan = generateStudyPlan(topics, progress)
    expect(plan.some((t) => t.kind === 'diagnostic')).toBe(false)
  })

  it('includes at least one mock exam task on day 2 and day 3', () => {
    const plan = generateStudyPlan(topics, createEmptyProgress())
    expect(plan.some((t) => t.kind === 'mock' && t.day === 2)).toBe(true)
    expect(plan.some((t) => t.kind === 'mock' && t.day === 3)).toBe(true)
  })

  it('includes a last-minute review task on day 3', () => {
    const plan = generateStudyPlan(topics, createEmptyProgress())
    expect(plan.some((t) => t.day === 3 && t.titleHe.includes('Last-Minute'))).toBe(true)
  })

  it('produces tasks only within days 1-3', () => {
    const plan = generateStudyPlan(topics, createEmptyProgress())
    expect(plan.every((t) => [1, 2, 3].includes(t.day))).toBe(true)
  })

  it('assigns every generated task a unique id', () => {
    const plan = generateStudyPlan(topics, createEmptyProgress())
    const ids = plan.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('totalMinutesForDay', () => {
  it('sums estimated minutes for a given day', () => {
    const tasks = [
      { id: '1', day: 1 as const, titleHe: 'a', estimatedMinutes: 20, topicIds: [], kind: 'learn' as const, completed: false },
      { id: '2', day: 1 as const, titleHe: 'b', estimatedMinutes: 30, topicIds: [], kind: 'quiz' as const, completed: false },
      { id: '3', day: 2 as const, titleHe: 'c', estimatedMinutes: 100, topicIds: [], kind: 'mock' as const, completed: false },
    ]
    expect(totalMinutesForDay(tasks, 1)).toBe(50)
    expect(totalMinutesForDay(tasks, 2)).toBe(100)
    expect(totalMinutesForDay(tasks, 3)).toBe(0)
  })
})
