import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ExamResultView } from './ExamResultView'
import type { MockExamResult, Question } from '../../types/domain'

function makeQuestion(id: string): Question {
  return {
    id,
    topicIds: ['t1'],
    subtopic: 'test',
    stemHe: `שאלה ${id}`,
    options: [
      { id: 'a', text: 'Option A text' },
      { id: 'b', text: 'Option B text' },
      { id: 'c', text: 'Option C text - CORRECT' },
      { id: 'd', text: 'Option D text' },
      { id: 'e', text: 'Option E text' },
    ],
    correctOptionId: 'c',
    explanation: 'explanation',
    optionExplanations: { a: 'wrong', b: 'wrong', c: 'right', d: 'wrong', e: 'wrong' },
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

function makeResult(id: string, questions: Question[]): MockExamResult {
  return {
    id,
    mockExamId: 'mock-1',
    timestampISO: new Date().toISOString(),
    durationSeconds: 120,
    scorePercent: 0,
    correctCount: 0,
    wouldPass55: false,
    topicBreakdown: {},
    answers: questions.map((q) => ({ questionId: q.id, chosenOptionId: 'a', flaggedForReview: false })),
  }
}

describe('ExamResultView stable option order (correctness gate)', () => {
  it('keeps the same option order for the wrong-answers review across unrelated re-renders', () => {
    const questions = [makeQuestion('q-1'), makeQuestion('q-2')]
    const result = makeResult('result-1', questions)

    const { container, rerender } = render(<ExamResultView result={result} questions={questions} />)
    const optionLabels = () =>
      [...container.querySelectorAll('button[aria-label]')].filter((b) => /^[A-E]\. /.test(b.getAttribute('aria-label') ?? '')).map((b) => b.getAttribute('aria-label'))

    const before = optionLabels()
    expect(before.length).toBeGreaterThan(0)

    // Re-render with an unrelated prop change (previousResults) - simulates a parent re-render.
    rerender(<ExamResultView result={result} questions={questions} previousResults={[makeResult('result-0', questions)]} />)
    const after = optionLabels()
    expect(after).toEqual(before)
  })

  it('shows the same option order when the same result is rendered again in a fresh instance', () => {
    const questions = [makeQuestion('q-1')]
    const result = makeResult('result-1', questions)

    const first = render(<ExamResultView result={result} questions={questions} />)
    const firstLabels = [...first.container.querySelectorAll('button[aria-label]')].map((b) => b.getAttribute('aria-label'))
    first.unmount()

    const second = render(<ExamResultView result={result} questions={questions} />)
    const secondLabels = [...second.container.querySelectorAll('button[aria-label]')].map((b) => b.getAttribute('aria-label'))

    expect(secondLabels).toEqual(firstLabels)
  })
})
