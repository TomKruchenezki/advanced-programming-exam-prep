# Additional Question Deduplication Report

Every one of the 60 questions extracted from `additional-question-sources/atp_practice_test_{1,2,3}.pdf` was compared, individually, against the existing 293-question active bank (`src/data/questions.json`) — not merely by topic, but by the specific fact/gotcha each question tests — and against the other 59 questions in the new source set (since several are repeated near-verbatim across the three files).

**Standard applied:** a question is a **duplicate** if it tests the same specific fact/insight in essentially the same way as an existing question — i.e., a student who already knows the existing question would gain no new understanding from it. A question that shares a broad *topic* (e.g. "SOLID SRP") with existing questions but illustrates it with a genuinely different concrete example, code snippet, or angle is **not** treated as a duplicate — exam banks legitimately carry multiple questions per topic, and the existing bank's own validator only flags near-identical *stems* as a warning, not a broader "same topic" match.

**Result: 14 of 60 accepted** as directly-extracted supplemental questions (namespaced, added to the packs). **46 of 60 rejected** as duplicates (either of the existing 293-question bank, or of another question within the same 3-file source set, or both). Every rejected question was still considered as inspiration for a newly-generated variant where it added genuine educational value (see `src/data/question-packs/*.json`, `origin: "supplemental_generated"`); trivial/oversaturated topics (e.g. `Thread.run()` vs `.start()`, already tested 3× in the new source plus dozens of times in the existing bank) were not force-varied just to hit a quota.

## Accepted (14) — kept as extracted supplemental questions

| Source | Reason accepted |
|---|---|
| Test 1, Q3 | Autoboxing+unboxing *process identification* (`list.add(5)`→box, `list.get(0)`→unbox) — a different question style from the existing Integer-cache/String-pool generics questions; no matching stem found. |
| Test 1, Q5 | "Which is **not** correct about Generics" targeting the specific misconception that generics improve *runtime* performance (they don't — type erasure). Existing bank has one general generics-correctness question with different distractors. |
| Test 1, Q8 | SOLID SRP "god object" example (`Report`: generateData/formatAsPdf/sendEmail/saveToDatabase) — zero stem matches for this concrete example; SRP is covered elsewhere but not with this illustration. |
| Test 1, Q9 | DIP violation via `EmailService` constructing a concrete `new MySQLDatabase()` internally — zero stem matches; a distinct concrete DIP illustration. |
| Test 1, Q10 | Factory pattern motivated by an `if/else` chain creating `Circle`/`Square`/`Triangle` — zero stem matches; the standard shape-factory example not yet present. |
| Test 1, Q19 | Socket IP+port requirement framed as a student's (wrong) claim that IP alone suffices — zero stem matches; existing `ServerSocket` questions test bind conflicts and blocking `accept()`, not this specific misconception. |
| Test 2, Q9 | `Thread.join()` blocking semantics via a concrete code trace (`x = 42` printed only after `.join()`) — no existing question stem matches `join()` specifically. |
| Test 2, Q17 | Full client/server socket code trace with a specific "Echo: Shalom" output to identify — a distinct code-analysis question from the existing accept()/bind() conceptual questions. |
| Test 2, Q19 | ISP violation via a deliberately unrelated-methods interface (exam-checking + cook-time + music-playing) — existing bank has 2 ISP questions, both about the SRP-vs-ISP distinction/definition, not this concrete "fat interface" illustration. |
| Test 3, Q1 | `Box<T>` custom generic class holding both `String` and `Integer`, with an unboxing-arithmetic output trace (`2025+1=2026`) — no matching stem; a distinct code-analysis angle on generics. |
| Test 3, Q11 | Paradigm-selection question ("which paradigm suits event-driven GUI development") — existing single event-driven-topic question is about `Listener` vs `Handler` terminology specifically, not paradigm choice. |
| Test 3, Q15 | `Thread` lifecycle using the actual `Thread.State` enum names (`NEW`/`RUNNABLE`/`WAITING`/`BLOCKED`/`TERMINATED`) plus the fact that a `TERMINATED` thread cannot be restarted — existing single lifecycle question uses the course's "four states" framing, a different (and valuable, complementary) angle. |
| Test 3, Q17 | Anonymous class implementing `Runnable` for thread creation — **zero** matches for "anonymous class" anywhere in the existing bank; a genuine coverage gap. |
| Test 3, Q20 | UML composition via a concrete `House`/`Room` example — existing 12 aggregation/composition questions use different noun-pairs; this is a legitimately different concrete illustration of the same principle. |

## Rejected (46) — duplicates, not added

| Source | Duplicate of |
|---|---|
| Test 1, Q1 | JVM/bytecode topic is extensively covered (`java-platform-jvm`, many active questions on javac→bytecode→JVM). |
| Test 1, Q2 | String pool `==`/`.equals` — existing `q-generics-collections-equals-hashcode-006`, `-009` test the identical insight. |
| Test 1, Q4 | `equals` overridden without `hashCode` breaking `HashMap`/`HashSet` — 7 existing matches on this exact contract violation; also internally repeated at Test 2 Q20 and Test 3 Q5. |
| Test 1, Q6 | Interface with unimplemented method left abstract in an abstract subclass — **near-verbatim identical** to existing `q-oop-pillars-abstraction-009` (same interface-A/abstract-class-B/`hello()` scenario). |
| Test 1, Q7 | Aggregation vs composition definitional question — 12 existing matches on this exact distinction. |
| Test 1, Q11 | Singleton "which is **not** correct" (miscategorized as Structural) — Singleton is covered by 5 existing questions including categorization. |
| Test 1, Q12 | Adapter Class vs Adapter Object — 9 existing matches. |
| Test 1, Q13 | Facade hiding subsystem complexity — 5 existing matches; also internally repeated at Test 3 Q6. |
| Test 1, Q14 | Decorator pattern characterization — 7 existing matches. |
| Test 1, Q15 | Bridge pattern (Shape/DrawingAPI abstraction-implementation split) — 12 existing matches; textbook GoF example already used. |
| Test 1, Q16 | `Thread.run()` called directly vs `.start()` — this exact gotcha appears **3 times** in the new source alone (Test 1 Q16, Test 2 Q1, Test 3 Q16) and is heavily covered in the existing bank (23 matches in the general Runnable/Thread area). |
| Test 1, Q17 | `volatile` guarantees visibility, not atomicity — 7 existing matches; internally repeated at Test 2 Q5. |
| Test 1, Q18 | `count++` race condition across two threads — extremely common existing coverage under `thread-safety-synchronization`; internally repeated at Test 2 Q11. |
| Test 1, Q20 | `transient` skipped during serialization — 2 existing matches; internally repeated at Test 2 Q14. |
| Test 2, Q1 | Duplicate of Test 1 Q16 (see above), near-verbatim (only the class name changed: `Runner` vs `Test`). |
| Test 2, Q2 | `ServerSocket`+`accept()` blocking with no threads — **near-verbatim identical** to existing `q-networking-sockets-io-streams-005`; also internally the same scenario as Test 1 Q19's setup (different question, but overlapping premise). |
| Test 2, Q3 | Why `Runnable` is preferred over extending `Thread` — falls under the 23-match Runnable/Thread coverage area; single-inheritance rationale is standard existing content. |
| Test 2, Q4 | TCP vs UDP difference — **near-verbatim identical** to existing `q-pastexam-2019-016` ("מה ההבדל בין TCP ל-UDP?"). |
| Test 2, Q5 | Duplicate of Test 1 Q17 (`volatile`), near-identical wording. |
| Test 2, Q6 | Strategy pattern via swappable sort algorithm — 8 existing Strategy questions already cover definition, drawbacks, and differentiation from Factory/Bridge. |
| Test 2, Q7 | `execute()` vs `submit()` on `ExecutorService` — falls under extensive existing `Callable`/`Future`/`ExecutorService` coverage (12 matches); internally repeated at Test 2 Q13. |
| Test 2, Q8 | OSI 7-layer model — 13 existing matches. |
| Test 2, Q10 | Observer "which is **not** correct" (polling myth) — 17 existing matches; internally repeated at Test 3 Q8. |
| Test 2, Q11 | Duplicate of Test 1 Q18 (`count++` race condition). |
| Test 2, Q12 | `ServerSocket` port already in use — **near-verbatim identical** to existing `q-pastexam-2024-002` ("מה קורה אם ServerSocket קיבל פורט להאזנה שכבר בשימוש אצל תהליך אחר?"). |
| Test 2, Q13 | Duplicate of Test 2 Q7 (`Callable`/`Future`/`ExecutorService`). |
| Test 2, Q14 | Duplicate of Test 1 Q20 (`transient` in serialization). |
| Test 2, Q15 | Mediator pattern via chatroom example — 8 existing matches; internally repeated at Test 3 Q9 (identical "chatroom" framing). |
| Test 2, Q16 | `synchronization` definition — **near-verbatim identical** to existing `q-pastexam-2024-014`/`q-pastexam-2018-016`. |
| Test 2, Q18 | Command pattern via lamp on/off — **near-identical** to existing `q-design-patterns-behavioral-017` (same lamp on/off lab example); internally repeated at Test 3 Q10. |
| Test 2, Q19 | *(accepted — see above)* |
| Test 2, Q20 | Duplicate of Test 1 Q4 (`equals` without `hashCode`). |
| Test 3, Q2 | `ArrayList` vs `LinkedList` Big-O — **near-verbatim identical** to existing `q-generics-collections-equals-hashcode-012`. |
| Test 3, Q3 | `TreeMap` sorted-keys iteration order — 2 existing matches on the same insight (different names, same fact). |
| Test 3, Q4 | `Integer` caching (`-128..127`) boundary — same core insight as existing `q-generics-collections-equals-hashcode-010`, just different demonstration values (100 vs 200 instead of the cache boundary itself). |
| Test 3, Q5 | Duplicate of Test 1 Q4 (`equals` without `hashCode`). |
| Test 3, Q6 | Duplicate of Test 1 Q13 (Facade). |
| Test 3, Q7 | Duplicate of Test 1 Q11 (Singleton characterization, positive framing of the same fact set). |
| Test 3, Q8 | Duplicate of Test 2 Q10 (Observer polling myth). |
| Test 3, Q9 | Duplicate of Test 2 Q15 (Mediator chatroom). |
| Test 3, Q10 | Duplicate of Test 2 Q18 (Command pattern). |
| Test 3, Q12 | `Listener` vs `Handler` — near-identical to existing `q-event-driven-javafx-mvc-002`. |
| Test 3, Q13 | JavaFX component hierarchy (`Application→Stage→Scene→Layout→Nodes`) — 11 existing matches. |
| Test 3, Q14 | JavaFX MVC/GUI-thread/CSS "all of the above" combo question — rejected due to topic saturation *and* a subtle imprecision in option (b)'s framing (conflates "FX Application Thread is technically distinct from the thread that calls `Application.launch()`" with a slightly misleading "kept separate for responsiveness" justification); not worth adding given the ambiguity plus existing coverage. |
| Test 3, Q16 | Duplicate of Test 1 Q16 (`run()` vs `.start()`), third occurrence of the same question across the 3 files. |
| Test 3, Q18 | SOLID SRP god object (`ReportManager`: calc+format+save) — same underlying illustration as accepted Test 1 Q8, just renamed; internal duplicate. |
| Test 3, Q19 | Abstract class vs interface differences — overlaps existing `q-oop-pillars-abstraction-008`/`-009` territory closely. |

## Generated variants

For each accepted question, one new variant question was authored (different wording, different distractors, or a harder application angle — never a trivial paraphrase), tagged `origin: "supplemental_generated"` and citing the source PDF in `sourceReferences`. No variants were generated for rejected/oversaturated topics (e.g. a 4th `run()`-vs-`.start()` question) since that would add bulk without educational value, contradicting the explicit "do not create trivial paraphrases or duplicates" instruction. See `src/data/question-packs/*.json` for the full question bodies and `reports/additional_question_validation.md` for structural validation results.
