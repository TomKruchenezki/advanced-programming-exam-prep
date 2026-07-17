import { CodeBlock } from './CodeBlock'
import type { ShuffledQuestion } from '../../lib/shuffle'
import { BidiText, BidiSegments } from '../shared/BidiText'

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
        <BidiText as="p" className="text-question whitespace-pre-wrap font-medium" text={question.stemHe} />
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
              type="button"
              dir="rtl"
              disabled={revealed}
              onClick={() => onSelect(opt.id)}
              aria-label={`${opt.id.toUpperCase()}. ${opt.text}`}
              className={`text-answer flex w-full items-start gap-2 rounded-lg border p-4 transition-colors ${stateClasses} disabled:cursor-default`}
            >
              <span className="shrink-0 font-bold">{opt.id.toUpperCase()}.</span>
              <bdi dir="auto" className="min-w-0 flex-1 text-right">
                <BidiSegments text={opt.text} />
              </bdi>
            </button>
          )
        })}
      </div>
      {revealed && (
        <div className="text-body-lg space-y-3 rounded-lg bg-[var(--color-bg-subtle)] p-4">
          <p>
            <strong>הסבר: </strong>
            <BidiSegments text={question.explanation} />
          </p>
          <div className="space-y-1">
            {question.options.map((opt) => {
              const originalId = question.displayToOriginal[opt.id] ?? opt.id
              return (
                <div key={opt.id} dir="rtl" className="flex items-start gap-2 text-[var(--color-text-muted)]">
                  <strong className="shrink-0">{opt.id.toUpperCase()}:</strong>
                  <bdi dir="auto" className="min-w-0 flex-1 text-right">
                    <BidiSegments text={question.optionExplanations[originalId] ?? ''} />
                  </bdi>
                </div>
              )
            })}
          </div>
          {question.sourceReferences.length > 0 && (
            <p className="text-meta text-[var(--color-text-muted)]">
              מקור: <BidiSegments text={question.sourceReferences.map((r) => `${r.fileName} (${r.locator})`).join(', ')} />
            </p>
          )}
        </div>
      )}
    </div>
  )
}
