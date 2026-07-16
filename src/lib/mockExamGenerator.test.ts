import { describe, it, expect } from 'vitest'
import { buildCustomMockExam } from './mockExamGenerator'
import { mulberry32 } from './shuffle'
import type { Question, Topic } from '../types/domain'

function makeQuestion(id: string, topicIds: string[]): Question {
  return {
    id,
    topicIds,
    subtopic: 'test',
    stemHe: `שאלה ${id}`,
    options: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
      { id: 'c', text: 'C' },
      { id: 'd', text: 'D' },
      { id: 'e', text: 'E' },
    ],
    correctOptionId: 'a',
    explanation: 'exp',
    optionExplanations: { a: 'x', b: 'x', c: 'x', d: 'x', e: 'x' },
    difficulty: 'medium',
    questionType: 'definition',
    source: 'authored',
    sourceReferences: [],
    confidence: 'high',
    basedOnPastExam: false,
    pastExamYear: null,
    origin: 'original',
    tags: [],
    keyLearningPoint: 'point',
    points: 5,
    active: true,
  }
}

function makeTopic(id: string, examFrequency: Topic['examFrequency'] = 'medium'): Topic {
  return { id, order: 1, titleHe: id, titleEn: id, lectureRefs: [], examFrequency, summary: '', sectionIds: [] }
}

describe('buildCustomMockExam', () => {
  const topics = [makeTopic('t1', 'high'), makeTopic('t2', 'medium'), makeTopic('t3', 'low')]
  const questions = topics.flatMap((t) => Array.from({ length: 15 }, (_, i) => makeQuestion(`${t.id}-${i}`, [t.id])))

  it('always returns exactly the requested size when enough questions exist', () => {
    const exam = buildCustomMockExam(questions, topics, { size: 20, rng: mulberry32(1) })
    expect(exam).toHaveLength(20)
  })

  it('never contains duplicate questions', () => {
    const exam = buildCustomMockExam(questions, topics, { size: 20, rng: mulberry32(2) })
    const ids = exam.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('sums to 100 points at the default size of 20 (5 points each)', () => {
    const exam = buildCustomMockExam(questions, topics, { size: 20, rng: mulberry32(3) })
    const totalPoints = exam.reduce((sum, q) => sum + q.points, 0)
    expect(totalPoints).toBe(100)
  })

  it('respects excludeQuestionIds', () => {
    const exclude = questions.slice(0, 10).map((q) => q.id)
    const exam = buildCustomMockExam(questions, topics, { size: 20, rng: mulberry32(4), excludeQuestionIds: exclude })
    expect(exam.some((q) => exclude.includes(q.id))).toBe(false)
  })

  it('degrades gracefully when fewer questions exist than requested size', () => {
    const smallPool = questions.slice(0, 5)
    const exam = buildCustomMockExam(smallPool, topics, { size: 20, rng: mulberry32(5) })
    expect(exam.length).toBeLessThanOrEqual(5)
  })
})
