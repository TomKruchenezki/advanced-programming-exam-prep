# Responsive UI Audit

Audit performed via the dev server (`npm run dev`) using automated browser tooling: viewport resizing, DOM-based horizontal-overflow detection (`document.documentElement.scrollWidth` vs `window.innerWidth`, plus a full-DOM bounding-rect sweep for any element crossing the viewport edges), and live interaction (clicking through filters, starting/submitting exams, revealing flashcards, searching).

## Screens tested

1. Dashboard (`/`)
2. Learn — topic list (`/learn`) and topic reader (`/learn/:topicId`, tested on multiple code-heavy topics: `solid-principles`, `design-patterns-behavioral`, `design-patterns-structural`, `thread-safety-synchronization`, `java-platform-jvm` → `java-basics-oop-memory` for prev/next nav)
3. Diagnostic — setup screen, active `ExamRunner`, `ExamResultView` results screen
4. Quiz Me — filter setup screen (all 10 modes), active practice session (`ExamRunner` in practice mode)
5. Mock Exam — exam list, exam config screen, active `ExamRunner`, `ExamResultView`
6. Past Exams — exam list (all 4 years), exam-taking flow
7. Flashcards — deck view, reveal, rating
8. Mistake Notebook — empty state, populated state with new topic/sort/resolved filters
9. Last-Minute Review — full page
10. Search — input, kind filters, highlighted results
11. Global navigation (`AppLayout` sidebar/main) and backup/import/reset controls (`ProgressControls`)

## Viewports tested

1920×1080, 1440×900, 1280×800, 1024×768, 768×1024, 390×844.

Full 10-screen sweeps were run at 1920×1080 (largest), 1024×768, 768×1024 (the `md:` breakpoint boundary — Tailwind's `md:` is `min-width:768px`, confirmed inclusive), and 390×844 (mobile). Representative spot-checks (Dashboard, a `Learn` topic, an exam screen, Search) were run at 1440×900 and 1280×800, since no viewport-specific issues were found at the more thorough sizes bracketing them.

## Issues found

1. **Real horizontal-overflow bug**, found during the 1024×768 sweep on code-heavy `Learn` topics (first observed on `design-patterns-behavioral`): `<main>` (the flex-1 content area in `AppLayout.tsx`) was rendering 42px wider than its allocated flex space and shifting off the left edge of the viewport (`left: -57px`). Root cause: flex items default to `min-width: auto`, so a descendant's content (a `<pre>` code block, even though it correctly has its own `overflow-x-auto`) could still push the item's computed intrinsic minimum width past its allocated share, and `main` — lacking an explicit `min-width` override — refused to shrink to fit. This is a textbook flexbox min-content sizing bug, not specific to any one topic's code (confirmed it would affect any topic with wide enough code blocks at narrow-enough viewports).
2. Minor pre-existing display bug spotted while touching `LastMinuteReview.tsx`: the "personal mistakes not yet corrected" section rendered raw topic **id** strings (e.g. `design-patterns-behavioral`) instead of the topic's Hebrew title.
3. No other horizontal overflow, clipped text, overlapping elements, off-viewport controls, or broken layouts were found at any tested screen/viewport combination.

## Fixes made

1. Added `min-w-0` to `<main>` in `src/components/layout/AppLayout.tsx` (`className="flex-1 p-4 md:p-8"` → `"min-w-0 flex-1 p-4 md:p-8"`). This is the standard, minimal fix for this exact class of flexbox bug — it does not change any spacing, sidebar width, or visual sizing decision, it only allows the content area to shrink to its allocated space instead of being forced wide by an unshrinkable descendant. Verified fixed on the original failing route/viewport, re-verified at 390×844 and 768×1024, and spot-checked on two other code-heavy topics (`design-patterns-structural`, `thread-safety-synchronization`) at additional viewports — all clean.
2. Fixed `LastMinuteReview.tsx` to resolve topic ids to their Hebrew titles via `topicsById.get(topicId)?.titleHe` (was displaying raw ids).
3. Introduced a single shared `PageContainer` component (`src/components/layout/PageContainer.tsx`, two sizes: `default` = `max-w-4xl`/896px for reading/setup screens, `wide` = `max-w-6xl`/1152px for the exam-taking/results screens) replacing eleven previously-inconsistent ad hoc `max-w-xl`/`max-w-2xl`/`max-w-3xl` wrappers (and, in `Dashboard.tsx` and `PastExams.tsx`'s empty-state branch, the complete *absence* of any width cap). `ExamRunner.tsx` and `ExamResultView.tsx` now self-wrap in `size="wide"` so every route that renders them (Diagnostic, Quiz Me, Mock Exam, Past Exams) automatically gets the wider, more usable exam layout without each route re-implementing it.
4. `MistakeNotebook.tsx`'s two states (empty vs. populated) previously used two *different* widths (576px vs. 768px) — unified to the same `PageContainer` default size.
5. Added topic/sort/resolved-status filters to Mistake Notebook, a responsive filter grid (`sm:grid-cols-2 lg:grid-cols-3`) to Quiz Me (previously a single narrow vertical stack), a responsive card grid (`sm:grid-cols-2`) to the Past Exams list, and match-highlighting plus a kind filter (topic/section/question/flashcard) to Search — all explicitly requested screen-specific improvements, implemented as targeted additions rather than broad rewrites.
6. Added Previous/Next topic navigation to the bottom of the `Learn` topic reader (reuses the existing `topicsSorted` array; correctly resolves to "no link" at the first/last topic).
7. Added a confirmation dialog (native `confirm()`, matching the existing pattern already used by "reset progress") before submitting an exam with unanswered questions remaining — wired only to the manual submit button, not to the timer's auto-submit-on-expiry path.
8. Added a global `:focus-visible` outline rule in `index.css` (covers every link, button, input, select, textarea, and `[tabindex]` element app-wide) and a visually-hidden (`sr-only`) `<h1>` inside `ExamRunner` so exam-taking screens have a proper top-level heading for screen readers, without any visible change.

## Remaining limitations

- The Mistake Notebook's populated-state layout could only be verified with the small set of mistakes generated during this session's own testing (a handful of entries across 1-2 topics) — it was not tested with a very large mistake log (dozens of entries across all 16 topics), though the underlying layout (a per-topic `<section>` list) has no reason to behave differently at scale.
- `prefers-reduced-motion` was reviewed and found not applicable: the only animation anywhere in the app is a plain `transition-colors` on nav links and option buttons, which is not the kind of vestibular motion effect that media feature is meant to suppress.
- The sidebar (`AppLayout.tsx`) was deliberately left at its fixed `md:w-56` (224px) width rather than given additional `lg:`/`xl:` scaling — the audited problems were entirely about the *content area* lacking a consistent width cap, not the sidebar, and adding sidebar breakpoints would have been an unrequested, unverified extra variable.
- Automated testing in this environment could not reliably drive native `confirm()`/`alert()` dialogs or execute long-running async browser scripts (they consistently hit the tool's own timeout regardless of actual delay) — all such interactions were instead verified by re-querying DOM state synchronously immediately after the action, in a fresh browser tab where needed to rule out stale console/state carryover.
