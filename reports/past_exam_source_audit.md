# Past Exam Source-Fidelity Audit

Generated: 2026-07-18

## 1. Scope and method

All 73 active Past Exam questions (`origin: 'reconstruction'` or `'adapted'`, referenced by `pastExamIndex.json`, spanning exam years 2018/2019/2024/2025) were cross-checked one-by-one against the original source material in `Sample past exams/`, using the project's existing clean transcripts in `exam-prep-app/extracted_materials/` (`exams/*.json` for text-extracted question sheets, `manual_vision/*.json` for vision-transcribed scanned/graded student papers).

Source-to-year mapping (per `extracted_materials/exam_structure_reference.json`):

| Year | Primary source(s) | Ground truth for correct answer |
|---|---|---|
| 2018 | `date_2018_without_answers` (clean question sheet), `advanced_topics_in_programming_part_a_student_solution` + `_2` (two independent graded student copies), `2018_semester_b_exam_version_1...blank_copy` (docx cross-check) | Two independent students' circled/graded answers, cross-referenced |
| 2019 | `advanced_topics_in_programming_reconstruction_of_part_a_including_answers` + `_reconstruction_of_time_a` (student-reconstructed from memory, no exam paper exists) | No answer key exists; correctness verified by independent Java/OOP subject-matter reasoning, cross-checked against `restoration_2023_version_a` where cited |
| 2024 | `student_solution_2024_first_term_score_75` | A real graded exam paper, 75/100, with circled answers and pass/fail marks per question |
| 2025 | `grade_100_term_a` | A real graded exam paper, **100/100** — every circled answer is confirmed correct |

Four parallel review passes (one per year) each cross-checked every stored question's stem, all options, and `correctOptionId` against the relevant source.

## 2. Result: correct-answer accuracy

**72 of 73 `correctOptionId` values were already accurate.** One was wrong and has been corrected (see §4).

## 3. Result: option-set fidelity — the "padded to 5" pattern

22 of 73 questions came from exam items that had only **4 native options** on the real paper, but the stored data had padded them to 5 by inventing a plausible-sounding distractor not present in any source (metadata on one of them, `q-pastexam-2024-014`, already candidly flagged this: "5th distractor added"). In every case the fabricated text was a wrong answer, never the correct one.

**Fix applied**: the fabricated option was removed from each of these 22 questions, restoring them to their authentic 4-option form. `stemHe`, the 4 real options' text, and `correctOptionId` were left untouched. The app's validation and UI already handle a 4-option question generically (no code assumed exactly 5), so this required only a validation-rule relaxation (`validateData.ts`: "expected 4 or 5 options" instead of "exactly 5"), not a schema or UI redesign.

Affected: `q-pastexam-2018-{003,008,010,011,013,014,015,016,017,018}` (10), `q-pastexam-2019-{001,002,003,004,005,009,010,011,013,015,016}` (11), `q-pastexam-2024-014` (1).

## 4. Result: one genuine wrong answer key — q-pastexam-2025-019

The 2025 audit (against the confirmed 100/100 paper) found that **`q-pastexam-2025-019`'s stored `correctOptionId` was wrong** (stored as `"b"`; the graded paper's own transcription explicitly records the student's confirmed-correct choice, with full reasoning, as the option matching stored `"c"`: *"counter is static/shared between the two threads, so exactly 10 lines print in total, values non-decreasing but ties/interleaving are possible across runs"*). This question also had the same 5th-option padding as §3.

**Fix applied**: `correctOptionId` changed from `"b"` to `"c"`, the fabricated 5th option removed, and `explanation`/`optionExplanations` rewritten to correctly justify why each of the true 4 options is right or wrong (previously the "correct" reasoning was attached to the wrong option's text, so it read as internally inconsistent even before this audit).

## 5. Minor items disclosed, not corrected in this pass

A few small wording embellishments were found on non-fabricated (real) options - e.g. `q-pastexam-2019-001` option `b` has an added parenthetical clarification not in the source, and `q-pastexam-2019-013`'s correct option has extra elaboration beyond the source's terser phrasing. These don't change which answer is correct or invent new content, and were left as-is since they were outside the scope of the "padded to 5 options" correction the user approved. Listed here for transparency.

## 6. Verification

- `npm run validate:data`: PASSED (0 errors, 4 pre-existing unrelated warnings).
- Full test suite: 255/255 passed, including new tests confirming a genuine 4-option question validates cleanly, shuffles correctly, and preserves the scoring invariant.
- `originalActiveQuestions.snapshot.json` and `pastExamQuestions.snapshot.json` were deliberately regenerated to this corrected, source-verified baseline (23 records changed, all documented above) - the one sanctioned exception to "never touch Past Exam content silently," made only with direct source evidence and explicit user approval.
- Manual browser check: `q-pastexam-2025-019` renders with exactly 4 options (A-D), no fabricated 5th, matching the real exam.
