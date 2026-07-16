import { CodeBlock } from './CodeBlock'
import type { ShuffledQuestion } from '../../lib/shuffle'

interface QuestionCardProps {
  question: ShuffledQuestion
  selectedOptionId: string | null
  revealed: boolean
  onSelect: (optionId: string) => void
}

export function QuestionCard({ question, selectedOptionId, revealed, onSelect }: QuestionCardProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-question whitespace-pre-wrap font-medium">{question.stemHe}</p>
        {question.code && <CodeBlock code={question.code} />}
      </div>
      <div className="space-y-2">
        {question.options.map((opt) => {
          const isSelected = selectedOptionId === opt.id
          const isCorrectOption = revealed && opt.id === question.correctOptionId
          const isWrongSelected = revealed && isSelected && opt.id !== question.correctOptionId

          let stateClasses = 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
          if (isCorrectOption) stateClasses = 'border-[var(--color-success)] bg-[var(--color-success)]/10'
          else if (isWrongSelected) stateClasses = 'border-[var(--color-danger)] bg-[var(--color-danger)]/10'
          else if (isSelected) stateClasses = 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'

          return (
            <button
              key={opt.id}
              disabled={revealed}
              onClick={() => onSelect(opt.id)}
              className={`text-answer block w-full rounded-lg border p-4 text-start transition-colors ${stateClasses} disabled:cursor-default`}
            >
              <span className="me-2 font-bold">{opt.id.toUpperCase()}.</span>
              {opt.text}
            </button>
          )
        })}
      </div>
      {revealed && (
        <div className="text-body-lg space-y-3 rounded-lg bg-[var(--color-bg-subtle)] p-4">
          <p>
            <strong>הסבר: </strong>
            {question.explanation}
          </p>
          <div className="space-y-1">
            {question.options.map((opt) => {
              const originalId = question.displayToOriginal[opt.id] ?? opt.id
              return (
                <p key={opt.id} className="text-[var(--color-text-muted)]">
                  <strong>{opt.id.toUpperCase()}:</strong> {question.optionExplanations[originalId] ?? ''}
                </p>
              )
            })}
          </div>
          {question.sourceReferences.length > 0 && (
            <p className="text-meta text-[var(--color-text-muted)]">
              מקור: {question.sourceReferences.map((r) => `${r.fileName} (${r.locator})`).join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
