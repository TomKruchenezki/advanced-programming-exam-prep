import { describe, it, expect } from 'vitest'
import { recordPracticeAnswer, recordMockExamResult, markDiagnosticComplete } from './progressActions'
import { createEmptyProgress } from './progressStore'
import type { MockExamAnswer, Question } from '../types/domain'

function makeQuestion(id: string, topicIds: string[], correctOptionId: Question['correctOptionId'] = 'c'): Question {
  return {
    id,
    topicIds,
    subtopic: 'test',
    stemHe: 'שאלה',
    options: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
      { id: 'c', text: 'C' },
      { id: 'd', text: 'D' },
      { id: 'e', text: 'E' },
    ],
    correctOptionId,
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

describe('recordPracticeAnswer', () => {
  it('adds a mistake log entry on a wrong answer', () => {
    const q = makeQuestion('q1', ['t1'])
    const next = recordPracticeAnswer(createEmptyProgress(), q, 'a')
    expect(next.mistakeLog).toHaveLength(1)
    expect(next.mistakeLog[0]?.questionId).toBe('q1')
    expect(next.mistakeLog[0]?.resolved).toBe(false)
  })

  it('does not add a mistake log entry on a correct answer', () => {
    const q = makeQuestion('q1', ['t1'])
    const next = recordPracticeAnswer(createEmptyProgress(), q, 'c')
    expect(next.mistakeLog).toHaveLength(0)
  })

  it('resolves a prior mistake once answered correctly', () => {
    const q = makeQuestion('q1', ['t1'])
    let progress = recordPracticeAnswer(createEmptyProgress(), q, 'a')
    expect(progress.mistakeLog[0]?.resolved).toBe(false)
    progress = recordPracticeAnswer(progress, q, 'c')
    expect(progress.mistakeLog[0]?.resolved).toBe(true)
  })

  it('increments questionStats seen/correct counters', () => {
    const q = makeQuestion('q1', ['t1'])
    const next = recordPracticeAnswer(createEmptyProgress(), q, 'c')
    expect(next.questionStats['q1']?.seen).toBe(1)
    expect(next.questionStats['q1']?.correct).toBe(1)
  })

  it('updates topic mastery for every topic the question belongs to', () => {
    const q = makeQuestion('q1', ['t1', 't2'])
    const next = recordPracticeAnswer(createEmptyProgress(), q, 'c')
    expect(next.topicMastery['t1']?.attempts).toBe(1)
    expect(next.topicMastery['t2']?.attempts).toBe(1)
  })
})

describe('recordMockExamResult', () => {
  it('logs mistakes for questions answered incorrectly in a mock exam', () => {
    const questions = [makeQuestion('q1', ['t1'], 'c'), makeQuestion('q2', ['t1'], 'a')]
    const answers: MockExamAnswer[] = [
      { questionId: 'q1', chosenOptionId: 'a', flaggedForReview: false }, // wrong
      { questionId: 'q2', chosenOptionId: 'a', flaggedForReview: false }, // correct
    ]
    const { progress } = recordMockExamResult(createEmptyProgress(), 'mock-1', questions, answers, 100)
    expect(progress.mistakeLog).toHaveLength(1)
    expect(progress.mistakeLog[0]?.questionId).toBe('q1')
  })

  it('updates questionStats for every question in the mock exam', () => {
    const questions = [makeQuestion('q1', ['t1'], 'c'), makeQuestion('q2', ['t1'], 'a')]
    const answers: MockExamAnswer[] = [
      { questionId: 'q1', chosenOptionId: 'a', flaggedForReview: false },
      { questionId: 'q2', chosenOptionId: 'a', flaggedForReview: false },
    ]
    const { progress } = recordMockExamResult(createEmptyProgress(), 'mock-1', questions, answers, 100)
    expect(progress.questionStats['q1']?.seen).toBe(1)
    expect(progress.questionStats['q1']?.correct).toBe(0)
    expect(progress.questionStats['q2']?.correct).toBe(1)
  })

  it('handles unanswered questions without creating a mistake log entry (no chosen option to log)', () => {
    const questions = [makeQuestion('q1', ['t1'], 'c')]
    const answers: MockExamAnswer[] = [{ questionId: 'q1', chosenOptionId: null, flaggedForReview: false }]
    const { progress } = recordMockExamResult(createEmptyProgress(), 'mock-1', questions, answers, 100)
    expect(progress.mistakeLog).toHaveLength(0)
    expect(progress.questionStats['q1']?.seen).toBe(1)
    expect(progress.questionStats['q1']?.correct).toBe(0)
  })

  it('appends a MockExamResult with correct scoring', () => {
    const questions = [makeQuestion('q1', ['t1'], 'c'), makeQuestion('q2', ['t1'], 'a')]
    const answers: MockExamAnswer[] = [
      { questionId: 'q1', chosenOptionId: 'c', flaggedForReview: false },
      { questionId: 'q2', chosenOptionId: 'a', flaggedForReview: false },
    ]
    const { progress, result } = recordMockExamResult(createEmptyProgress(), 'mock-1', questions, answers, 100)
    expect(result.scorePercent).toBe(100)
    expect(progress.mockExamResults).toHaveLength(1)
  })
})

describe('markDiagnosticComplete', () => {
  it('sets diagnosticCompleted to true', () => {
    const next = markDiagnosticComplete(createEmptyProgress())
    expect(next.diagnosticCompleted).toBe(true)
  })
})

describe('supplemental (question pack) question compatibility', () => {
  it('records a mistake and questionStats for a namespaced supplemental question id exactly like a core question', () => {
    const q = { ...makeQuestion('supplemental-practice1-q001', ['generics-collections-equals-hashcode']), packId: 'supplemental-practice1' }
    const next = recordPracticeAnswer(createEmptyProgress(), q, 'a')
    expect(next.mistakeLog).toHaveLength(1)
    expect(next.mistakeLog[0]?.questionId).toBe('supplemental-practice1-q001')
    expect(next.questionStats['supplemental-practice1-q001']?.seen).toBe(1)
    expect(next.topicMastery['generics-collections-equals-hashcode']?.attempts).toBe(1)
  })
})
