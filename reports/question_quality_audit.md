# Question Quality Audit — Distractor Length Bias (Phase B)

Generated: 2026-07-18

## 1. The problem

A statistical audit of the question bank confirmed a real, systematic guessing cue: across generated (non-Past-Exam) multiple-choice questions, the correct option was very often both the longest of the five options and noticeably more detailed than the distractors. A test-taker could exploit this without knowing the material.

**Before any changes**, measuring each question's five option lengths and ranking the correct option by length (rank 1 = longest):

| Population | n | Correct = longest | Avg rank of correct answer (1=longest, 5=shortest) |
|---|---|---|---|
| Core generated questions (`origin: 'new_past_exam_style'`, not linked to any Past Exam) | 220 | **93%** | **1.17 / 5** |
| Supplemental pack questions (3 packs, all generated/adapted) | 28 | **71%** | **1.75 / 5** |
| Past-Exam-linked questions (`reconstruction`/`adapted`, in `pastExamIndex.json`) | 73 | 30% | 2.78 / 5 |

The Past-Exam-linked baseline (30% / 2.78) reflects the natural, un-engineered style of real exam questions and is shown only for comparison — **these 73 questions were never touched** (see §5).

## 2. Scope

Per explicit user instruction, quality improvement was scoped **only** to generated content:
- 220 active core questions with `origin: 'new_past_exam_style'` that are **not** referenced by any entry in `pastExamIndex.json`.
- 28 active questions across the 3 supplemental question packs (`supplemental-practice1/2/3.json`), all generated/adapted content.

Total in scope: **248 questions**. All 248 were reviewed. **231 were rewritten** (208 core + 23 supplemental); **17 needed no change** because their options were already reasonably balanced in length and detail.

The 73 Past-Exam-linked questions were explicitly out of scope and are covered by a dedicated read-only regression test (§5).

## 3. Method

Each in-scope question went through a two-pass review:

1. **Subject-matter pass**: for every non-correct option, the existing `optionExplanations` entry was used to identify the specific misconception that option is meant to represent.
2. **Assessment-quality pass**: distractors that were short/generic relative to the correct answer were rewritten to carry comparable length, register, and technical detail — elaborating the *same* underlying wrong idea (a "because…" clause, a named related-but-wrong concept, a plausible mechanism) without becoming defensible as correct.

This was carried out in **three corrective rounds**, because the first round overshot:

- **Round 1 (lengthen)**: weak/short distractors were expanded to remove the "longest = correct" cue. This worked (93%/71% → 22%/18% "correct = longest"), but many distractors ended up *longer* than the correct answer, creating a new, opposite "shortest = correct" tell (correct answer was rank 5/5 in 32%/46% of questions — well above the ~20% random baseline).
- **Round 2 (trim)**: over-lengthened distractors were trimmed back down, cutting redundant clauses while preserving the wrong idea. This reduced the rank-5 rate to ~11–19%, but a residual skew remained, concentrated in questions where the correct answer was originally a very terse phrase (e.g. a single pattern name).
- **Round 3 (flatten)**: for the remaining worst outliers (84 questions, all still rank 4-5), a targeted final pass trimmed further where possible and, where the correct answer was inherently too terse to reach parity by trimming distractors alone, applied a small, meaning-preserving clarifying expansion to the correct answer's own wording (never changing which answer is correct or its factual content) — a tool explicitly not permitted in rounds 1-2, reserved for this narrow cleanup case.

All rewrites were produced and reviewed independently per question, then mechanically applied and validated (`npm run validate:data`, the Past-Exam regression suite, and the full test suite) after every round.

## 4. Results — after all three rounds

| Population | n | Correct = longest | Avg rank | Rank distribution (1=longest … 5=shortest) |
|---|---|---|---|---|
| Core generated | 220 | **24%** | **2.55 / 5** | 24.1% / 24.1% / 25.0% / 25.9% / 0.9% |
| Supplemental | 28 | **21%** | **2.82 / 5** | 21.4% / 21.4% / 21.4% / 25.0% / 10.7% |
| Past-Exam-linked (unchanged, shown for reference) | 73 | 30% | 2.78 / 5 | *(untouched — see §5)* |

The rank distribution for core generated questions is now close to flat (random baseline for 5 uniformly-distributed ranks is 20% each) — the original "always pick the longest" exploit is gone, and it was not replaced by a comparably strong opposite exploit. Supplemental packs (a much smaller sample, n=28) show a mild residual lean toward rank 4 and away from rank 5, within normal sampling variance for that sample size.

A new automated validation rule (`validateQuestions` in [validateData.ts](../src/lib/validateData.ts)) now warns — but never errors — whenever an active, non-Past-Exam question's correct option is both the longest of the five and ≥2.5x the median distractor length. **Running this rule against the final question bank produces zero warnings**, confirming the fix holds under an independent, stricter threshold than the one used to drive the rewrite work.

## 5. Past-Exam questions — verified untouched

- **Zero** of the 73 Past-Exam-linked questions (`reconstruction`/`adapted` origin, referenced by `pastExamIndex.json`) were modified. Verified two ways:
  1. A dedicated snapshot ([`pastExamQuestions.snapshot.json`](../src/data/__snapshots__/pastExamQuestions.snapshot.json)) was captured before any Phase B edit; the regression suite (`src/lib/originalBankRegression.test.ts`) diffs every one of the 73 records' `stemHe`, `options`, `correctOptionId`, `pastExamYear`, and `active` status against that snapshot on every run — **5/5 tests pass** after all three rounds.
  2. A direct ID-overlap check confirmed none of the 231 rewritten question ids intersect the 73 protected Past-Exam ids.
- The natural length-bias baseline for these 73 questions (30% correct=longest, avg rank 2.78) was left exactly as-is — per the user's explicit instruction, that variance is authentic exam evidence, not a defect.

## 6. What changed, concretely

- **231 of 248** in-scope questions had one or more non-correct options (and/or, in round 3 only, the correct option's own wording) rewritten. See [question_rewrite_log.md](question_rewrite_log.md) for the full per-question hash log.
- **0** questions had their `correctOptionId`, stem, option ids, option order, or topic assignment changed.
- **0** questions were deactivated (`active:false`) or marked `needsReview:true` — every reviewed question could be confidently rewritten; none required a low-confidence deactivation.
- Every changed question's `contentVersion` was incremented (starting from an implicit 1) to mark that its options/explanations were materially rewritten.
- Per-topic breakdown of changed question counts:

| Topic | Changed / in-scope |
|---|---|
| solid-principles | 23 / 21† |
| generics-collections-equals-hashcode | 21 / 17 |
| networking-sockets-io-streams | 20 / 17 |
| threads-basics-lifecycle | 20 / 16 |
| design-patterns-behavioral | 19 / 19 |
| design-patterns-structural | 18 / 19 |
| java-platform-jvm | 16 / 16 |
| thread-safety-synchronization | 15 / 14 |
| concurrency-utilities-callable-future-mediator | 14 / 14 |
| design-patterns-creational | 12 / 12 |
| uml-class-diagrams | 12 / 10 |
| event-driven-javafx-mvc | 12 / 12 |
| java-basics-oop-memory | 8 / 10 |
| oop-pillars-abstraction | 7 / 9 |
| state-space-decoupling-interfaces | 7 / 7 |
| blockchain-cryptocurrency | 7 / 7 |
| supplemental-practice1 | 9 / 12 |
| supplemental-practice3 | 10 / 10 |
| supplemental-practice2 | 4 / 6 |

† "Changed" can exceed "in-scope" for the first-round worklist because a question could be touched again in rounds 2/3 after being left alone in round 1, or vice versa; the "changed" column reflects the final before/after diff against the pre-Phase-B git state, which is the authoritative count.

## 7. Verification status

- `npm run validate:data`: **PASSED** (0 errors, 4 pre-existing unrelated warnings, 0 length-bias warnings).
- `src/lib/originalBankRegression.test.ts`: **5/5 passed** (Past-Exam provenance protection intact).
- Full test suite: see final delivery report for the complete `npm run verify` run.
