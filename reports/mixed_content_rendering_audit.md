# Mixed RTL/LTR Content Rendering Audit (Final Deep Audit — Phase A)

## Root cause

Two distinct things were reported together; only one was a real, previously-unfixed bug.

**1. Confirmed and fixed: raw Markdown backticks visible in prose.** `studySections.json` (and likely other content files) contains Markdown-style inline-code notation authored as `` `OrderService` ``, `` `placeOrder` ``, `` `MySQLDatabase` ``, `` `Person` ``, `` `AShape` ``, etc. The application has never included a Markdown parser - only BiDi direction segmentation - so these backtick characters were rendered to the user exactly as typed, as literal punctuation. The previous round's bracket/quote-pairing fix already correctly *isolated* the direction of these spans (confirmed: `` `OrderService` `` was already one atomic LTR unit), but never *stripped* the delimiter characters themselves, since that was never in scope for a direction-only segmenter.

**2. Investigated and found already correct: the cited BiDi examples.** The exact reported pattern "State Space (מול)Start State" does not exist anywhere in the source data (grepped) and does not reproduce - it appears to be a compressed/paraphrased illustration of the general problem class, not a literal quote. The actual real sentence this was drawn from - `"Start State (נקודת המוצא הקונקרטית) מול State Space (כלל המצבים האפשריים העקרוניים) - ..."` - was traced through `segmentBidiText` directly (both as a unit test and via real-browser character-position measurement) and reconstructs and renders in perfect source order. This is exactly the shape of bug the previous round's bracket-pair-matching fix (Latin term, opening paren, pure-Hebrew content, closing paren, adjacent Hebrew) was built to solve, and it already covers this case. No segmentation algorithm change was needed or made here.

## The fix

One additive change to `src/lib/bidiSegment.ts`, no new parsing architecture:

- `findBacktickPairPositions()` - a simple, unambiguous toggle-match for `` `...` `` pairs (backticks are never used for Hebrew abbreviation notation, unlike straight quotes, so no gershayim-style guard is needed).
- These positions are folded into the existing `ltrWorthyDelimiters` set, so a backtick-delimited span is always isolated as LTR even if its content alone wouldn't otherwise qualify.
- A final pass over the already-built segments produces `displayText` (the segment's text with only the backtick *characters* removed - never anything else) and `isInlineCode` (true only when the entire segment is exactly one backtick pair, e.g. `` `OrderService` ``, vs. false when a pair merged into a larger punctuation run like `` (`placeOrder`) ``, which still gets its backticks stripped but isn't styled as a standalone code chunk).
- `BidiSegments`/`BidiText` (`src/components/shared/BidiText.tsx`) render `displayText ?? text`; when `isInlineCode`, the segment renders inside a `<code className="ltr-inline ... font-mono ...">` instead of a plain `<Ltr>` span, giving it a lightweight monospace treatment consistent with the existing `CodeBlock` styling.

Critically: `text` (used for reconstruction, `aria-label`, and the "source untouched" invariant) is **never modified** - it still contains the original backticks. Only the separate `displayText` field, used purely for rendering, has them removed. No `.json` data file was touched.

## Components affected

`src/lib/bidiSegment.ts`, `src/components/shared/BidiText.tsx` - both already the single shared rendering path used everywhere (`Learn`, `QuestionCard`, `Flashcards`, `MistakeNotebook`, `LastMinuteReview`, `Search`, `ExamResultView`, `Dashboard`, `SupplementalQuestions`), so the fix applies site-wide automatically with no route-by-route changes needed.

## Tests added

`bidiSegment.test.ts` (+5): a whole backtick pair gets `isInlineCode:true` and stripped `displayText`; a pair merged with surrounding parens gets stripped `displayText` but `isInlineCode:false`; multiple independent pairs in one sentence are each stripped correctly; a lone unmatched backtick is left completely untouched (no crash, no false match); a string with no backticks has no `displayText`/`isInlineCode` on any segment. `BidiText.test.tsx` (+2): visible text never contains a literal backtick while `aria-label` still carries the full original string including backticks; a whole backtick term renders inside `code.ltr-inline`.

## Manual verification

Loaded `solid-principles` in the browser: confirmed via `document.body.innerText` that zero backtick characters remain anywhere on the page, and 9 real `code.ltr-inline` elements render (`OrderService`, `MySQLDatabase`, `setWidth(5)`, `Mammal`, `eat()`, ...). Screenshot confirms `OrderService`/`MySQLDatabase` render as clean, monospace, LTR-isolated pills inline within the Hebrew sentence. Loaded `state-space-decoupling-interfaces` and located the real "מה קל לבלבל" bullet containing "Start State (...) מול State Space (...)" - confirmed via the same real-DOM character-position measurement technique established in the prior audit round that it renders in exact source order (no code change was needed for this case, as predicted).

## Viewports and routes inspected

Desktop viewport on `solid-principles` and `state-space-decoupling-interfaces` (the two topics containing every example the report cited). Given the fix is a single shared-renderer change with no layout/CSS impact (inline `<code>` vs `<span>`, same `ltr-inline` isolation class), it does not interact with viewport width, so the existing full responsive audit (6 viewports, prior rounds) remains valid without re-running every viewport for this specific change.

## Remaining limitations

Unchanged from the prior audit: `<option>` dropdown elements (HTML cannot nest markup inside `<option>`) and `SupplementalBadge` (currently pure-Hebrew data only) remain documented, low-risk exceptions.

## Verification performed

`npm run verify`: **246/246 tests pass**, typecheck/lint clean, `validate:data` unchanged, build succeeds. Zero `.json` data file changes (hash diff). Stable option order and scoring untouched (this pass changed only `bidiSegment.ts`/`BidiText.tsx`, nothing in the shuffle/state-isolation code paths).
