import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuestionCard } from './QuestionCard'
import type { ShuffledQuestion } from '../../lib/shuffle'
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
      { id: 'c', text: 'Option C text' },
      { id: 'd', text: 'Option D text' },
      { id: 'e', text: 'Option E text' },
    ],
    correctOptionId: 'c',
    explanation: 'explanation',
    optionExplanations: { a: 'wrong-a', b: 'wrong-b', c: 'right-c', d: 'wrong-d', e: 'wrong-e' },
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

/** Builds a ShuffledQuestion with a single option's text swapped in at display position 'a',
 *  so each BiDi-content test case only needs to override one option's text. */
function makeShuffled(optionAText: string, overrides: Partial<Question> = {}): ShuffledQuestion {
  const question = makeQuestion(overrides)
  question.options = [
    { id: 'a', text: optionAText },
    { id: 'b', text: 'Option B text' },
    { id: 'c', text: 'Option C text' },
    { id: 'd', text: 'Option D text' },
    { id: 'e', text: 'Option E text' },
  ]
  const displayToOriginal: Record<string, string> = { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e' }
  return { ...question, displayToOriginal }
}

function renderCard(question: ShuffledQuestion, opts: { selectedOptionId?: string | null; revealed?: boolean; onSelect?: (id: string) => void } = {}) {
  const onSelect = opts.onSelect ?? vi.fn()
  const utils = render(
    <QuestionCard question={question} selectedOptionId={opts.selectedOptionId ?? null} revealed={opts.revealed ?? false} onSelect={onSelect} />,
  )
  return { ...utils, onSelect }
}

describe('QuestionCard BiDi option rendering', () => {
  const cases: Array<[string, string]> = [
    ['Hebrew only', 'תבנית העיצוב Observer'],
    ['English only', 'Observer design pattern'],
    ['Mixed Hebrew and English', 'שימוש ב-Observer design pattern'],
    ['English with parentheses', 'Observer (Behavioral Pattern)'],
    ['Java code', 'new Thread(task).start()'],
    ['Complexity expression', 'O(n log n)'],
    ['Java generics', 'List<? extends Number>'],
    [
      'Long English answer',
      'This is a long English answer meant to wrap across multiple lines when rendered in a narrow answer option button in the actual browser layout',
    ],
    [
      'Long mixed Hebrew-English answer',
      'זהו תשובה ארוכה שמשלבת עברית וגם English text כדי לבדוק שהתווית לא זזה גם כשהתוכן ארוך ומעורב',
    ],
  ]

  it.each(cases)('%s: renders the label and answer text as separate DOM elements with correct dir attributes', (_label, text) => {
    const question = makeShuffled(text)
    const { container } = renderCard(question)

    const button = container.querySelectorAll('button')[0]!
    expect(button.getAttribute('dir')).toBe('rtl')

    const labelSpan = button.querySelector('span')!
    expect(labelSpan.textContent).toBe('A.')

    const bdi = button.querySelector('bdi')!
    expect(bdi.tagName.toLowerCase()).toBe('bdi')
    expect(bdi.getAttribute('dir')).toBe('auto')
    // The answer text must appear ONLY inside the bdi, never concatenated into the label.
    expect(bdi.textContent).toBe(text)
    expect(labelSpan.textContent).not.toContain(text)
  })

  it.each(cases)('%s: is explicitly right-aligned (physical, not logical) regardless of detected reading direction', (_label, text) => {
    // text-align must be the PHYSICAL "right", never the logical "start" - "start" resolves
    // to left once dir="auto" detects LTR content, which is exactly the bug being guarded against.
    const question = makeShuffled(text)
    const { container } = renderCard(question)
    const bdi = container.querySelector('bdi')!
    expect(bdi.className).toContain('text-right')
    expect(bdi.className).not.toContain('text-start')
  })

  it.each(cases)('%s: exposes an accessible name containing both the displayed letter and the full answer text', (_label, text) => {
    const question = makeShuffled(text)
    const { container } = renderCard(question)
    const button = container.querySelectorAll('button')[0]!
    expect(button.getAttribute('aria-label')).toBe(`A. ${text}`)
  })

  it('does not show a duplicated prefix when the option text has no pre-existing label', () => {
    const question = makeShuffled('Observer design pattern')
    const { container } = renderCard(question)
    const bdi = container.querySelector('bdi')!
    // The answer content itself must be exactly the original text - no second "A." baked in.
    expect(bdi.textContent).toBe('Observer design pattern')
    expect(bdi.textContent?.match(/^[A-E]\./)).toBeNull()
  })

  it('assigns displayed labels A-E strictly by visible position, not by original option id', () => {
    // Simulate a post-shuffle question where the ORIGINAL correct option ('c') now sits
    // at display position 'a', and the ORIGINAL first option ('a') now sits at display 'e'.
    const question: ShuffledQuestion = {
      ...makeQuestion(),
      options: [
        { id: 'a', text: 'Was originally C (now displayed first)' },
        { id: 'b', text: 'Was originally D' },
        { id: 'c', text: 'Was originally E' },
        { id: 'd', text: 'Was originally B' },
        { id: 'e', text: 'Was originally A (now displayed last)' },
      ],
      correctOptionId: 'a',
      displayToOriginal: { a: 'c', b: 'd', c: 'e', d: 'b', e: 'a' },
    }
    const { container } = renderCard(question)
    const buttons = container.querySelectorAll('button')
    const labels = [...buttons].map((b) => b.querySelector('span')!.textContent)
    expect(labels).toEqual(['A.', 'B.', 'C.', 'D.', 'E.'])

    // The displayed label for the option that is now first must be 'A.', not 'C.' (its original id).
    expect(buttons[0]!.querySelector('bdi')!.textContent).toBe('Was originally C (now displayed first)')
  })

  it('reports the DISPLAY option id (not the original id) to onSelect when a shuffled option is clicked', () => {
    // QuestionCard itself only ever deals in display-id space; translation to original id
    // happens one layer up in ExamRunner (buildAnswers), which must remain untouched.
    const question: ShuffledQuestion = {
      ...makeQuestion(),
      options: [
        { id: 'a', text: 'Was originally C' },
        { id: 'b', text: 'Was originally D' },
        { id: 'c', text: 'Was originally E' },
        { id: 'd', text: 'Was originally B' },
        { id: 'e', text: 'Was originally A' },
      ],
      correctOptionId: 'a',
      displayToOriginal: { a: 'c', b: 'd', c: 'e', d: 'b', e: 'a' },
    }
    const onSelect = vi.fn()
    renderCard(question, { onSelect })

    fireEvent.click(screen.getByText('Was originally A'))
    expect(onSelect).toHaveBeenCalledWith('e')
  })

  it('looks up each revealed per-option explanation via displayToOriginal, isolated in its own bdi', () => {
    const question: ShuffledQuestion = {
      ...makeQuestion(),
      options: [
        { id: 'a', text: 'Observer design pattern' },
        { id: 'b', text: 'Option B text' },
        { id: 'c', text: 'Option C text' },
        { id: 'd', text: 'Option D text' },
        { id: 'e', text: 'Option E text' },
      ],
      correctOptionId: 'a',
      optionExplanations: { a: 'wrong-a', b: 'wrong-b', c: 'right-c', d: 'wrong-d', e: 'wrong-e' },
      // display 'a' maps back to original 'c' (which owns explanation 'right-c')
      displayToOriginal: { a: 'c', b: 'b', c: 'a', d: 'd', e: 'e' },
    }
    const { container } = renderCard(question, { revealed: true })
    const explanationRows = container.querySelectorAll('.space-y-1 > div')
    expect(explanationRows[0]!.getAttribute('dir')).toBe('rtl')
    const explanationBdi = explanationRows[0]!.querySelector('bdi')!
    expect(explanationBdi.textContent).toBe('right-c')
    expect(explanationBdi.className).toContain('text-right')
    expect(explanationBdi.className).not.toContain('text-start')
  })

  it('renders a supplemental (packId) question with identical BiDi/alignment behavior to a core question', () => {
    const question = makeShuffled('Observer design pattern', { packId: 'supplemental-practice1' })
    const { container } = renderCard(question)
    const button = container.querySelectorAll('button')[0]!
    const bdi = button.querySelector('bdi')!
    expect(button.getAttribute('dir')).toBe('rtl')
    expect(bdi.getAttribute('dir')).toBe('auto')
    expect(bdi.className).toContain('text-right')
    expect(bdi.textContent).toBe('Observer design pattern')
  })
})
