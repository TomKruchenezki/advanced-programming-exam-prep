export interface BidiSegment {
  text: string
  isLtr: boolean
}

const HEBREW_CHAR = /[֐-׿]/
const LATIN_OR_DIGIT = /[A-Za-z0-9]/

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

  const raw: BidiSegment[] = []
  let i = 0
  while (i < input.length) {
    const startsHebrew = HEBREW_CHAR.test(input[i]!)
    let j = i + 1
    while (j < input.length && HEBREW_CHAR.test(input[j]!) === startsHebrew) j++
    const run = input.slice(i, j)
    raw.push({ text: run, isLtr: !startsHebrew && LATIN_OR_DIGIT.test(run) })
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
  return merged
}
