# Past Exam Analysis — Phase 4

Analysis of all past-exam sources for BGU course 372.1.2104 (Advanced/Special Topics in Programming, Dr. Dudi Ben Shimon), covering 4 distinct exam sittings: **2018** (Semester B, Moed A), **2019** (Semester B, Moed A), **2024** (Moed A, 28/7/2024), **2025** (Moed A, 31/7/2025). All are 20 questions × 5 points = 100 points, single-best-answer American-style multiple choice, no aids, passing score 55/100.

Verified question bank: `extracted_materials/clusters/pastexam_questions.json` — **73 verified questions** produced from these sources. **7 questions were rejected** (see `study_content/rejected_questions.json`) due to unresolvable ambiguity, image-dependent content that couldn't be transcribed, or incomplete source text — none were guessed.

## Source reliability hierarchy used

1. **`grade_100_term_a` (2025)** — official computer-generated feedback report shows 100/100, 5/5 on all 20 questions individually, cross-checked against a separate bubble-style answer sheet. Every recorded answer here is treated as a confirmed answer key. Highest possible confidence.
2. **`student_solution_2024_first_term_score_75` (2024)** — official per-question grading report (75/100) plus a green-check/red-X bubble answer sheet, both fully consistent, marking exactly which 15 of 20 questions were correct and which 5 (Q1, Q4, Q7, Q16, Q19) were wrong. For the 15 correct ones, high confidence. For the 5 wrong ones, the *student's* answer is known to be wrong but the *true* correct answer had to be independently reasoned from Java semantics (4 of 5 resolved this way; 1 rejected).
3. **Two independent 2018 student copies** (`..._student_solution` and `..._student_solution_2`) — same exam, two different students. One copy used a clear red-ink-means-wrong convention (score 16/20, exactly 4 questions marked wrong); the other had ambiguous circle/checkmark alignment on several questions. Cross-referencing the two resolved most uncertain cases; 2 questions remained genuinely contradictory between the two copies and were rejected.
4. **2019 "reconstruction" documents** — plain text reconstructions from memory by past students, with no answer key at all. Every answer here required independent verification against course material or cross-referencing against confirmed years. Used only where a confident determination was possible; several were rejected (image-dependent diagram, incomplete option text, or an internally-inconsistent code snippet).
5. **Clean unanswered text extractions** (`date_2018_without_answers`, `date_2025_without_answers`) — used only to get the exact faithful stem/option wording where vision-transcription of the scanned original was uncertain; never used alone to determine a correct answer.
6. **`sample_test.pdf`** — excluded entirely. This is a student's own handwritten practice sheet (4 options per question, not the standard 5), not an official exam, and its own answer key is explicitly flagged by the vision transcription as low-confidence due to illegible handwriting.

## Per-year breakdown

### 2018 (Semester B, Moed A, 28/6/2018) — 18 verified / 20 total questions

- 17 high confidence, 1 medium confidence.
- 2 rejected: Q14 (Streams "automatic JVM action" — the two independent student copies' grading marks pointed to different, non-corresponding options) and Q18 (MVC combination-answer — one copy confirmed "ב+ג" correct, the other confirmed "ב alone" correct; a genuine, unresolved contradiction).
- Notably, many questions in this exam version had only **4** native options (not 5) — 10 of the 18 verified questions required an added 5th distractor (tagged `adapted-to-5-options`, `origin: "adapted"`).
- Topic spread: generics/collections (3), networking (3), threads-basics (3), JVM (2), SOLID (2), design-patterns-behavioral (2), thread-safety (2), plus one each of UML, structural patterns, OOP/memory basics, and JavaFX/MVC.

### 2019 (Semester B, Moed A) — 16 verified / ~20 total questions (reconstruction, no answer key)

- 12 high confidence (mostly definitional/pattern-recognition questions and 2 cross-year-resolved via the 2024/2025 anchors), 4 medium confidence (reasoned from course material, no independent confirmation available).
- 4 rejected: an image-dependent SOLID-violation diagram question (Q6), an incomplete-option JIT question (Q8, only 3 of what should be 5 options were recoverable), a completely blank/garbled question (Q9), and a GenericStack code-output variant (Q11) whose transcribed code differs structurally from every confirmed year in a way that changes the correct answer, so it could not be resolved either way with confidence.
- This is the only year containing any Blockchain content, and the only year testing coupling/OOP-abstraction and "this in a static context" directly.
- Design-patterns-structural is over-represented here (4) because both the Bridge-diagram question and several Decorator/Facade definitional questions appear.

### 2024 (Moed A, 28/7/2024) — 19 verified / 20 total questions

- 17 high confidence (15 grader-confirmed correct + 2 cross-year-resolved), 2 medium confidence (reasoned from Java semantics where the student answered wrong and no independent confirmation exists).
- 1 rejected: Q19, a race-condition question on a static shared counter across two `Runnable` instances, where the student's answer was confirmed wrong but none of the 5 given options unambiguously describes the actual (partially non-deterministic) behavior.
- This is the exam that **resolved** the 2018 Bridge-diagram uncertainty (identical diagram, this time grader-confirmed correct = Bridge) and confirmed javac vs. JVM.
- Topic spread: threads-basics (4) and networking (4) dominate; JavaFX (2), design-patterns-behavioral (2), generics (2), JVM (2) each appear twice.

### 2025 (Moed A, 31/7/2025) — 20 verified / 20 total questions

- **All 20 at high confidence** — this is the only exam with a fully confirmed 100/100 answer key covering every single question. The gold-standard source for this entire phase.
- 0 rejected.
- Notable new content not seen in earlier years: Maven `pom.xml` dependency management, run-length-encoding homework question (`SimpleCompressorOutputStream`), serialization with `transient`/`volatile` field distinctions, and the maze-project object-adapter question — all reflecting an updated syllabus/project relative to 2018/2019.
- Topic spread is the most balanced of the four years: networking (4), JVM (3), thread-safety (3), SOLID (2), concurrency-utilities (2), behavioral patterns (2), creational patterns (2).

## Topic distribution across all 4 years (verified bank)

See `study_content/topic_frequency.json` for the full machine-readable breakdown. Headline: **networking/sockets/streams** (14 occurrences, 100% of years), **threads-basics** (10, 100%), **design-patterns-behavioral** (8, 100%), and **design-patterns-structural / generics-collections / thread-safety-synchronization** (7 each, 100%) are the five topics that appeared in literally every exam year checked.

## Recurring exact/near-exact repeated questions across years

Full detail with question IDs in `study_content/repeated_questions.md`. Summary of the twelve confirmed recurring patterns:

1. ThreadScheduler two-axis diagram → always Bridge (2018, 2019, 2024).
2. GenericStack "country + year" joke → always prints both values, never an error (2018, 2024; a 2019 variant was rejected due to code ambiguity).
3. "What makes Java/JavaFX cross-platform?" → always JVM (2018, 2024, 2025, and referenced in 2019-era course material).
4. Observer "which statement is false" → always the "Observable must know concrete Observer classes" option (2018, 2024).
5. equals() without hashCode() → always legal but logically broken for HashMap/HashSet, never a compile error (2018, 2024).
6. `obj.run(); obj.start();` on a Thread-and-Runnable class → always prints the message twice (2018, 2024).
7. ServerSocket on an occupied port → always throws immediately (2018, 2024).
8. Server+client in one main without Threads → always a combined-letter answer (2018, 2024).
9. "Choose an algorithm at runtime" → always Strategy (2018, 2019, 2024).
10. "Which interface does Thread implement?" → always Runnable (2018, 2024).
11. Synchronization definition → always "sequential access," never "simultaneous access" (2018, 2024).
12. javac vs. JVM (which converts source to bytecode) → always javac (2024 resolved via 2025 anchor).

## Common distractor / trap patterns (see also `extracted_materials/exam_structure_reference.json`)

- **Reversed-truth traps**: an option states the exact opposite of a true fact (e.g., "volatile keeps a private per-thread copy" — the truth is the opposite: volatile *prevents* private caching).
- **Fake-but-plausible terminology**: invented interface/class names that sound real (e.g., "Threadable" interface, "ServerException" class) mixed among real ones.
- **Combined-letter answers are legitimate and recur constantly** ("א+ד", "ב+ג", "ג+ד") — never assume only a single pure letter can be correct without reading every option carefully.
- **"Not a compile error" traps**: code that looks unusual (two separate generic instances, equals-without-hashCode) is frequently and wrongly flagged as a compile/runtime error by students who haven't seen the trick before.
- **Terminology confusion pairs**: SRP vs. ISP (one-class-many-responsibilities vs. one-interface-many-unrelated-methods), Bridge vs. Strategy vs. Facade, Overloading (compile-time) vs. Overriding (runtime), Aggregation vs. Composition.
- **Project-specific questions** (the maze assignment) require knowing exactly which design pattern was used in which part (א/ב/ג) of the course project — general design-pattern knowledge alone isn't enough for these.

## What changed between 2018/2019 and 2024/2025

- Option count standardized to 5 (א–ה) in the later exams; several 2018 questions only offered 4 options natively.
- Exam duration shortened from 2.5 hours (2018) to 1.5 hours (2024/2025) while keeping the same 20-question, 100-point structure.
- Newer syllabus content appearing only in 2025: Maven build configuration, a run-length-encoding compression homework question, and more granular serialization (`transient`/`volatile`) questions — worth extra attention since these represent the most recently-tested material.
