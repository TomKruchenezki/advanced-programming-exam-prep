import { useMemo, useState, type ReactNode } from 'react'
import type { Question } from '../../types/domain'
import { stableShuffleQuestionOptions } from '../../lib/shuffle'
import { recordPracticeAnswer } from '../../lib/progressActions'
import { useProgress } from '../../lib/ProgressContext'
import { QuestionCard } from './QuestionCard'

interface InteractiveCheckQuestionProps {
  question: Question
  badge?: ReactNode
}

/**
 * A single self-contained practice question: renders neutral (no option selected, no
 * feedback, no explanation) until the user picks an option, then reveals feedback for
 * that question only and records progress. Shared by Learn's per-section check questions
 * and its "new questions in this topic" supplemental preview, so both start unanswered and
 * never leak state into one another - each instance owns its own `answered` state, keyed
 * to this question via a stable, deterministic shuffle seeded by `question.id`.
 */
export function InteractiveCheckQuestion({ question, badge }: InteractiveCheckQuestionProps) {
  const { updateProgress } = useProgress()
  const [answered, setAnswered] = useState<string | null>(null)
  const shuffled = useMemo(() => stableShuffleQuestionOptions(question, question.id), [question])

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
      {badge}
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
