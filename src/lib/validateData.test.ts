import { describe, it, expect } from 'vitest'
import { validateQuestions, validateFlashcards, validateMockExams } from './validateData'
import type { Flashcard, MockExam, Question, Topic } from '../types/domain'

function makeValidQuestion(id = 'q-1'): Question {
  return {
    id,
    topicIds: ['t1'],
    subtopic: 'test',
    stemHe: 'שאלה תקינה',
    options: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
      { id: 'c', text: 'C' },
      { id: 'd', text: 'D' },
      { id: 'e', text: 'E' },
    ],
    correctOptionId: 'a',
    explanation: 'הסבר',
    optionExplanations: { a: 'נכון', b: 'שגוי', c: 'שגוי', d: 'שגוי', e: 'שגוי' },
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

const topics: Topic[] = [{ id: 't1', order: 1, titleHe: 'נושא', titleEn: 'Topic', lectureRefs: [], examFrequency: 'high', summary: '', sectionIds: [] }]

describe('validateQuestions', () => {
  it('accepts a valid question with no errors', () => {
    const issues = validateQuestions([makeValidQuestion()], topics)
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0)
  })

  it('flags duplicate ids', () => {
    const issues = validateQuestions([makeValidQuestion('dup'), makeValidQuestion('dup')], topics)
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('Duplicate question id'))).toBe(true)
  })

  it('flags wrong option count', () => {
    const q = makeValidQuestion()
    q.options = q.options.slice(0, 4)
    const issues = validateQuestions([q], topics)
    expect(issues.some((i) => i.message.includes('Expected exactly 5 options'))).toBe(true)
  })

  it('flags correctOptionId not among options', () => {
    const q = makeValidQuestion()
    q.correctOptionId = 'z' as Question['correctOptionId']
    const issues = validateQuestions([q], topics)
    expect(issues.some((i) => i.message.includes('not among options'))).toBe(true)
  })

  it('flags duplicate option text', () => {
    const q = makeValidQuestion()
    q.options = [
      { id: 'a', text: 'Same' },
      { id: 'b', text: 'Same' },
      { id: 'c', text: 'C' },
      { id: 'd', text: 'D' },
      { id: 'e', text: 'E' },
    ]
    const issues = validateQuestions([q], topics)
    expect(issues.some((i) => i.message.includes('Duplicate option text'))).toBe(true)
  })

  it('flags empty stem', () => {
    const q = makeValidQuestion()
    q.stemHe = '  '
    const issues = validateQuestions([q], topics)
    expect(issues.some((i) => i.message.includes('Empty question stem'))).toBe(true)
  })

  it('flags missing explanation', () => {
    const q = makeValidQuestion()
    q.explanation = ''
    const issues = validateQuestions([q], topics)
    expect(issues.some((i) => i.message.includes('Missing explanation'))).toBe(true)
  })

  it('flags missing option explanations', () => {
    const q = makeValidQuestion()
    q.optionExplanations = { a: 'x' }
    const issues = validateQuestions([q], topics)
    expect(issues.some((i) => i.message.includes('Missing optionExplanations'))).toBe(true)
  })

  it('flags unknown topicId', () => {
    const q = makeValidQuestion()
    q.topicIds = ['does-not-exist']
    const issues = validateQuestions([q], topics)
    expect(issues.some((i) => i.message.includes('Unknown topicId'))).toBe(true)
  })

  it('flags active questions marked needsReview as an error', () => {
    const q = makeValidQuestion()
    q.needsReview = true
    q.active = true
    const issues = validateQuestions([q], topics)
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('needsReview'))).toBe(true)
  })

  it('warns on possible duplicate stems among active questions', () => {
    const q1 = makeValidQuestion('q-1')
    const q2 = makeValidQuestion('q-2')
    q2.stemHe = q1.stemHe
    const issues = validateQuestions([q1, q2], topics)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('duplicate stem'))).toBe(true)
  })

  it('warns when the correct option is the longest by a wide margin', () => {
    const q = makeValidQuestion()
    q.options = [
      { id: 'a', text: 'This is a much longer and far more detailed correct answer than the rest' },
      { id: 'b', text: 'short' },
      { id: 'c', text: 'short' },
      { id: 'd', text: 'short' },
      { id: 'e', text: 'short' },
    ]
    q.correctOptionId = 'a'
    const issues = validateQuestions([q], topics)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('length-based guessing cue'))).toBe(true)
  })

  it('does not warn about length when option lengths are balanced', () => {
    const q = makeValidQuestion()
    q.options = [
      { id: 'a', text: 'A correct answer of reasonable length' },
      { id: 'b', text: 'A wrong answer of reasonable length' },
      { id: 'c', text: 'Another wrong answer of similar length' },
      { id: 'd', text: 'Yet another wrong answer of similar length' },
      { id: 'e', text: 'One more wrong answer of similar length' },
    ]
    q.correctOptionId = 'a'
    const issues = validateQuestions([q], topics)
    expect(issues.some((i) => i.message.includes('length-based guessing cue'))).toBe(false)
  })

  it('exempts questions listed in pastExamIds from the length-based guessing warning', () => {
    const q = makeValidQuestion('q-pastexam-1')
    q.options = [
      { id: 'a', text: 'This is a much longer and far more detailed correct answer than the rest' },
      { id: 'b', text: 'short' },
      { id: 'c', text: 'short' },
      { id: 'd', text: 'short' },
      { id: 'e', text: 'short' },
    ]
    q.correctOptionId = 'a'
    const issues = validateQuestions([q], topics, { pastExamIds: new Set(['q-pastexam-1']) })
    expect(issues.some((i) => i.message.includes('length-based guessing cue'))).toBe(false)
  })

  it('exempts reconstruction/adapted origin questions from the length-based guessing warning', () => {
    const q = makeValidQuestion()
    q.origin = 'reconstruction'
    q.options = [
      { id: 'a', text: 'This is a much longer and far more detailed correct answer than the rest' },
      { id: 'b', text: 'short' },
      { id: 'c', text: 'short' },
      { id: 'd', text: 'short' },
      { id: 'e', text: 'short' },
    ]
    q.correctOptionId = 'a'
    const issues = validateQuestions([q], topics)
    expect(issues.some((i) => i.message.includes('length-based guessing cue'))).toBe(false)
  })
})

describe('validateFlashcards', () => {
  const validCard: Flashcard = { id: 'fc-1', topicId: 't1', frontHe: 'שאלה', backHe: 'תשובה', difficulty: 'easy', source: 'authored', tags: [] }

  it('accepts a valid flashcard', () => {
    expect(validateFlashcards([validCard], topics)).toHaveLength(0)
  })

  it('flags missing front/back text', () => {
    const card = { ...validCard, frontHe: '' }
    expect(validateFlashcards([card], topics).some((i) => i.message.includes('front or back'))).toBe(true)
  })

  it('flags unknown topicId', () => {
    const card = { ...validCard, topicId: 'nope' }
    expect(validateFlashcards([card], topics).some((i) => i.message.includes('Unknown topicId'))).toBe(true)
  })
})

describe('validateMockExams', () => {
  const questions = Array.from({ length: 25 }, (_, i) => makeValidQuestion(`q-${i}`))
  const questionsById = new Map(questions.map((q) => [q.id, q]))

  it('accepts an exam with exactly 20 unique questions summing to 100', () => {
    const exam: MockExam = { id: 'mock-1', titleHe: 'מבחן', questionIds: questions.slice(0, 20).map((q) => q.id), durationMinutesDefault: 90, totalPoints: 100 }
    expect(validateMockExams([exam], questionsById)).toHaveLength(0)
  })

  it('flags exams without exactly 20 questions', () => {
    const exam: MockExam = { id: 'mock-2', titleHe: 'מבחן', questionIds: questions.slice(0, 15).map((q) => q.id), durationMinutesDefault: 90, totalPoints: 75 }
    expect(validateMockExams([exam], questionsById).some((i) => i.message.includes('exactly 20 questions'))).toBe(true)
  })

  it('flags duplicate question ids within an exam', () => {
    const ids = questions.slice(0, 19).map((q) => q.id)
    ids.push(ids[0]!)
    const exam: MockExam = { id: 'mock-3', titleHe: 'מבחן', questionIds: ids, durationMinutesDefault: 90, totalPoints: 100 }
    expect(validateMockExams([exam], questionsById).some((i) => i.message.includes('Duplicate question ids'))).toBe(true)
  })

  it('flags references to unknown question ids', () => {
    const exam: MockExam = { id: 'mock-4', titleHe: 'מבחן', questionIds: [...questions.slice(0, 19).map((q) => q.id), 'ghost-id'], durationMinutesDefault: 90, totalPoints: 100 }
    expect(validateMockExams([exam], questionsById).some((i) => i.message.includes('unknown question id'))).toBe(true)
  })
})
