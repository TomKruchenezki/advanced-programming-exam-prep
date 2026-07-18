import { segmentBidiText } from '../../lib/bidiSegment'
import { Ltr } from '../question/Ltr'

/**
 * Renders the LTR fragments of a mixed Hebrew/technical string as isolated `Ltr` spans (reusing
 * the existing, already-shipped isolation utility) while leaving the Hebrew/neutral-punctuation
 * fragments as plain text. Exposed separately from `BidiText` so it can be dropped inside an
 * ALREADY-correct outer wrapper (e.g. the answer-option `<bdi dir="auto" ...>`) without touching
 * that wrapper's own attributes/classes.
 */
export function BidiSegments({ text }: { text: string }) {
  return (
    <>
      {segmentBidiText(text).map((seg, i) => {
        if (!seg.isLtr) return seg.text
        const display = seg.displayText ?? seg.text
        if (seg.isInlineCode) {
          return (
            <code key={i} className="ltr-inline rounded bg-[var(--color-bg-subtle)] px-1 py-0.5 font-mono text-[0.9em]">
              {display}
            </code>
          )
        }
        return <Ltr key={i}>{display}</Ltr>
      })}
    </>
  )
}

type BidiTextTag = 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'li' | 'strong'

interface BidiTextProps {
  text: string
  as?: BidiTextTag
  className?: string
}

/**
 * Drop-in replacement for `<Tag className="...">{mixedString}</Tag>` wherever a Hebrew sentence
 * embeds technical/English fragments (headings, question stems, study-content prose). The outer
 * element stays `dir="rtl"` and physically `text-right` (never `text-start`/`dir="auto"` - the
 * same lesson as the earlier answer-option fix: logical alignment flips once embedded LTR content
 * resolves the block's own direction). `aria-label` carries the exact, unmodified source string
 * so assistive tech always announces the sentence as authored, regardless of how the visual DOM
 * is fragmented internally.
 */
export function BidiText({ text, as = 'span', className = '' }: BidiTextProps) {
  const Tag = as
  return (
    <Tag dir="rtl" aria-label={text} className={`text-right ${className}`.trim()}>
      <BidiSegments text={text} />
    </Tag>
  )
}
