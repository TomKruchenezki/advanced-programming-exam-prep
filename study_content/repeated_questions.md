# Repeated Questions Across Years — Read This First

This is the highest-value page in Phase 4. These are questions (or near-identical variants of the same question) that were verified appearing in **two or more different exam years**. If you only have time to memorize one thing before the exam, memorize this page — these patterns have appeared in 2018, 2019, 2024, and 2025, which means they are very likely to appear again.

All question IDs below refer to `extracted_materials/clusters/pastexam_questions.json`.

---

## 1. The ThreadScheduler "Bridge" diagram — appeared 3 times (2018, 2019, 2024)

Exact same class diagram: `ThreadScheduler` splits into `PreemptiveThreadScheduler` / `TimeSlicedThreadScheduler` (scheduling policy), each of which splits again into `UnixXXX` / `WindowsXXX` (operating system). This is the textbook two-independent-dimensions setup.

**Answer: Bridge Design Pattern. Every single time.**

- `q-pastexam-2018-005` (student answered wrong in 2018, resolved via cross-year confirmation)
- `q-pastexam-2019-015` (reconstruction, no native answer key, resolved via cross-year confirmation)
- `q-pastexam-2024-020` (grader-confirmed correct — this is the anchor that resolved the other two)

**Why it matters:** the answer was uncertain in the original 2018 scan alone. Only by lining up all three years did it become clear the answer is always Bridge. If you see two independent axes of variation in a class diagram (X-many-things × Y-many-things), the answer is Bridge — not Factory, not Strategy, not Observer.

## 2. The GenericStack "Rusia/Germany + year" joke — appeared in 2018 and 2024 (and a disputed 2019 variant)

```java
GenericStack<String> gs = new GenericStack<>();
gs.push("Rusia");            // or "Germany" in later years
System.out.print(gs.pop() + " ");
GenericStack<Integer> gs2 = new GenericStack<>();   // a SEPARATE generic instance
gs2.push(2018);               // or 2024
System.out.println(gs2.pop());
```

**Answer: prints both values together with no error (e.g. "Rusia 2018" / "Germany 2024"). Never a compile or runtime error.**

- `q-pastexam-2018-009`
- `q-pastexam-2024-011`
- A 2019 reconstruction variant exists but was **rejected** (`q-rejected-2019-011`) because its transcribed code reuses a single generic instance instead of two separate ones — a meaningfully different (and unverifiable) scenario.

**Why it matters:** the trap is thinking two different generic instantiations of the same generic class "conflict." They don't — `GenericStack<String>` and `GenericStack<Integer>` are two completely independent objects due to type erasure. This is the single most consistently-repeated code-output question in the entire course history.

## 3. "What makes Java/JavaFX cross-platform?" — appeared in every year checked (2018, 2019 context, 2024, 2025)

**Answer: the JVM. Never JavaFX, Observer, or MVVM.**

- `q-pastexam-2018-001`
- `q-pastexam-2024-005`
- `q-pastexam-2025-001` (javac vs bytecode variant) and `q-pastexam-2025-009` ("write once, run anywhere" variant)

**Why it matters:** JavaFX is offered as a tempting wrong answer almost every year because the question is *about* JavaFX. The JVM is what translates bytecode to machine code for each OS — that's the actual reason, every time.

## 4. Observer — "which statement is NOT true" — appeared in 2018 and 2024 (word-for-word)

The false statement is always: *"the Observable must be aware of the concrete classes of its Observers, so the relationship is not abstract."* This is false — the Observable only needs to know the abstract `Observer` interface.

- `q-pastexam-2018-010`
- `q-pastexam-2024-012`

## 5. equals() overridden without hashCode() — appeared in 2018 and 2024 (word-for-word)

**Trap:** the tempting wrong answer is "this isn't even possible, it's a compile error." **It is NOT a compile error** — it's a silent logical bug that breaks HashMap/HashSet (equal objects may land in different buckets).

- `q-pastexam-2018-007`
- `q-pastexam-2024-010`

## 6. `obj.run(); obj.start();` on a class that both `extends Thread` and `implements Runnable` — appeared in 2018 and 2024 (identical code, "GFG " print statement)

**Answer: prints the message twice ("GFG GFG").** `run()` executes synchronously on the calling thread; `start()` spins up a *new* thread that itself calls `run()` again.

- `q-pastexam-2018-017`
- `q-pastexam-2024-018`

## 7. ServerSocket on a port already in use — appeared in 2018 and 2024 (word-for-word)

**Answer: an exception is thrown immediately (BindException — "port already in use").** No waiting, no automatic port reassignment, no silent graceful exit.

- `q-pastexam-2018-011`
- `q-pastexam-2024-002`

## 8. Server + client in the same `main`, no Threads — appeared in 2018 and 2024 (word-for-word, same combined answer)

**Answer: a combined answer** — both (a) creating the ServerSocket first and calling `accept()` blocks forever so you never reach the client code, AND (b) creating the client Socket first (before any server is listening) throws a connection error. Don't assume only one letter is correct; combined answers ("א+ד", "ב+ג") are common and legitimate in this course's exams.

- `q-pastexam-2018-012`
- `q-pastexam-2024-003`

## 9. "Choose an algorithm at runtime" — appeared in 2018, 2019, and 2024

**Answer: Strategy.** Distractor options often include "Adapter or Mediator" bundled together — neither is correct.

- `q-pastexam-2018-006`
- `q-pastexam-2019-012`
- `q-pastexam-2024-009`

## 10. "Which interface does the `Thread` class implement?" — appeared in 2018 and 2024 (word-for-word)

**Answer: Runnable.**

- `q-pastexam-2018-014`
- `q-pastexam-2024-013`

## 11. Synchronization definition — appeared in 2018 and 2024 (word-for-word)

**Answer: a constraint that forces multiple threads to access a piece of code sequentially (one at a time).** Not "simultaneous access," which is the opposite of the point.

- `q-pastexam-2018-016`
- `q-pastexam-2024-014`

## 12. javac vs. JVM — "which component converts .java source to bytecode?" — appeared in 2024 (wrong for that student) and 2025 (grader-confirmed)

**Answer: javac.** The JVM *runs* bytecode; it does not produce it.

- `q-pastexam-2024-004` (resolved via cross-year confirmation with the 2025 answer below)
- `q-pastexam-2025-001` (grader-confirmed 100/100 — this is the anchor)

---

## Bottom line

If you memorize nothing else: **Bridge for two-axis diagrams, JVM for cross-platform, "no error" for the GenericStack joke, and "not a compile error" for equals-without-hashCode.** These four alone have appeared roughly 12 times across the four analyzed exam years.
