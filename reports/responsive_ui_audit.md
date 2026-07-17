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

## Desktop Width and Typography Pass

Performed as a second, dedicated audit after user feedback that the deployed desktop UI, while free of overflow bugs, still looked too narrow and small on a large monitor. This pass did not repeat the overflow sweep above — it measured actual **computed pixel widths and font sizes** against the available viewport, which the first audit did not do.

### Root cause (measured, not assumed)

Live measurement on `/diagnostic` (active `ExamRunner`) before any change:

| | 1920×1080 (dpr 1.25) | 2560×1440 (dpr 1.25) |
|---|---|---|
| `innerWidth` | 1920 | 2560 |
| `<main>` width (after 224px sidebar) | 1696px | 2336px |
| `PageContainer` width in use | **1152px** (`max-w-6xl`, fixed) | **1152px** (`max-w-6xl`, fixed — identical to 1920px) |
| Unused horizontal space | 480px | **1184px** |
| Question stem font (`text-base`) | 16px | 16px |
| Answer option font (`text-sm`) | 14px | 14px |
| Code font (`text-sm`) | 14px | 14px |

`PageContainer.tsx` — the single component every one of the 10 screens routes its width through — used two **fixed** Tailwind caps (`max-w-4xl`/896px, `max-w-6xl`/1152px) that do not move at all between 1920px and 2560px viewports. All content typography used Tailwind's stock `text-sm`/`text-base` with no desktop-specific scaling, and the project has no `@tailwindcss/typography`/`prose` plugin and no `xl:`/`2xl:` breakpoint usage anywhere.

### Shared components changed

| Component | Before | After |
|---|---|---|
| [PageContainer.tsx](exam-prep-app/src/components/layout/PageContainer.tsx) | `default: max-w-4xl` (896px fixed), `wide: max-w-6xl` (1152px fixed) | `default: max-w-[min(96%,1600px)]`, `wide: max-w-[min(97%,1900px)]` — fluid, capped, never identical across 1920px vs 2560px |
| [AppLayout.tsx](exam-prep-app/src/components/layout/AppLayout.tsx) | `<main>` padding `p-4 md:p-8`; sidebar `md:w-56` | `<main>` padding `p-4 md:p-6 lg:p-8 xl:p-10` (graded); sidebar unchanged at 224px (within the requested 220-260px range — not the source of the problem) |
| [index.css](exam-prep-app/src/index.css) | No content typography scale; only `text-sm`/`text-base`/`text-xs` stock Tailwind sizes | New `@layer utilities` block: 8 semantic `clamp()`-based classes (`text-page-title`, `text-section-title`, `text-question`, `text-answer`, `text-body-lg`, `text-code-lg`, `text-nav-link`, `text-meta`) — all `rem`-based so browser zoom and user font-size preferences are respected |
| [QuestionCard.tsx](exam-prep-app/src/components/question/QuestionCard.tsx) | stem `text-base`, option `text-sm p-3`, explanation `text-sm`, sources `text-xs` | stem `text-question font-medium`, option `text-answer p-4`, explanation `text-body-lg`, sources `text-meta` |
| [CodeBlock.tsx](exam-prep-app/src/components/question/CodeBlock.tsx) | `text-sm` | `text-code-lg` |
| [ExamRunner.tsx](exam-prep-app/src/components/exam/ExamRunner.tsx) | title `font-bold`, counter `text-xs`, nav grid `h-8 w-8 text-xs`, action buttons `text-sm py-2` | title `text-section-title font-bold`, counter `text-meta`, nav grid `h-10 w-10 text-sm` (larger touch target), action buttons `text-base py-2.5` |
| [ExamResultView.tsx](exam-prep-app/src/components/exam/ExamResultView.tsx) | score `text-4xl`, body/labels `text-sm`/`text-xs` | score `text-5xl`, section headings `text-section-title`, body `text-body-lg`, labels `text-meta` |

Deliberately **not** changed: the global `html`/`body` root font-size (would have proportionally inflated every rem-based padding/gap app-wide, working against the "reduce excessive whitespace" goal); no `@tailwindcss/typography` plugin was added (not installed, not needed — the Learn-page reading measure is a plain `max-w-[85ch]` utility applied only to prose paragraphs).

### PageContainer width — before/after by viewport

| Viewport | `<main>` width | `PageContainer` before (fixed) | `PageContainer` after (fluid) | Utilization after |
|---|---|---|---|---|
| 1366×768 | 1127.2px | 1152px / 896px (capped, sometimes wider than main) | 1015.8px (`wide`) | 90.1% |
| 1536×864 | 1312px | 1152px / 896px | 1195.0px (`wide`) | 91.1% |
| 1600×900 | 1376px | 1152px / 896px | 1257.1px (`wide`) | 91.4% |
| 1920×1080 | 1696px | 1152px (68% util) | 1567.5px (`wide`) | **92%** |
| 2560×1440 | 2336px | 1152px (49% util, **identical** to 1920px) | 1900px (`wide`, hits intentional ceiling) | 81.3% (436px unused, down from 1184px) |
| 390×844 (mobile) | 390.4px | 347.6px (unchanged behavior) | 347.6px | no regression, no overflow |

The 2560×1440 result specifically satisfies the acceptance criterion that the layout must **not** remain visually identical in width to the 1920px (let alone 1280px) layout — it now correctly expands to 1900px vs 1567.5px, a real ~21% difference, while still refusing to stretch to the full 2336px main width (which would make a single question card absurdly wide on an ultra-wide monitor).

### Typography — before/after (ExamRunner / QuestionCard, desktop)

| Element | Before (fixed) | After (fluid `clamp()`, measured live) |
|---|---|---|
| Question stem | 16px (`text-base`) at every desktop size | 23.1px @1366px → 23.7px @1536px → 24px @1600px→2560px (ceiling) |
| Answer option | 14px (`text-sm`) at every desktop size | 18.7px @1366px → 19.1px @1536px → 19.2px @1600px → 19.84px @1920px → 20px @2560px (ceiling) |
| Dashboard `<h1>` | 24px (`text-2xl`) | 40px @2560px (ceiling of `text-page-title`) |
| Learn topic body paragraph | 14px (`text-sm`) | 19px @2560px (ceiling of `text-body-lg`) |
| Learn code block | 14px (`text-sm`) | 17.9px @2560px |
| Mobile (390px) stem / option | 16px / 14px | 20px / 17px (floor of the clamp ranges — no regression, no overflow, not "excessively large") |

All values sit inside the ranges the user specified (question 20-24px, answer options 17-20px, body 17-19px, page titles 30-40px, code 16-18px+, metadata ≥14px).

### Learn screen — wide container, narrow prose, full-width code

Measured at 2560×1440 on `/learn/solid-principles`:

| Element | Width |
|---|---|
| `PageContainer` (default) | 1600px (hits its ceiling, same as the code block below) |
| Code block (`CodeBlock`) | **1600px** — spans the full container, not narrowed |
| Prose paragraph (`max-w-[85ch]`) | **794.6px** — narrowed independently to a readable measure |

This confirms the intended split: the container itself is wide, code/tables/callouts (`mustRemember`/`easyToConfuse`/`howProfessorMightAsk` boxes) use the full width, and only plain reading paragraphs (`intuitionHe`/`examKnowledgeHe`/`applicationHe`) get the `max-w-[85ch]` reading-measure class. No `@tailwindcss/typography`/`prose` plugin was installed for this — it's a single arbitrary-value Tailwind utility.

### Flashcards — intentional intermediate width

`Flashcards.tsx` gained one new inner wrapper (`mx-auto w-full max-w-[min(88%,1100px)]`) around just the active-card block, so the card grows well beyond its old 896px cap but does not stretch to the full ~1600-1900px page container (a single short flashcard sentence at 1900px would be unreadable). This is the one deliberately-added `max-w` in the whole pass, chosen per the user's explicit "70-90% of main content area" target.

### Remaining intentional max-widths (and why)

| Location | Class | Why it stays |
|---|---|---|
| `Learn.tsx` prose paragraphs | `max-w-[85ch]` | Reading-measure best practice (~80-100 characters/line) — explicitly requested, applies only to plain paragraphs, not code/tables/callouts |
| `Flashcards.tsx` active card wrapper | `max-w-[min(88%,1100px)]` | A single flashcard sentence stretched to 1900px would be unreadable; 88%/1100px matches the requested 70-90% range |
| `PageContainer` `default`/`wide` | `max-w-[min(96%,1600px)]` / `max-w-[min(97%,1900px)]` | Ceilings exist so an ultra-wide monitor doesn't stretch a single question card or dashboard grid to the full physical screen width — ceiling values chosen inside the user's explicitly requested 1800-2000px / ~1500-1750px ranges |

### Route-level changes (typography only, no logic touched)

`Dashboard.tsx`, `Learn.tsx` (TopicList + TopicReader), `Diagnostic.tsx`, `QuizMe.tsx`, `MockExam.tsx`, `PastExams.tsx`, `Flashcards.tsx`, `MistakeNotebook.tsx`, `LastMinuteReview.tsx`, `Search.tsx` — every `text-2xl`/`text-xl`/`text-lg` page/section heading replaced with `text-page-title`/`text-section-title`; every `text-sm` body/label replaced with `text-body-lg`; every `text-xs` metadata/citation replaced with `text-meta` (14px floor, never below the user's stated minimum). `PastExams.tsx`, `LastMinuteReview.tsx`, and `Search.tsx` result/card grids were also widened (`sm:grid-cols-2` → additional `xl:grid-cols-3`, or single-column → `lg:grid-cols-2`) since the wider `PageContainer` left room for more columns before individual cards got too wide.

### Verification performed

- `npm run verify` (typecheck + test + lint + validate:data + build): **82/82 tests pass**, typecheck clean, lint clean, `validate:data` unchanged (16 topics, 293 active questions of 294 total, 188 flashcards, 7 mock exams, 0 errors, 4 pre-existing warnings), production build succeeds.
- `npm run deploy:check` (GitHub Pages subpath simulation, `vite preview` serving the production build under `/exam-prep-app/`): loaded and re-measured live, including confirming the served bundle matched the latest build after a stale-cache false alarm (resolved with a hard reload).
- Live re-measurement (computed styles, not just screenshots) at **1366×768, 1536×864, 1600×900, 1920×1080, 2560×1440**, and a mobile regression check at **390×844** — all tables above.
- Console checked for errors after the full typography pass: **none**.
- Direct hash-route navigation (`#/learn/solid-principles`) loaded correctly under the `/exam-prep-app/` subpath build (confirms `HashRouter` + GitHub Pages `base` still work together after all changes).
- `localStorage` inspected live in the browser: only the single namespaced key `advanced-programming-exam-prep:progress:v1` exists — no stray keys, progress data intact.
- Spot-checked Dashboard, Diagnostic/ExamRunner, Learn (topic list + reader), and Flashcards visually at multiple viewports; all other routes checked via the full `verify`/`deploy:check` pass plus code review of every changed file.

### Known limitation of this pass

Screenshots were used for visual spot-checks during the session but are not embedded in this Markdown report (this repository has no image-asset pipeline for the report itself); all before/after claims above are instead backed by live `getComputedStyle`/`getBoundingClientRect()` measurements, which are more precise and reproducible than a static image.

## Answer Alignment and Full-Width Learn Audit

Two follow-up bugs were reported after the BiDi label-position fix (a prior pass, not covered above) and the Desktop Width pass: (1) English/code answer text was still visually left-aligned inside the option button even though its `A.`/`B.`/etc. label was correctly pinned to the right, and (2) the Learn route (and, on inspection, every other `default`-size route) had regressed to using only about half the available desktop width.

### Bug 1 — answer text left-aligned: root cause and fix

Root cause, confirmed in `src/components/question/QuestionCard.tsx`: the answer-text `<bdi dir="auto">` used the **logical** Tailwind class `text-start`. `text-start` resolves relative to the *element's own* resolved direction — and `dir="auto"` resolves a `bdi` containing strong-LTR content (English, code) to `ltr`, at which point `text-start` becomes `text-align: left`. So English/code answers were pulled to the literal left edge of the button, even though the separate label `<span>` (fixed via the earlier BiDi pass) stayed correctly pinned to the right. The per-option explanation row had the same underlying issue (no alignment class at all, so the browser default — also direction-dependent — applied).

Fix: replaced the logical `text-start` with the **physical** `text-right` on both `bdi` elements (option button, line ~40; explanation row, line ~59). `text-align: right` is not affected by the element's own resolved direction, so it now holds regardless of whether `dir="auto"` resolves the content to `ltr` or `rtl`. `dir="auto"` itself was kept unchanged — it still correctly governs the *internal* character order of mixed content (e.g. an embedded English term inside a Hebrew sentence reads left-to-right in place), which is an entirely separate concern from alignment.

Live-measured on `q-pastexam-2019-012` (Adapter/Strategy/Observer/Factory design pattern + "אף תשובה אינה נכונה", shuffled) at 1920×1080: every option's `bdi` computed `text-align: right`, independent of its computed `direction` (`ltr` for the English options, `rtl` for the Hebrew one) — and the `bdi`'s own right edge sits immediately adjacent to its label's left edge (verified via `getBoundingClientRect()`), so the answer text now begins right next to the label as required. Also verified visually via screenshot at 900×700: `Observer design pattern .A`, `Factory design pattern .B`, `Strategy design pattern .C`, `אף תשובה אינה נכונה .D`, `Adapter design pattern .E` — every line reads with its label flush right and text starting immediately to its left.

No second answer-renderer was found or needed — `QuestionCard.tsx` remains the sole rendering site for Quiz Me, Diagnostic, Mock Exam, Past Exams, Learn's in-lesson check questions, and `ExamResultView`.

### Bug 2 — Learn (and other routes) using only ~half the desktop width: root cause and fix

This was **not a code regression** — a full code audit (grep for `max-w-2xl` through `max-w-7xl`, `prose`, `mx-auto`, `w-1/2`/`w-2/3`, inline `maxWidth`) found nothing stray: `@tailwindcss/typography`/`prose` was never installed, and Learn's `max-w-[85ch]` reading-measure class was correctly scoped to individual `<p>` elements only (never a section/wrapper/`PageContainer`). The actual cause: `src/components/layout/PageContainer.tsx`'s `default` variant (used by Learn, Dashboard, Flashcards, Mistake Notebook, Last-Minute Review, Search, and the setup/list screens of Diagnostic/Quiz Me/Mock Exam/Past Exams — i.e. every route except the active exam-taking/results screens) had a **fixed 1600px ceiling** from the previous pass. That ceiling was tuned against 1920–2560px test viewports where it still gave 68-96% utilization, but on a desktop wider than that (a large monitor, especially with Windows display scaling reducing the effective CSS pixel budget less than expected), 1600px increasingly under-fills the available `main` width — exactly the "large empty region" the user described.

Fix: raised both `PageContainer` ceilings in the one shared file:

| Variant | Before | After |
|---|---|---|
| `default` | `max-w-[min(96%,1600px)]` | `max-w-[min(95%,1900px)]` |
| `wide` | `max-w-[min(97%,1900px)]` | `max-w-[min(97%,2000px)]` |

No route file needed to change its `size` prop — every `default`-size route automatically inherited the wider ceiling from this one shared component, and every `wide`-size screen (`ExamRunner`, `ExamResultView`) automatically inherited the new 2000px ceiling. No third "reading" variant was added: Learn's paragraph-level `max-w-[85ch]` already provides exactly the requested "readable paragraph, full-width everything else" behavior at the correct granularity (per-paragraph, not per-page), so a page-level reading variant would have been redundant.

### Width — before/after by route and viewport

| Route | Viewport | `main` width | `PageContainer` before | `PageContainer` after | Utilization after |
|---|---|---|---|---|---|
| Learn (`java-platform-jvm`) | 1920×1080 | 1680.8px | ~1551px (est., 1600px cap) | 1520.75px | 90.5% |
| Learn (`java-platform-jvm`) | 2560×1440 | 2320.8px | 1600px (69%) | 1900px (cap) | 81.9% |
| Learn (`solid-principles`) | 2560×1440 | 2320.8px | 1600px | 1900px (cap) | 81.9% (matches `java-platform-jvm`, confirms shared fix) |
| Dashboard | 2560×1440 | 2336px | 1600px | 1900px (cap) | 81.3% |
| Flashcards (outer container) | 1920×1080 | 1696px | ~1551px | 1535.2px | 90.5% |
| Search | 1920×1080 | 1696px | ~1551px | 1535.2px | 90.5% |
| Diagnostic/ExamRunner (`wide`) | 1920×1080 | 1696px | 1567.5px | 1567.5px (unchanged at this width — cap not yet binding) | 92.4% |
| Diagnostic/ExamRunner (`wide`) | 2560×1440 | 2336px | 1900px (cap, 81.3%) | 2000px (cap) | 85.6% |

Learn's code block (`<pre>`) was independently confirmed to always match the full `PageContainer` width (1520.75px at 1920px, 1900px at 2560px) — it is never narrowed by the paragraph-level `max-w-[85ch]` class, which stayed at ~789-795px throughout (unchanged from the previous pass), confirming the "wide container, narrow prose, full-width code" split still holds after the ceiling increase.

### Remaining intentional max-widths (unchanged, re-confirmed still justified)

Same two as the previous pass, both re-verified to still be correctly scoped after this change: `Learn.tsx` paragraph `max-w-[85ch]` (reading measure, per-`<p>` only) and `Flashcards.tsx` active-card wrapper `max-w-[min(88%,1100px)]` (70-90%-of-container target for a single flashcard, scales with the now-larger outer container but stays well short of it).

### Routes and viewports tested

Routes: Learn (`java-platform-jvm`, `solid-principles`, `design-patterns-behavioral`), Dashboard, Flashcards, Search, Diagnostic/`ExamRunner`, Past Exams (`pastexam-2019` question 12). Viewports: 2560×1440, 1920×1080, 1600×900, 1366×768, 1024×768, 768×1024, 390×844 — no horizontal overflow at any of them, `text-align: right` confirmed on every answer option at every viewport checked, direct hash-route load (`#/learn/design-patterns-behavioral`) confirmed working under the `/exam-prep-app/` subpath build, console clean, `localStorage` containing only the single namespaced progress key.

### Verification performed

`npm run verify`: **117/117 tests pass** (82 original + 22 QuestionCard BiDi + 4 new PageContainer + updated alignment assertions), typecheck/lint clean, `validate:data` unchanged (16 topics, 293 active questions of 294, 188 flashcards, 7 mock exams, 0 errors, 4 pre-existing warnings), build succeeds. `npm run deploy:check` subpath preview: no server/console errors, all measurements above taken against this production-style build.

## Learn Paragraph Full-Width Fix

A follow-up bug remained after the previous pass: the Learn page's outer container, headings, and section separators already used almost the full desktop width, but the actual lesson **paragraphs** (summary, "אינטואיציה", "ידע למבחן", "יישום") still rendered in a narrow ~50%-width column, leaving a large blank area on the left and lengthening the page unnecessarily. The answer-option RTL/LTR alignment fix from the prior pass was confirmed correct and was **not** touched in this pass, per explicit instruction.

### Root cause

`src/routes/Learn.tsx`'s `TopicReader` — the single renderer for all 16 Learn topics (no separate `StudySection`/`RichText`/`prose` component exists) — had exactly **4 occurrences** of the Tailwind arbitrary-value class `max-w-[85ch]`, applied individually to 4 `<p>` elements: the topic summary (was line 104), and the "אינטואיציה"/"ידע למבחן"/"יישום" paragraphs per section (were lines 116/121/133). This was a deliberate choice from an earlier pass (a "readable prose measure"), but it capped each paragraph at roughly 850px regardless of how wide its container had grown — while the code blocks and callout boxes right next to it correctly had no such cap and used the full container width, producing the visible "half-width text, full-width everything else" mismatch the user described. A full grep of `Learn.tsx` and the shared layout/content components confirmed no other narrow-width class (`max-w-sm` through `max-w-7xl`, `prose`, `w-1/2`/`w-2/3`, inline `maxWidth`, unused grid columns) was present anywhere else in the Learn rendering path.

### Fix

Removed `max-w-[85ch]` from all 4 paragraphs in `src/routes/Learn.tsx`, leaving their other classes (`leading-relaxed`, `whitespace-pre-wrap`, `mt-2`) untouched. Each `<p>` now inherits its parent `<div>`/`<section>`'s full width, which is in turn the full `PageContainer` width. Additionally, all three `<PageContainer>` usages in `Learn.tsx` (topic list, "topic not found" branch, and the main `TopicReader`) were switched from the `default` size to `size="wide"`, giving Learn the same 2000px ceiling as the exam-taking screens rather than the 1900px `default` ceiling — a small consistency improvement, not required to fix the core bug. `dir`/RTL alignment, English-term ordering inside Hebrew sentences, and all other BiDi handling were left completely untouched; this was a width-only change.

### Width — before/after by route and viewport

| Route | Viewport | `main` width | `PageContainer` width | Paragraph width before | Paragraph width after | Utilization after |
|---|---|---|---|---|---|---|
| `solid-principles` | 1920×1080 | 1680.8px | 1552.8px (`wide`, was 1520.75px `default`) | ~789px (51.9%) | **1552.8px (100% of container)** | 92.4% of `main` |
| `solid-principles` | 2560×1440 | 2320.8px | 2000px (cap) | ~795px | **2000px (100% of container)** | 86.2% of `main` |
| `java-platform-jvm` | 1920×1080 | 1680.8px | 1552.8px | ~789px | **1553px (all 36 paragraphs checked)** | 92.4% |
| `networking-sockets-io-streams` | 1920×1080 | 1680.8px | 1552.8px | ~789px | **1553px (open-flow paragraphs); 1519px inside padded callout boxes (97.8% of container)** | 92.4% |
| `networking-sockets-io-streams` | 1600×900 | 1360.8px | 1242.4px | — | full-width | 91.3% |
| `networking-sockets-io-streams` | 1366×768 | 1127.2px | 1015.8px | — | full-width | 90.1% |

The 2560×1440 result (2000px) is a real, substantial increase over the 1920×1080 result (1552.8px) — confirming paragraphs now expand with the viewport rather than staying fixed. All three explicitly-requested routes (`solid-principles`, `java-platform-jvm`, `networking-sockets-io-streams`) were measured directly; a fourth (`design-patterns-behavioral`) was spot-checked via direct hash-route load to confirm the fix isn't route-specific.

### Confirmation across all 16 topics

An automated test (`src/routes/Learn.test.tsx`, `describe.each` over the real `topicsSorted` array from `dataStore`) renders every one of the 16 real topics and asserts no `<p>` in any of them carries `max-w-[85ch]` or any other narrow `max-w-*`/`prose` class — an exhaustive check rather than a 3-topic spot check, since the fix lives in the single shared `TopicReader` renderer used by all topics identically (no per-topic wrapper exists to regress independently).

### Desktop and mobile results

No horizontal overflow at 2560×1440, 1920×1080, 1600×900, 1366×768, or 1024×768. At 390×844 and 768×1024, the layout was confirmed clean via `document.documentElement.clientWidth`/`getBoundingClientRect()` (both exactly 390px, matching the requested viewport, with the code block correctly scrolling internally via its own `overflow-x: auto` rather than pushing the page wider) and a full-page screenshot showing no visible blank margin or horizontal scrollbar. Note: this browser-automation tool's own `window.innerWidth`/`visualViewport.width` reported a stale/inflated value (506px) after the resize at this viewport in this session, while every actual layout measurement (`clientWidth`, `getBoundingClientRect()` on `<html>`/`<body>`/`<main>`) and the screenshot itself were consistently correct at 390px — this is judged to be a tool-side measurement artifact (consistent with other tool quirks already documented in this report), not a product defect.

### Tests added

New `src/routes/Learn.test.tsx` (21 tests): a focused suite on `solid-principles` (wide `PageContainer` variant confirmed, no narrow-`max-w` paragraphs, all section headings still render, previous/next navigation links still point to the correct neighboring topics, code blocks retain `ltr-code`), plus an exhaustive `describe.each` sweep asserting the same "no narrow paragraph max-width" property across all 16 real topics.

### Verification performed

`npm run verify`: **138/138 tests pass** (117 from the previous pass + 21 new Learn tests), typecheck/lint clean, `validate:data` unchanged (16 topics, 293 active questions, 188 flashcards, 7 mock exams, 0 errors, 4 pre-existing warnings), build succeeds. `npm run deploy:check` subpath preview: no console errors, direct hash-route load confirmed, `localStorage` containing only the single namespaced progress key.

## Stable Option Order and Scoring Audit

A critical correctness bug was reported: in Learn check questions, an option displayed at position D was clicked while it was the correct answer, and immediately after the click the options changed position (the same text moved from D to C), and the click was marked incorrect.

### Root cause

Three call sites invoked `shuffleQuestionOptions(question)` **directly inside a component's render body, unmemoized, with the default non-deterministic `Math.random` RNG**: `src/routes/Learn.tsx` line 48 (`SectionCheckQuestion`), `src/routes/Learn.tsx` line 232 (the "שאלות חדשות בנושא זה" supplemental-question preview block), and `src/components/exam/ExamResultView.tsx` line 76 (the wrong-answers review block). Every re-render of these components generated a **brand-new random shuffle**.

The re-render trigger was traced to `src/lib/ProgressContext.tsx`: `ProgressProvider` passes a **new context value object** (`{ progress, updateProgress, resetProgress }`) on every render, so any `updateProgress()` call anywhere in the app (a confidence-level click, a "סמן כלמדתי" click, or even the check question's own answer-recording call) re-renders **every** consumer of `useProgress()` in the tree — including every `SectionCheckQuestion` instance on the page. The re-render re-ran the unmemoized shuffle, producing a new option order, while the component's `answered` state still held the *previously displayed* option id — so the click was scored against a mapping that had already shifted. This is an exact match for the reported D→C symptom, and also explains why confidence/"learned" clicks in an unrelated section could trigger it.

`src/components/exam/ExamRunner.tsx` (used by Quiz Me, Diagnostic, Mock Exam, and Past Exams) was the one call site already wrapped in `useMemo(() => questions.map(shuffleQuestionOptions), [questions])`. Its `questions` prop was confirmed referentially stable within an attempt in all four callers (`QuizMe.tsx`'s `session` state, `Diagnostic.tsx`'s `useMemo(..., [])`, `MockExam.tsx`/`PastExams.tsx`'s `useMemo(..., [selectedExam])`), so there was no live scoring bug there today - but it relied on memoization alone for correctness, which the fix below no longer does.

### Fix

Added `hashStringToSeed(input: string): number` and `stableShuffleQuestionOptions(question, seedKey: string): ShuffledQuestion` to `src/lib/shuffle.ts` (pure additions; `shuffleQuestionOptions`/`shuffleArray` are unchanged). `stableShuffleQuestionOptions` seeds `mulberry32` from a hash of `seedKey`, making the shuffle a **pure, deterministic function of its inputs** - correctness no longer depends on `useMemo` caching, only on the seed key staying the same:

- **Learn check questions** (`Learn.tsx:48`): seeded by `questionId` alone (stable for the life of the question), wrapped in `useMemo([question, questionId])` as a performance optimization only.
- **Learn supplemental-question previews** (`Learn.tsx:232`, inside a `.map()` - no hooks allowed there): called directly with `seedKey = q.id`; safe because the function is pure.
- **Exam result wrong-answer review** (`ExamResultView.tsx:76`, also inside a `.map()`): seeded by `` `${result.id}:${a.questionId}` `` - identical every time a specific completed result is reviewed.
- **`ExamRunner.tsx`** (hardened, not a live bug): added a per-mount `attemptId` (`useState` lazy initializer), and reseeded the existing `useMemo` with `` `${attemptId}:${q.id}` `` per question - a new attempt (a fresh mount) draws a new `attemptId`; the same attempt is provably stable regardless of re-renders.

Scoring and the Mistake Notebook/mastery pipeline were not touched: `progressActions.ts`'s `recordQuestionOutcome` already compares `chosenOptionId === question.correctOptionId` **exclusively in original option-id space** (callers translate the clicked display-id to the original id via `displayToOriginal` before calling into progress actions) - confirmed by reading the code directly, not assumed. No progress-record migration is required.

### Tests added (24 in `Learn.test.tsx`, 6 in `ExamRunner.test.tsx`/`ExamResultView.test.tsx`, 6 in `shuffle.test.ts`)

- `does not reshuffle options after selecting the correct Learn answer` - reproduces the exact reported scenario against the real `q-java-platform-jvm-002` question (the "javac Hello.java / java Hello" question named by the user); verified this test **fails** against the pre-fix code (confirmed by temporarily reverting the fix and re-running it, then restoring it) before being counted as a valid regression guard.
- `Learn confidence and learned controls do not reshuffle check-question options` - clicks "סמן כלמדתי" and confidence levels 1-5 and asserts the check question's option order is untouched.
- A third test covers the supplemental-question preview block.
- `shuffle.test.ts`: `hashStringToSeed` determinism, `stableShuffleQuestionOptions` producing an identical result across repeated/interleaved calls, and a sweep asserting the scoring invariant (`displayToOriginal[correctOptionId] === question.correctOptionId`) across **every real active question in the bank (293 core + 28 supplemental)**.
- `ExamRunner.test.tsx`/`ExamResultView.test.tsx`: option order survives forward/back navigation, flagging, and unrelated prop-driven re-renders.

### Data validation and progress-compatibility audit

`npm run validate:data`: 293 active core questions + 28 active supplemental questions, 0 errors (5 options each, one valid `correctOptionId`, `optionExplanations` keyed by original option id). `progressActions.ts` confirmed (by reading the code) to key `questionStats`/`mistakeLog`/mastery calculations by `question.id` and original option ids only - never by shuffle-display index or letter. **No existing user progress needs to be reset.**

### Manual verification

Reproduced live in the browser against the two exact questions named in the bug report (`q-java-platform-jvm-001`, the cross-platform question, and `q-java-platform-jvm-002`, the javac/java compilation question): clicked the correct option (displayed at D) - it stayed at D and was marked correct; clicked "סמן כלמדתי" and confidence level 3 afterward - all 35 option buttons on the page kept their exact order. Ran a full Mock Exam 1 (20 questions): navigating forward/back and flagging a question left its option order untouched; the results screen's wrong-answers review (18 wrong answers, 90 option buttons) was unchanged across a forced re-render. No console errors in any of these checks.

### CORRECTNESS GATE

Confirmed: option order is generated once per attempt/question and frozen; confidence, "learned", flagging, progress/mastery updates, and unrelated re-renders never reshuffle it; scoring and explanations are always resolved through the original option id, never the displayed letter/position; returning to a question (via navigation) restores the identical order.

## Site-Wide Mixed RTL/LTR Technical Expression Audit

Follow-up to the earlier BiDi heading/stem fix: the requirement was that a **complete technical expression including its operators** (containment `⊂ ⊃ ⊆ ⊇`, membership `∈ ∉`, comparison `≠ ≤ ≥`, arrows `↔ →`, and ASCII `= + - * / % -> => < > <= >= == != && ||`) must be isolated as a single LTR unit - not just the individual Latin tokens with the operators left outside the isolate.

### Finding: no algorithm change was required

`src/lib/bidiSegment.ts`'s `segmentBidiText` splits only at **actual Hebrew-character boundaries** (Unicode range `֐-׿`) - it does not special-case any operator or symbol. Since none of the required operators (ASCII or Unicode math symbols) fall inside the Hebrew block, an expression like `JDK ⊇ JRE ⊇ JVM` or `0 <= port <= 65535` was already captured as **one uninterrupted non-Hebrew run**, and rendered via the existing `Ltr` isolate - the same mechanism already in production since the prior BiDi pass. This was **verified with new tests, not assumed**: adding synthetic tests initially surfaced 3 failures caused by an unrelated, already-documented, and correct existing behavior (a Hebrew connector hyphen like "ש-JDK" attaches the hyphen to the following LTR run, per the pre-existing test suite) - after correcting the test sentences to avoid that specific construction, all 20 new operator/expression cases passed against the unmodified algorithm. No production code in `bidiSegment.ts` was changed.

### Tests added (20 new cases + 2 structural checks in `bidiSegment.test.ts`)

Covers every operator in the user's list, embedded in full Hebrew sentences: containment chains (`JDK ⊇ JRE ⊇ JVM`, `JVM ⊆ JRE ⊆ JDK`), equality+addition (`JDK = JRE + javac + development tools`), arrows (`source -> intermediate code`, `Bytecode → machine code`), double comparisons (`0 <= port <= 65535`, `1 ≤ x ≤ 10`), field assignment (`restoredUser.city = null`), generics (`List<? extends Number>`, `Map<String, List<Integer>>`), quoted assignment (`String name = "Dudi"`), and membership/equality/boolean operators (`∈`, `∉`, `↔`, `=>`, `&&`, `||`, `==`, `!=`, `⊂`/`⊃`). Each case asserts the expression appears as exactly one LTR segment and that operand order is not reversed.

### Call-site audit

Re-grepped every `*He`/`description`/`explanation` field interpolation across `src/routes` and `src/components`. All are already routed through `BidiText`/`BidiSegments` (confirmed in `Learn.tsx`, `Flashcards.tsx`, `MistakeNotebook.tsx`, `LastMinuteReview.tsx`, `SupplementalQuestions.tsx`, `Dashboard.tsx`, `QuestionCard.tsx`, `ExamResultView.tsx`). Two documented, deliberate exceptions, neither a regression:
- **`<option>` elements** (topic/pack filter dropdowns in `QuizMe.tsx`, `MistakeNotebook.tsx`) render plain text only - browsers strip any nested markup inside `<option>`, so `BidiText`'s isolating `<span>`s cannot be used there. This is a pre-existing HTML platform limitation, not something introduced or fixable in this pass.
- **`SupplementalBadge`** renders its `label` prop directly with no isolation wrapper; all current callers pass either a hardcoded pure-Hebrew string or `pack.titleHe`, which is pure Hebrew for all 3 packs today (`מבחן תרגול נוסף 1/2/3`). No mixed-language badge content exists in the current data, so this is a documented latent gap, not an active bug.

### Manual verification

Loaded `java-platform-jvm` in the browser and located the real production sentence containing "JDK ⊇ JRE ⊇ JVM" (the JVM/JRE/JDK containment section). Confirmed via DOM inspection and a screenshot that `(JDK ⊇ JRE ⊇ JVM)` and `JRE (Java Runtime Environment) = JVM + ...` render as single `.ltr-inline` spans with the correct left-to-right operand order, inside a `dir="rtl"` paragraph carrying the full original string as `aria-label`.

### TYPOGRAPHY GATE

Confirmed: complete technical expressions (including their operators) preserve source order; containment/comparison notation is not reversed; `+`/`=` signs stay between their correct operands; quotes/parentheses stay attached to their expression; Hebrew text remains right-aligned RTL; technical expressions remain internally LTR. No academic content, no `.json` data file, and no invisible Unicode direction-control character was touched anywhere in this pass (confirmed by SHA-256 hash diff of every file under `src/data/**/*.json` before and after all changes - zero differences).

## Long Mixed Hebrew-English Prose BiDi Audit

A more severe defect was reported in dense Learn paragraphs (flagged section: `sec-java-basics-oop-memory-01`, "מבנה מחלקה וקובץ ב-Java") - punctuation visibly displaced around parenthetical/quoted technical asides in long sentences mixing many Java identifiers, filenames, and signatures with Hebrew prose.

### Root cause

`segmentBidiText` isolates a maximal non-Hebrew run as LTR only if that run itself contains a Latin letter/digit. When a bracket or quote **pair** has its Latin content **inside** the pair but a Hebrew word splits the run so the **closing** delimiter ends up in its own run with no Latin/digit of its own (e.g. `"(public class אחת),"` - the trailing `),` has no Latin), that closing run was left unisolated, merged into plain Hebrew-context text. There it became a "neutral" character subject to the Unicode BiDi Algorithm's own (unpredictable, to a page author) reordering relative to adjacent punctuation - producing exactly the visible comma/paren swaps and multi-parenthetical scrambling reported.

Two real confirmed failures (found via a real-browser character-position measurement tool built for this pass, not eyeballing - see Methodology below), both in `sec-java-basics-oop-memory-01`:
1. `intuitionHe`: `"...(public class אחת), ששמו..."` rendered as `"...(public class אחת,)ששמו..."` - comma and closing paren swapped.
2. `codeExamples[0].captionHe`: `"...ה-public (Hello) (lec_1_2 סליידים 32-35)"` rendered severely scrambled, with the two adjacent parenthetical fragments interleaving.

A broader real-browser sweep (Methodology below) across `solid-principles`, `networking-sockets-io-streams`, `threads-basics-lifecycle`, and `concurrency-utilities-callable-future-mediator` found the **same root cause manifesting in two further shapes**, both fixed by extending the same mechanism (not a second, separate fix):
3. Backtick-quoted code identifiers split from their Latin content by a Hebrew word (e.g. `` `OrderService` `` in a `solid-principles` paragraph) - backtick was not previously a recognized quote character at all.
4. A parenthetical gloss whose **enclosed content is entirely Hebrew** but that directly follows an English term outside the parens (e.g. `"DIP (תלות ישירה במימוש קונקרטי)."`) - the enclosed-content-only check missed this; fixed by also checking whether the delimiter pair sits directly against Latin content **just outside** it.

### Why the previous (operator-expression) fix was insufficient here

The prior pass confirmed that a *single, uninterrupted* non-Hebrew run containing Latin content is already isolated correctly (covers `JDK ⊇ JRE ⊇ JVM`, generics, quoted assignments, etc.) and required no change. This defect is different in kind: it only occurs when a **Hebrew word sits between the two halves of a matched bracket/quote pair**, splitting one non-Hebrew run into two, one of which loses its only Latin anchor.

### The fix

One additive change to `src/lib/bidiSegment.ts`: a new `findLtrWorthyDelimiterPositions()` pass runs before segmentation. It stack-matches `()`, `[]`, `{}` pairs and toggle-matches `'...'`, `"..."`, `` `...` `` pairs, and marks **both** delimiter characters of a pair as LTR-worthy if either (a) the enclosed content contains a Latin letter/digit anywhere (even across a Hebrew interruption), or (b) the nearest non-space character immediately outside the pair, on either side, is Latin/digit. A quote/backtick character sitting directly between two Hebrew letters (a Hebrew abbreviation mark like `ע"י` or `בד"כ`, or a geresh as in `ד'ר`) is explicitly excluded from pairing, since treating it as a phrase-quote boundary would wrongly pair it with an unrelated later mark of the same character and isolate huge, arbitrary spans of ordinary Hebrew prose. `segmentBidiText`'s public signature and all other behavior are unchanged.

Verified this does **not** over-isolate: a purely Hebrew sentence with ordinary commas/periods/question marks (0 isolated spans), a plain Hebrew dash separator (`" - "`, 0 spans), a purely Hebrew quoted phrase (`ש'מגיע'`, 0 spans - ~111 similar occurrences exist in the real data), and a purely Hebrew parenthetical aside with no Latin anywhere nearby (0 spans) all remain completely untouched.

### Methodology: real-browser verification, not eyeballing

Screenshots of mixed RTL/LTR text are easy to misread by eye even carefully at high zoom - this was demonstrated directly during this pass (see Remaining limitations below). The verification tool built for this audit measures the actual on-screen x-coordinate of every rendered character via `Range.getBoundingClientRect()`, groups characters into visual lines, and reconstructs the true left-to-right paint order into a "logical reading order" string (reversing Hebrew runs, preserving LTR-isolate internal order), which is then compared character-for-character against the original source string. The technique was first validated against trivial known-correct cases (pure LTR text, pure RTL text, an RTL sentence with one trailing LTR word) before being trusted against real content.

Applying this tool to every `<h1>/<h2>/<p>/<li>` with an `aria-label` across all **16 Learn topics** after the fix found **zero remaining divergences** anywhere in the Learn content.

### Remaining limitations

One case surfaced during this pass and was resolved as a **false positive of the measurement tool itself**, not a product bug: a lone punctuation cluster with **no isolation applied at all** (a plain Hebrew quoted phrase immediately followed by a dash, e.g. `"'עשה דבר אחד טוב' - אם..."`) was flagged as reordered by the automated measurement, but a deliberate high-zoom screenshot inspection showed it renders correctly. The automated tool's line/character grouping appears to be unreliable specifically for very short, un-isolated neutral-character clusters; it was cross-checked against direct screenshots for every finding reported as fixed in this section before being trusted, and the two genuinely-fixed cases (`),` and the DIP parenthetical) were each independently re-confirmed via a dedicated, isolated, high-zoom screenshot after the fix.

### Components and routes affected

Single file: `src/lib/bidiSegment.ts`. No changes to `BidiText.tsx`, `QuestionCard.tsx`, or any route - they all already consume `segmentBidiText`/`BidiSegments`, so the fix applies automatically everywhere `BidiText` is already used (per the prior pass's site-wide rollout).

### Tests added

8 new cases in `bidiSegment.test.ts` (51 total in the file): the two real originally-reported failures, the backtick case, the DIP-style case, three negative cases (pure Hebrew quote, pure Hebrew sentence, pure Hebrew parenthetical - each asserting 0 isolated segments), nested parentheses, and unbalanced-bracket safety (does not throw). The existing 293+/16/53-string reconstruction sweep and all 41 pre-existing `bidiSegment.test.ts` cases continue to pass unchanged.

### Verification performed

`npm run verify`: **232/232 tests pass**, typecheck/lint clean, `validate:data` unchanged (293 active core + 28 supplemental questions, 0 errors), build succeeds. SHA-256 hash diff of every `src/data/**/*.json` file: zero changes. Re-ran the full Part A stable-answer-order/scoring suite (`shuffle.test.ts`, `Learn.test.tsx`, `ExamRunner.test.tsx`, `ExamResultView.test.tsx` - 47 tests): all pass unchanged, confirming this pass did not disturb the stable-option-order fix.
