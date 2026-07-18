export interface BidiSegment {
  text: string
  isLtr: boolean
  /** Present when this segment contains Markdown-style `` `backtick` `` inline-code delimiters
   * that should not be shown to the user - the delimiters are stripped from this text, while
   * `text` above keeps the exact original source (backticks included) so reconstruction/
   * accessible-name invariants over `text` are unaffected. */
  displayText?: string
  /** True only when the ENTIRE segment is exactly one backtick-delimited span (e.g. "`Person`"),
   * so the renderer can apply inline-code styling to the whole segment. False (or absent) when
   * a backtick pair merged into a larger run alongside other punctuation (e.g. "(`placeOrder`)") -
   * the backticks are still stripped via `displayText`, just without special code styling, since
   * the run isn't exclusively code. */
  isInlineCode?: boolean
}

const HEBREW_CHAR = /[֐-׿]/
const LATIN_OR_DIGIT = /[A-Za-z0-9]/
const BRACKET_OPEN: Record<string, string> = { '(': ')', '[': ']', '{': '}' }
const BRACKET_CLOSE: Record<string, string> = { ')': '(', ']': '[', '}': '{' }

/** Nearest non-whitespace character before/after `index` (empty string if none). */
function nearestNonSpace(input: string, index: number, direction: 1 | -1): string {
  let i = index + direction
  while (i >= 0 && i < input.length && /\s/.test(input[i]!)) i += direction
  return i >= 0 && i < input.length ? input[i]! : ''
}

/**
 * Finds bracket/quote pairs `()`, `[]`, `{}`, `'...'`, `"..."`, `` `...` `` that are "technical" -
 * either their enclosed content contains a Latin letter/digit somewhere between them (even if a
 * Hebrew word interrupts the run in between - e.g. "(public class אחת)"), or the delimiter pair
 * itself sits directly against Latin content just outside it (e.g. "DIP (תלות ישירה בלבד)." where
 * the enclosed text is pure Hebrew, but the pair is glossing the preceding English term "DIP").
 * Returns the string indices of both delimiter characters in each such pair, so the caller can
 * isolate them as LTR even when the delimiter's own immediate run contains no Latin/digit itself
 * (e.g. a lone trailing "),"). Without this, a closing delimiter separated from its Latin content
 * by a Hebrew word is left merged into plain Hebrew-context text, where it is subject to
 * unpredictable Unicode BiDi neutral-character reordering relative to adjacent punctuation.
 */
function findLtrWorthyDelimiterPositions(input: string): Set<number> {
  const worthy = new Set<number>()
  const stack: { ch: string; i: number }[] = []
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!
    if (BRACKET_OPEN[ch]) {
      stack.push({ ch, i })
    } else if (BRACKET_CLOSE[ch] && stack.length > 0 && stack[stack.length - 1]!.ch === BRACKET_CLOSE[ch]) {
      const open = stack.pop()!
      const touchesLatinOutside =
        LATIN_OR_DIGIT.test(nearestNonSpace(input, open.i, -1)) || LATIN_OR_DIGIT.test(nearestNonSpace(input, i, 1))
      if (LATIN_OR_DIGIT.test(input.slice(open.i + 1, i)) || touchesLatinOutside) {
        worthy.add(open.i)
        worthy.add(i)
      }
    }
  }
  for (const quote of ["'", '"', '`']) {
    let openIndex = -1
    for (let i = 0; i < input.length; i++) {
      if (input[i] !== quote) continue
      // Skip a quote/geresh character sitting mid-word between two Hebrew letters (Hebrew
      // abbreviation marks like ע"י or בד"כ, or a geresh in ד'ר) - these are not phrase-quote
      // delimiters at all, and pairing them up with an unrelated later mark of the same
      // character elsewhere in the paragraph would wrongly treat everything between them
      // (often containing real Latin content) as one bogus "quoted" span.
      const leftHeb = i > 0 && HEBREW_CHAR.test(input[i - 1]!)
      const rightHeb = i < input.length - 1 && HEBREW_CHAR.test(input[i + 1]!)
      if (leftHeb && rightHeb) continue
      if (openIndex === -1) {
        openIndex = i
        continue
      }
      if (LATIN_OR_DIGIT.test(input.slice(openIndex + 1, i))) {
        worthy.add(openIndex)
        worthy.add(i)
      }
      openIndex = -1
    }
  }
  return worthy
}

/**
 * Finds the exact indices of backtick characters that form a matched `` `...` `` pair -
 * regardless of what's inside (unlike quotes, a backtick pair is unambiguously Markdown
 * inline-code notation in this content, never a Hebrew abbreviation mark), so these positions
 * are always treated as LTR-worthy and always stripped from display text.
 */
function findBacktickPairPositions(input: string): Set<number> {
  const positions = new Set<number>()
  let openIndex = -1
  for (let i = 0; i < input.length; i++) {
    if (input[i] !== '`') continue
    if (openIndex === -1) {
      openIndex = i
      continue
    }
    positions.add(openIndex)
    positions.add(i)
    openIndex = -1
  }
  return positions
}

/**
 * Splits a mixed Hebrew/technical string into alternating segments without altering any
 * characters. A segment is LTR only if it is a maximal run of non-Hebrew characters that
 * contains at least one Latin letter or digit (so quotes, dots, angle brackets, parens, and
 * internal spaces belonging to that run travel with it - e.g. `restoredUser.city`,
 * `"Beer Sheva"`, `List<? extends Number>`, `Java Virtual Machine` each stay atomic). Pure
 * neutral punctuation adjacent to Hebrew (a colon, a lone question mark) is left merged into
 * the surrounding RTL segment rather than isolated, since it carries no directional content of
 * its own and isolating it would only fragment the DOM for no benefit.
 *
 * Concatenating every segment's `text` in order always reconstructs the original input exactly.
 */
const LEADING_TRAILING_WS = /^(\s*)([\s\S]*?)(\s*)$/

export function segmentBidiText(input: string): BidiSegment[] {
  if (!input) return []

  const ltrWorthyDelimiters = findLtrWorthyDelimiterPositions(input)
  const backtickPositions = findBacktickPairPositions(input)
  for (const pos of backtickPositions) ltrWorthyDelimiters.add(pos)
  const raw: BidiSegment[] = []
  let i = 0
  while (i < input.length) {
    const startsHebrew = HEBREW_CHAR.test(input[i]!)
    let j = i + 1
    while (j < input.length && HEBREW_CHAR.test(input[j]!) === startsHebrew) j++
    const run = input.slice(i, j)
    let isLtr = !startsHebrew && LATIN_OR_DIGIT.test(run)
    if (!startsHebrew && !isLtr) {
      for (let k = i; k < j && !isLtr; k++) isLtr = ltrWorthyDelimiters.has(k)
    }
    raw.push({ text: run, isLtr })
    i = j
  }

  // Peel leading/trailing whitespace off LTR runs so an isolated fragment never carries a
  // dangling space at its edge - whitespace has no direction of its own and reads fine as
  // plain ambient text next to it.
  const peeled: BidiSegment[] = []
  for (const seg of raw) {
    if (!seg.isLtr) {
      peeled.push({ ...seg })
      continue
    }
    const [, lead, core, trail] = seg.text.match(LEADING_TRAILING_WS)!
    if (lead) peeled.push({ text: lead, isLtr: false })
    if (core) peeled.push({ text: core, isLtr: true })
    if (trail) peeled.push({ text: trail, isLtr: false })
  }

  // Merge consecutive non-LTR runs (Hebrew text + pure neutral punctuation/whitespace) so
  // punctuation like a colon or question mark never becomes its own isolated fragment.
  const merged: BidiSegment[] = []
  for (const seg of peeled) {
    const last = merged[merged.length - 1]
    if (last && !last.isLtr && !seg.isLtr) {
      last.text += seg.text
    } else {
      merged.push({ ...seg })
    }
  }

  // Strip Markdown backtick delimiters from display only - `text` (used for reconstruction,
  // aria-label, and copy/accessibility) always keeps the exact original source untouched.
  let cursor = 0
  for (const seg of merged) {
    const start = cursor
    cursor += seg.text.length
    if (!seg.isLtr) continue // backticks are only ever ltrWorthy, so never appear in a non-LTR segment
    let hasBacktick = false
    let displayText = ''
    for (let k = 0; k < seg.text.length; k++) {
      if (seg.text[k] === '`' && backtickPositions.has(start + k)) {
        hasBacktick = true
        continue
      }
      displayText += seg.text[k]
    }
    if (!hasBacktick) continue
    seg.displayText = displayText
    const lastIdx = seg.text.length - 1
    seg.isInlineCode = seg.text[0] === '`' && seg.text[lastIdx] === '`' && backtickPositions.has(start) && backtickPositions.has(start + lastIdx)
  }

  return merged
}
