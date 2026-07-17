import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExamRunner } from './ExamRunner'
import type { Question } from '../../types/domain'

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q-1',
    topicIds: ['t1'],
    subtopic: 'test',
    stemHe: 'שאלה לדוגמה',
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
    ...overrides,
  }
}

describe('ExamRunner practice mode', () => {
  it('reports the ORIGINAL option id (not the shuffled display id) to onAnswerPractice, with correct=true when the correct answer is clicked', () => {
    const question = makeQuestion()
    const onAnswerPractice = vi.fn()
    const onFinish = vi.fn()

    render(<ExamRunner questions={[question]} mode="practice" onAnswerPractice={onAnswerPractice} onFinish={onFinish} />)

    // Regardless of how options were shuffled for display, find the button showing the
    // correct option's actual text and click it.
    const correctButton = screen.getByText(/Option C text - CORRECT/)
    fireEvent.click(correctButton)

    expect(onAnswerPractice).toHaveBeenCalledTimes(1)
    const [calledQuestion, chosenOptionId, correct] = onAnswerPractice.mock.calls[0]!
    expect(calledQuestion.id).toBe('q-1')
    // This is the regression check: chosenOptionId must be in ORIGINAL id-space ('c'),
    // matching question.correctOptionId, not whatever letter it was displayed under.
    expect(chosenOptionId).toBe('c')
    expect(correct).toBe(true)
  })

  it('reports correct=false and the original wrong option id when a wrong answer is clicked', () => {
    const question = makeQuestion()
    const onAnswerPractice = vi.fn()

    render(<ExamRunner questions={[question]} mode="practice" onAnswerPractice={onAnswerPractice} onFinish={vi.fn()} />)

    const wrongButton = screen.getByText(/Option A text/)
    fireEvent.click(wrongButton)

    expect(onAnswerPractice).toHaveBeenCalledTimes(1)
    const [, chosenOptionId, correct] = onAnswerPractice.mock.calls[0]!
    expect(chosenOptionId).toBe('a')
    expect(correct).toBe(false)
  })
})

describe('ExamRunner stable option order (correctness gate)', () => {
  function optionLabels(container: HTMLElement) {
    return [...container.querySelectorAll('button[aria-label]')]
      .filter((b) => /^[A-E]\. /.test(b.getAttribute('aria-label') ?? ''))
      .map((b) => b.getAttribute('aria-label'))
  }

  it('keeps the same option order after navigating to another question and back', () => {
    const q1 = makeQuestion({ id: 'q-1' })
    const q2 = makeQuestion({ id: 'q-2', options: q1.options.map((o) => ({ ...o, text: `${o.text} 2` })) })
    const { container, getByText } = render(<ExamRunner questions={[q1, q2]} mode="exam" durationMinutes={null} onFinish={vi.fn()} />)

    const before = optionLabels(container)
    fireEvent.click(getByText('הבא'))
    fireEvent.click(getByText('הקודם'))
    const after = optionLabels(container)
    expect(after).toEqual(before)
  })

  it('keeps the same option order across unrelated re-renders (flagging a question for review)', () => {
    const q1 = makeQuestion({ id: 'q-1' })
    const { container, getByText } = render(<ExamRunner questions={[q1]} mode="exam" durationMinutes={null} onFinish={vi.fn()} />)

    const before = optionLabels(container)
    fireEvent.click(getByText('סמן לחזרה'))
    const after = optionLabels(container)
    expect(after).toEqual(before)
  })
})
