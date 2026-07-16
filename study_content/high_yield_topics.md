# High-Yield Topics for the Next Exam

Ranked by how often each topic appeared across the four analyzed exam years (2018, 2019, 2024, 2025) in the verified question bank (`extracted_materials/clusters/pastexam_questions.json`, 73 questions), combined with judgment from the broader source analysis (`extracted_materials/exam_structure_reference.json`). Full numbers are in `study_content/topic_frequency.json`.

Every one of the four exams analyzed has 20 questions worth 5 points each (100 points total), 1.5 hours (2.5 hours in the 2018 version), single-best-answer American-style, and a passing score of 55/100. Assume the next exam follows the identical structure.

## Tier 1 — Appeared in every single exam year analyzed (100% hit rate). Study these first.

1. **Networking / Sockets / IO Streams** (14 verified questions — the single most-tested topic). Recurring exact patterns: ServerSocket on a taken port throws immediately; server+client in one `main` without threads blocks/fails; `bind()` attaches a socket to a local address; InputStream/OutputStream do the actual read/write over a socket; serialization vs. deserialization direction; `transient` fields are excluded from serialization.
2. **Threads — basics & lifecycle** (10 questions). `start()` vs `run()` (the "GFG GFG" double-print trap), which method actually claims CPU time, `Thread` implementing `Runnable`, constructor name must exactly match class name (case-sensitive) or you get a compile error.
3. **Design Patterns — Behavioral** (8 questions). Observer (notification fan-out, the "Observable must know concrete Observer classes" false trap), Strategy (runtime algorithm choice).
4. **Design Patterns — Structural** (7 questions). Bridge (the recurring ThreadScheduler diagram — two independent axes of variation), Decorator, Facade, Adapter (project-specific: object adapter in the maze assignment).
5. **Generics / Collections / equals-hashCode** (7 questions). The GenericStack "no error, two separate instances" joke; overriding `equals()` without `hashCode()` is legal but breaks HashMap/HashSet (never a compile error); a `hashCode()` based on a partial field creates unnecessary collisions.
6. **Thread safety & synchronization** (7 questions). `synchronized` keyword, deadlock definition, `volatile` guarantees visibility (not atomicity, not a private per-thread copy — the opposite), which collection classes are/aren't thread-safe.
7. **SOLID principles** (5 questions, appeared in 3 of 4 years but consistently high-value). Square-extends-Rectangle is always LSP. A class depending on a concrete class instead of an interface/abstraction is always DIP. One class with two unrelated responsibilities is SRP; one interface forcing unrelated methods on implementers is ISP — these two are the pair students confuse most.
8. **Design Patterns — Creational** (Factory, Singleton). Only 2 questions landed in the verified bank at high confidence, but the underlying concepts (Executors as a Factory, config-loading as Singleton) recur throughout the source material — treat as very-high priority despite the modest count.

## Tier 2 — Appeared in most years (75%), still worth strong preparation.

9. **Concurrency utilities** (ExecutorService, Callable/Future, submit vs. execute). 4 questions, present in 2019/2024/2025.
10. **JavaFX / event-driven / MVC** (4 questions). JavaFX vs. Swing, Data Binding, MVC's separation of model from user-facing concerns, MVC's relationship (or lack thereof) to Bridge.
11. **Java basics — OOP & memory** (3 questions). Pass-by-value, access modifiers, autoboxing/unboxing (a value can go through both processes in two consecutive lines), `this` cannot be used in a static context.

## Tier 3 — Seen at least once; lower priority but don't skip entirely.

12. **UML class diagrams** (aggregation/composition/generalization) — 1 question (2018), last seen 2018.
13. **OOP pillars / abstraction** (coupling, abstract class vs. interface) — 1 question (2019, unconfirmed answer key).
14. **State-space search / project-specific decoupling** (ISearchable/ISearcher, ties to the maze project) — 1 question (2025), tends to be project-specific and unpredictable in exact phrasing.

## Tier 4 — Lowest priority.

15. **Blockchain / cryptocurrency** — only 1 question found across all four years (2019 reconstruction, unconfirmed answer key), never appeared in any of the three grader-confirmed exams (2018, 2024, 2025). If you're short on time, this is the first thing to deprioritize.

## Practical takeaway for a 3-day study plan

Given the exam is 20 questions × 5 points, and networking/sockets + threads + design patterns (behavioral+structural) together account for roughly 40% of all verified past questions, allocate your remaining study time proportionally: networking/threads/patterns first, SOLID and generics/collections second, JavaFX/concurrency-utilities third, and treat blockchain as an "only if time remains" topic.
