# מפת נושאים — נושאים מתקדמים בתכנות (Advanced Topics in Programming)

מסמך זה הוא הגרסה הקריאה-לאדם של `topic_map.json`. 16 נושאים, מסודרים בסדר לימוד הגיוני. שמות מחלקות, מתודות, ותבניות עיצוב נשארים באנגלית; ההסברים בעברית.

תדירות המבחן (`examFrequency`) מבוססת על ניתוח בפועל של 4 מבחנים מלאים ומאושרים (2018 x2, 2019 שחזור, 2024, 2025) — ראו `extracted_materials/exam_structure_reference.json` לפירוט.

---

## 1. פלטפורמת Java: JVM, Bytecode, JIT ו-Heap/Stack — תדירות: **גבוהה**

**הגדרה:** קוד המקור (.java) מתורגם ע"י javac ל-Bytecode (.class). ה-JVM מפרש את ה-Bytecode ומתרגם למכונה הספציפית של מערכת ההפעלה. ה-JIT מקמפל בזמן ריצה קטעי קוד "חמים" ישירות לשפת מכונה לשיפור ביצועים. JDK = JRE + כלי פיתוח; JRE = JVM + ספריות.

**למה זה מאפשר cross-platform:** ה-Bytecode אוניברסלי; ה-JVM תלוי-פלטפורמה. **תשובה קבועה במבחן: JVM, לעולם לא JavaFX.**

**Heap** (אובייקטים, מנוקה ע"י GC, `OutOfMemoryError`) מול **Stack** (לכל Thread, LIFO, `StackOverflowError`).

**מלכודות:** JIT *אינו* ממיר Java ל-Bytecode (זה javac); JIT מבצע "תרגום בזמן ריצה של חלק מה-bytecode להוראות מעבד בשפת מכונה".

**מקורות:** lec_1_2 (סליידים 12-27, 36-38), lab_1 (7-15), grade_100_term_a Q1/Q3, date_2018 Q1/Q3.

---

## 2. יסודות Java: מחלקות, מודיפיירים, Pass-by-Value — תדירות: **בינונית**

**הגדרה:** Java תמיד Pass-by-Value — גם עבור אובייקטים מועבר עותק של *ערך ההפניה*, לא ההפניה עצמה. שינוי שדה בתוך אובייקט קיים (`d.setName()`) משפיע על המקור; החלפת ההפניה עצמה (`d = new Dog()`) לא.

**מודיפיירים:** private < default (package) < protected < public.

**מקורות:** lec_1_2 (30-53), lab_1 (16-22), advancedprogramming/ByValue.java.

---

## 3. תרשימי מחלקות UML וקשרים — תדירות: **בינונית**

**קשרים:** Association (עם Multiplicity), Aggregation (יהלום ריק — החלק יכול להתקיים בלי המכיל, כמו מכונית-דלת), Composition (יהלום מלא — החלק תלוי במכיל, כמו מצולע-נקודות), Generalization (ירושה), Realization (מימוש ממשק).

**מלכודת:** אל תבלבלו Generalization (extends) עם Realization (implements) — שניהם חץ עם משולש ריק, אך אחד רציף ואחד מקווקו.

**מקורות:** lec_1_2 (54-70), lab_2 (16-24).

---

## 4. עקרונות OOP: הכלה, ירושה, פולימורפיזם, Abstract מול Interface — תדירות: **בינונית**

**Abstract Class:** לא ניתן ליצור מופע; מתודה abstract אחת הופכת את כל המחלקה למופשטת; יורש קונקרטי חייב לממש הכל. עדיף כשהמחלקות קשורות, רוצים לשתף קוד/שדות לא-סטטיים.

**Interface:** חוזה טהור; אפשר לממש כמה ממשקים במקביל ("ריבוי ירושה" של טיפוס); מ-Java 8 אפשר `default` methods. עדיף כשהמחלקות לא קשורות (כמו Comparable).

**מלכודת:** Overriding = פולימורפיזם *runtime*; Overloading = פולימורפיזם *compile-time* — הבדל שנבדק ישירות.

**מקורות:** lec_1_2 (71-87), lec_5 (33-36), lab_2 (9-13), restoration_2023 Q9.

---

## 5. מסיפור לקוד: בעיות מרחב-מצבים והפרדת אלגוריתם מבעיה — תדירות: **נמוכה**

שלבי OOA: איסוף דרישות → תיאור מערכת → זיהוי ישויות (שמות עצם) → תיאור אינטראקציה (פעלים) → תרשים מחלקות → פיתוח. State-Space Search: State, Start State, Goal Test, Successor Function. ההפרדה בין `ISearchable` (חוזה בעיה) ל-`ISearcher` (חוזה אלגוריתם) עם `BaseSearcher` אבסטרקטי היא בעצם מימוש טבעי של תבנית **Bridge**.

**מקורות:** lec_3 (כל המצגת), atp2026_lab2 (shapes hierarchy), grade_100_term_a Q4 (שאלה ספציפית-לפרויקט).

---

## 6. עקרונות SOLID — תדירות: **גבוהה**

| אות | עיקרון | דוגמה קלאסית למבחן |
|---|---|---|
| S | Single Responsibility | ממשק Modem עם connect+data — פצלו ל-2 ממשקים |
| O | Open/Closed | GraphicEditor עם if-else לפי צורה — פתרון: `Shape.draw()` פולימורפי |
| L | Liskov Substitution | **Square extends Rectangle** — שינוי width/height שובר ציפיות |
| I | Interface Segregation | Mammal עם eat()+walkOnLand(); Whale לא הולך על אדמה |
| D | Dependency Inversion | OrderService תלוי ישירות ב-MySQLDatabase במקום בממשק |

**מלכודות מרכזיות:** Factory *אינו* פוגע בשום עיקרון SOLID (תומך ב-OCP). "ריבוע יורש ממלבן" = *תמיד* L, לא S. תשובות משולבות ("ג+ד") מופיעות בפועל.

**מקורות:** lec_4 (3-20), lab3_upd (3-19), grade_100_term_a Q3/Q15 (מאושר), advanced_topics...student_solution_2 Q2, restoration_2023 Q2.

---

## 7. תבניות יצירתיות: Factory ו-Singleton — תדירות: **גבוהה**

**Factory:** מחלקה מרכזת מחליטה איזה אובייקט קונקרטי ליצור בזמן ריצה — פותר if-else מרובה, תומך ב-OCP. **`Executors` הוא Factory** שיוצר `ExecutorService` (מאושר 2025).

**Singleton:** בנאי private + שדה instance סטטי + `getInstance()`. מימוש נאיבי (`if(instance==null)`) **אינו Thread-Safe** — race condition אפשרי.

**מקורות:** lec_4 (35-40), lec_5 (18-22), lab3_upd (40-43), lab_4_prod (13-20), atp2021_lab3/TaskManager.java, grade_100_term_a Q10/Q12.

---

## 8. תבניות מבניות: Bridge, Facade, Adapter, Decorator — תדירות: **גבוהה**

**Bridge:** מפריד Abstraction מ-Implementation, שני צירי שינוי מתפתחים עצמאית (למשל Calculator x CalculatorEngine). **דוגמה חוזרת: ThreadScheduler (Preemptive/TimeSliced) x OS (Unix/Windows) → Bridge (מאושר 2024).**

**Facade:** מחלקה יחידה מסתירה מורכבות (דוגמת ATM).

**Adapter:** Class Adapter (ירושה) מול Object Adapter (הכלה, גמיש יותר). דוגמה אמיתית: `WorkerSorterTask` (Object Adapter) מתאים `IWorkerSorter` ל-`ITask`.

**Decorator:** מוסיף התנהגות למופע בודד בזמן ריצה (דוגמת גלידה עם תוספות — קוד מלא ב-presentation8).

**Bridge מול Strategy:** שתיהן משתמשות ב-Composition ונראות דומות בקוד, אך Bridge היא Structural (הפרדת מימוש, הלקוח פחות מודע) ו-Strategy היא Behavioral (בחירת אלגוריתם, הלקוח בוחר במפורש).

**מקורות:** lec_4 (41-47), lec_5 (14-17), lab3_upd (30-39), lab_10 (3-12, טבלת Bridge vs Strategy!), presentation8 (16-33).

---

## 9. תבניות התנהגותיות: Strategy, Observer, Mediator, Command — תדירות: **גבוהה**

**Strategy:** משפחת אלגוריתמים החלפיים בזמן ריצה (דוגמה אמיתית: מיון עובדים לפי שם/גיל/משכורת).

**Observer:** "אחד-להרבה". `java.util.Observable` הוא **class לא interface** (מגביל ירושה). **שאלה חוזרת בכל מבחן:** "מה אינו נכון ב-Observer" — התשובה השגויה-שהיא-הנכונה: "ה-Observable חייב להכיר את המחלקות הקונקרטיות של ה-Observers" (שגוי — הקשר אבסטרקטי).

**Mediator:** מרכז תקשורת בין אובייקטים מרובים (למשל Thread Pool ממומש ע"י שילוב Mediator+Command).

**Command:** בקשה עטופה כאובייקט, מועברת ל-Invoker.

**Mediator מול Adapter:** Adapter מחבר קוד קיים; Mediator מתכנן ארכיטקטורה חדשה.

**מקורות:** lec_5 (23-32), lec_6 (30-41), lec_9 (22-31), presentation8 (5-15), atp2021_lab3, atp2021_lab12 (MVVM+Observer), grade_100_term_a Q8/Q20.

---

## 10. Generics, Collections, equals/hashCode — תדירות: **גבוהה**

**Generics:** רק Object types (לא primitives); Type Erasure — בקומפילציה `List<Integer>`≠`List<String>`, בריצה שניהם `List<Object>`.

**השאלה החוזרת בכל מבחן (2018-2024):** `GenericStack<E>` — push string ל-`GenericStack<String>`, push int ל-`GenericStack<Integer>` נפרד → **אין שגיאה**, הפלט הוא שתי המילים/מספרים יחד (למשל "Rusia 2018").

**equals/hashCode:** אם דורסים equals() **חובה** לדרוס גם hashCode() (לא שגיאת קומפילציה אם לא עשית זאת — רק באג לוגי שקט באוספי hash!).

**מקורות:** lec_5 (4-10, 37-44), lab_4_prod (7-12), advancedprogramming/Employee.java (equals+hashCode), advancedprogramming/Main.java (String pool, Integer caching traps), grade_100_term_a Q7.

---

## 11. רשתות: Sockets, TCP/UDP, Streams, סריאליזציה — תדירות: **גבוהה**

Socket = IP+Port. TCP (מבוסס-חיבור, אמין, "שיחת טלפון") מול UDP (ללא חיבור, לא אמין, "דואר", עד 64KB). `ServerSocket.accept()` חוסם. **פורט תפוס → BindException (זריקת שגיאה), לא המתנה ולא הרמוניה.**

Serialization = כתיבת אובייקט לבייטים; **Deserialization = שליפת/קריאת נתונים מה-Stream** (לא כתיבה!). שדות `transient` לא נשמרים/משוחזרים.

**מקורות:** lec_6 (3-29), lab_5 (3-20), lab6n (3-9), advancedprogramming/DateClient.java, date_2025 Q6/Q11/Q14, date_2018 Q11/Q12.

---

## 12. יסודות Threads: Process מול Thread, יצירה ומחזור חיים — תדירות: **גבוהה**

Process (מרחב Data עצמאי) מול Thread (חולק Heap, Stack פרטי). שתי דרכי יצירה: `extends Thread` או `implements Runnable`. **חוק ברזל: לעולם אל תקראו ל-`run()` ישירות — תמיד `start()`** (אחרת אין thread חדש, רק ריצה סינכרונית).

**שאלה חוזרת:** `obj.run(); obj.start();` על מחלקה שגם extends Thread וגם implements Runnable → הפלט מודפס **פעמיים** ("GFG GFG").

**מקורות:** lec_7 (כל המצגת), lab6n (6-15), advancedprogramming/MyThreadTest.java, grade_100_term_a Q19, date_2018 Q19.

---

## 13. בטיחות תהליכונים: Race Conditions, synchronized, volatile, Deadlock — תדירות: **גבוהה**

`counter++` אינו אטומי (3 פעולות נפרדות) → race condition. `synchronized` — רק thread אחד מחזיק monitor בכל רגע. **`volatile` מבטיח נראות (visibility) בלבד, לא אטומיות** — המלכודת הכי חוזרת במבחנים!

**Deadlock:** 2+ threads ממתינים זה לזה לשחרור משאב לנצח (לא "thread שמסיים ונועל").

**Lock Starvation:** נעילה שמוחזקת סביב לולאת `while(true)` שלמה מונעת מפונקציית `stop()` לגשת אליה לעולם — פתרון: החזק מנעולים לזמן הקצר ביותר האפשרי.

**מקורות:** lec_8 (9-38), lec_9 (5-15), lab_7 (13-25), advancedprogramming/Counter.java + VolatileExample.java, date_2025 Q13/Q16.

---

## 14. Callable, Future, ExecutorService, Thread Pool — תדירות: **גבוהה**

`Callable<V>` (כמו Runnable, מחזיר V, זורק Exception) מול `Runnable` (אין החזרה). `Future.get()` **חוסם** עד לסיום. `execute()` (Runnable, אין ערך) מול `submit()` (מחזיר Future).

**מאושר 2025:** יתרון ExecutorService+Future = "ניהול מאגר קבוע של תהליכונים, שליחת משימות, וקבלת תוצאה" (לא "ריצה סינכרונית" ולא "Thread חדש בכל הרצה").

**מקורות:** lec_8 (29-41), lec_9 (17-21), lab_7 (18-30), advancedprogramming/CallableExample.java, grade_100_term_a Q5/Q12.

---

## 15. תכנות מונחה-אירועים, JavaFX, MVC/MVVM — תדירות: **בינונית-גבוהה**

Event-Driven: זרימה נקבעת ע"י אירועים, לא סדר קבוע. Listener (רשום למקור) מול Handler (מטפל באירוע). היסטוריה: AWT→Swing→SWT→JavaFX. היררכיה: `Application→Stage→Scene→Layout→Node`.

**MVVM מול MVC** (4 הבדלים): תלויות (View מכיל ViewModel מכיל Model; Model לא מודע לשניים), מתווך (ViewModel מעביר+מוודא לעומת Controller שמנהל ישירות), תקשורת (View מקבל אירוע ← קורא ל-ViewModel ← קורא ל-Model, שרשרת התראות), ירושה (Model=Observable; ViewModel=Observable+Observer; View=Observer).

**מקורות:** lec_10_11 (3-16, 24-51), lab_10 (13-22), lab11_s (3-18), atp2021_lab12 (MVVM אמיתי), date_2018 Q18/Q20.

---

## 16. בלוקצ'יין ומטבעות קריפטוגרפיים — תדירות: **נמוכה**

Blockchain = יומן מבוזר וציבורי. Proof of Work (Bitcoin, תחרות חישובית פתוחה, בזבזני-אנרגיה) מול Proof of Stake (Ethereum/Cardano, validator יחיד משוקלל לפי stake, חסכוני). Wallet שומר private key בלבד, לא את המטבעות עצמם.

**הערה:** נושא זה לא נמצא בפועל באף שאלת מבחן שנבדקה (2018-2025) — משקל נמוך, אך כדאי הכרה בסיסית.

**מקורות:** lec_12 (כל המצגת).
