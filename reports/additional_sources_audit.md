# Additional Question Sources — Audit

Audit of every file under `additional-question-sources/` at the project root, performed by reading each PDF in full (native text extraction — no OCR was required for any of the three files).

## Inventory

| File | Type | Size | Pages | Questions |
|---|---|---|---|---|
| `atp_practice_test_1.pdf` | PDF, native text | 37,005 bytes | 9 | 20 |
| `atp_practice_test_2.pdf` | PDF, native text | 39,061 bytes | 10 | 20 |
| `atp_practice_test_3.pdf` | PDF, native text | 46,433 bytes | 10 | 20 |

**Total: 3 files, 60 questions.** No DOCX, CSV, image, or scanned files were present despite the task description mentioning those as possibilities — the directory contains only these three PDFs.

## Per-file record

### `atp_practice_test_1.pdf`
- **Format**: Hebrew RTL, 20 multiple-choice questions (א/ב/ג/ד/ה = 5 options each), 5 points each, 100 total, all-or-nothing scoring.
- **Provenance**: **Unknown/unofficial.** No course code, lecturer name, semester, or year appears anywhere in the document — title is simply "נושאים מתקדמים בתכנות — מבחן תרגול 1" ("Advanced Topics in Programming — Practice Test 1"). Not a reconstructed past exam and not marked official; most likely an instructor-authored or AI-generated practice set.
- **Answers supplied**: Yes — a full answer key at the end, with one paragraph of justification per question (not a per-wrong-option breakdown).
- **OCR/visual inspection required**: No — clean native PDF text, extracted with full fidelity including embedded Java code blocks.
- **Extraction quality**: Excellent. Every question, code block, option, and answer-key entry was recovered cleanly with no garbled characters or missing content.
- **Topics covered**: JVM/bytecode, Java String pool (`==` vs `.equals`), autoboxing/unboxing, `equals`/`hashCode` contract, Generics (type erasure), abstract classes vs interfaces, UML aggregation vs composition, SOLID (SRP, DIP), design patterns (Factory, Singleton, Adapter Class vs Object, Facade, Decorator, Bridge), `Thread.run()` vs `.start()`, `volatile`, race conditions, socket IP/port requirements, `transient`/serialization.
- **Confidence**: Medium — every answer was independently re-derived from first-principles Java/UML/SOLID semantics during this audit and found technically correct, but since there is no official course attribution, none of it could be cross-checked against actual lecture slides.
- **Ambiguity/contradictions**: None found.

### `atp_practice_test_2.pdf`
- Same format/scoring/provenance profile as test 1 ("מבחן תרגול 2").
- **Topics covered**: `Thread.run()` vs `.start()` (again — see deduplication report), `ServerSocket.accept()` blocking, `Runnable` vs extending `Thread`, TCP vs UDP, `volatile` (again), Strategy pattern, `ExecutorService.execute()` vs `.submit()`, OSI 7-layer model, `Thread.join()`, Observer pattern, race conditions (again), `ServerSocket` port-in-use, `Callable`/`Future`, `transient` in socket serialization (again), Mediator pattern, `synchronization` definition, socket echo client/server trace, Command pattern, Interface Segregation Principle, `equals`/`hashCode` (again).
- **Confidence**: Medium, same basis as test 1.
- **Ambiguity/contradictions**: None found in the answer key itself. However, this file repeats several questions from test 1 almost verbatim (see below and the deduplication report) — noted as a cross-file consistency observation, not a contradiction.

### `atp_practice_test_3.pdf`
- Same format/scoring/provenance profile ("מבחן תרגול 3 — מבחן מסכם", i.e. explicitly framed as the third/summary test of the three).
- **Topics covered**: Generic class type parameters (`Box<T>`), `ArrayList` vs `LinkedList` Big-O, `TreeMap` ordering, `Integer` caching (`-128..127`), `equals`/`hashCode` (again), Facade (again), Singleton (again), Observer (again), Mediator (again), Command (again), event-driven programming paradigm, `Listener` vs `Handler`, JavaFX component hierarchy, JavaFX MVC/GUI-thread/CSS, `Thread` lifecycle states, `Thread.run()` vs `.start()` (again — the same question appears in all 3 files), anonymous classes implementing `Runnable`, SOLID SRP (again), abstract class vs interface differences, UML composition (House/Room).
- **Confidence**: Medium, same basis.
- **Ambiguity/contradictions**: None found; spot-checked the `Box<T>` output trace (`2025 + 1 = 2026`, `Integer` unboxing) and the `Thread` lifecycle enumeration (`NEW`/`RUNNABLE`/`WAITING`/`BLOCKED`/`TERMINATED`, matching the real `Thread.State` enum) — both technically correct.

## Cross-file observation (feeds into the deduplication report)

The exact same "call `.run()` directly, then `.start()`" gotcha question appears, nearly word-for-word, in **all three files** (test 1 Q16, test 2 Q1, test 3 Q16). Several other questions repeat across two of the three files with only cosmetic changes (`volatile`: test 1 Q17 / test 2 Q5; `equals`/`hashCode` without override: test 1 Q4 / test 2 Q20 / test 3 Q5; Observer "which is not correct": test 2 Q10 / test 3 Q8; Mediator chatroom: test 2 Q15 / test 3 Q9; Command lamp/printer: test 2 Q18 / test 3 Q10; Facade subsystem: test 1 Q13 / test 3 Q6; Singleton characterization: test 1 Q11 / test 3 Q7). This internal repetition, combined with heavy overlap against the existing 293-question bank, is addressed in full in `reports/additional_question_deduplication.md`.
