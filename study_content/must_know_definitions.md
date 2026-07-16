# הגדרות חובה לשינון — מילון מונחים מהיר

מסמך סריקה מהירה. כל ערך: המונח באנגלית + הגדרה מדויקת בעברית שתואמת ניסוח מבחן. מסודר לפי נושא.

---

## Java Platform / JVM

- **JVM (Java Virtual Machine)** — מכונה וירטואלית, תלוית-פלטפורמה, שקוראת Bytecode ומתרגמת אותו למכונה. זה מה שמאפשר ל-Java להיות cross-platform.
- **javac** — המהדר (compiler) של Java; ממיר קוד מקור `.java` ל-Bytecode `.class`.
- **JIT (Just-In-Time Compiler)** — רכיב בתוך ה-JVM; "תרגום בזמן ריצה של חלק מה-bytecode להוראות מעבד בשפת מכונה" (לא הופך java ל-bytecode!).
- **JDK** = JRE + כלי פיתוח (javac, jdb). **JRE** = JVM + ספריות ריצה. **JVM** = מנוע ההרצה בלבד.
- **Bytecode** — שפת ביניים (קובץ `.class`) שהמהדר מייצר; אוניברסלית, לא תלוית-מערכת-הפעלה.
- **Heap** — זיכרון משותף לאובייקטים; מנוקה ע"י GC; מלא → `OutOfMemoryError`.
- **Stack** — זיכרון פרטי לכל Thread (LIFO); משתנים מקומיים + הפניות; מלא → `StackOverflowError`.
- **Garbage Collector (GC)** — משחרר אוטומטית אובייקטים ללא הפניות; ניתן "להזמין" עם `System.gc()` (לא לאלץ).
- **finalize()** — מתודה הניתנת לדריסה, נקראת ע"י ה-GC לפני שחרור אובייקט.

## Java Basics

- **Pass-by-Value** — Java **תמיד** Pass-by-Value; עבור אובייקטים מועבר עותק של *ערך ההפניה*, לא ההפניה עצמה ולא האובייקט.
- **Access Modifiers** — `private` (מחלקה בלבד) < ברירת מחדל/package (החבילה) < `protected` (חבילה+יורשים) < `public` (כולם).
- **Overloading** — אותו שם מתודה, פרמטרים שונים; פולימורפיזם **compile-time** (static binding).
- **Overriding** — מתודה עם אותה חתימה במחלקת-בת; פולימורפיזם **runtime** (dynamic binding).

## UML

- **Association** — קשר כללי בין מחלקות, עם Multiplicity.
- **Aggregation** — הכלה חלשה (יהלום ריק); החלק יכול להתקיים בלי המכיל.
- **Composition (Composite Aggregation)** — הכלה חזקה (יהלום מלא); החלק תלוי לחלוטין בקיום המכיל; ריבוי הצד המכיל חייב להיות 0 או 1.
- **Generalization** — ירושה (extends); חץ משולש-ריק, קו רציף.
- **Realization** — מימוש ממשק (implements); חץ משולש-ריק, קו מקווקו.
- **Multiplicity** — `1` (בדיוק אחד), `0..*`/`*` (אפס-או-יותר), `1..*` (אחד-או-יותר), `0..1` (אפס-או-אחד).

## OOP Pillars

- **Encapsulation** — כימוס: אריזת state+behavior, הסתרת מימוש.
- **Inheritance** — ירושה: מחלקת-בת יורשת שדות/מתודות ע"י `extends`.
- **Polymorphism** — ריבוי-צורות: אובייקט מתייחס כטיפוסים שונים בעץ הירושה שלו.
- **Abstract Class** — לא ניתן `new`; מתודה `abstract` אחת הופכת את כל המחלקה למופשטת; יורש קונקרטי חייב לממש הכל.
- **Interface** — חוזה טהור; `implements` מרובה מותר; מ-Java 8 אפשר `default` methods.

## State-Space Search (Lecture 3)

- **State Space** — אוסף כל המצבים האפשריים.
- **Start State** — המצב שממנו מתחיל החיפוש.
- **Goal Test** — פונקציה הבודקת אם מצב נתון הוא היעד.
- **Successor Function** — פונקציה שמחזירה את השכנים הישירים של מצב, כולל עלות ההגעה.
- **ISearchable / ISearcher** — ממשקים המפרידים את הבעיה (ISearchable) מהאלגוריתם (ISearcher) — מימוש טבעי של Bridge.

## SOLID

- **S — Single Responsibility Principle**: "There should never be more than one reason for a class to change."
- **O — Open Closed Principle**: "Classes should be open for extension, but closed for modification."
- **L — Liskov Substitution Principle**: "Functions that use pointers to base classes must be able to use objects of derived classes without knowing it."
- **I — Interface Segregation Principle**: "Clients should not be forced to depend upon interfaces that they do not use."
- **D — Dependency Inversion Principle**: "High level modules should not depend upon low level modules. Both should depend upon abstractions."

## Design Patterns — Creational

- **Factory Method** — מגדיר ממשק ליצירת אובייקט; מחלקה/תת-מחלקות מחליטות איזה טיפוס קונקרטי ליצור בזמן ריצה. `Executors` הוא Factory של `ExecutorService`.
- **Singleton** — מחלקה עם מופע יחיד וגישה גלובלית: בנאי `private`, שדה `static` פרטי, `getInstance()` סטטי ציבורי.

## Design Patterns — Structural

- **Bridge** — מפריד Abstraction מ-Implementation כך ששניהם מתפתחים באופן בלתי-תלוי (שני צירי שינוי).
- **Facade** — מחלקה אחת שמספקת ממשק פשוט המסתיר תת-מערכת מורכבת.
- **Adapter** — מתאים ממשק לממשק; **Class Adapter** (ירושה מרובה) מול **Object Adapter** (הכלה, גמיש יותר).
- **Decorator** — מוסיף התנהגות למופע בודד בזמן ריצה, ללא שינוי המחלקה המקורית וללא השפעה על מופעים אחרים.

## Design Patterns — Behavioral

- **Strategy** — מגדיר משפחת אלגוריתמים, אורז כל אחד, הופך אותם להחלפיים בזמן ריצה.
- **Observer (Publish-Subscribe)** — תלות "אחד-להרבה"; Subject משתנה → כל ה-Observers מתעדכנים אוטומטית. `java.util.Observable` הוא **class** (לא interface!).
- **Mediator** — מרכז תקשורת בין אובייקטים מרובים (Colleagues) דרך מתווך יחיד, מונע צימוד ישיר.
- **Command** — בקשה נעטפת כאובייקט, מועברת ל-Invoker שמפעילה על Receiver.

## Generics & Collections

- **Type Erasure** — בקומפילציה `List<Integer>`≠`List<String>`; בזמן ריצה שניהם `List<Object>`.
- **Autoboxing/Unboxing** — המרה אוטומטית פרימיטיב↔Wrapper (`int`↔`Integer`); פעולה יקרה.
- **equals() contract** — רפלקסיבי, סימטרי, טרנזיטיבי, עקבי, `x.equals(null)==false`.
- **hashCode() rule** — אם שני אובייקטים שווים לפי `equals()`, **חייבים** להחזיר אותו `hashCode()` (ההפך לא מחייב).
- **ArrayList** — מבוסס מערך; גישה אקראית O(1); הוספה/מחיקה מהאמצע O(n).
- **LinkedList** — מבוסס רשימה מקושרת; גישה אקראית O(n); הוספה/מחיקה מהקצוות O(1).
- **HashMap/HashSet** — מבוסס hash table; O(1) ממוצע; לא ממוין; דורש hashCode() תואם.
- **TreeMap/TreeSet** — מבוסס עץ מאוזן; O(log n); ממוין.

## Networking

- **Socket** — endpoint לתקשורת, מוגדר ע"י IP+Port.
- **TCP** — connection-oriented, אמין, מסודר (stream), ללא הגבלת גודל.
- **UDP** — connectionless, לא אמין, מוגבל ל-64KB לחבילה.
- **Port** — מספר positive 16-bit; 0-1023 שמורים (FTP=21, TELNET=23, SMTP=25, HTTP=80); משתמשים ≥1024.
- **Serialization** — המרת אובייקט לרצף בייטים לכתיבה/שליחה.
- **Deserialization** — שליפה/קריאה של נתונים מה-Stream לשחזור אובייקט.
- **transient** — שדה שלא נשמר/משוחזר בסריאליזציה; מקבל ערך ברירת מחדל (null/0/false) אחרי deserialization.

## Threads

- **Process** — מופע תוכנית בריצה, עם מרחב Data עצמאי; עשוי להכיל מספר Threads.
- **Thread** — הרצף הקטן ביותר של פקודות שניתן לנהל עצמאית ע"י Scheduler; חולק Heap עם threads אחרים באותו process, Stack פרטי משלו.
- **start()** — יוצר Thread חדש בפועל ומריץ בו את `run()`.
- **run()** — קריאה ישירה אליה היא **סינכרונית בלבד** — לא יוצרת thread חדש!
- **Daemon Thread** — thread שירות (כמו GC); JVM יוצא כשרק daemon threads נשארים.

## Thread Safety

- **Race Condition** — באג בו הפלט תלוי באופן בלתי-צפוי בתזמון/סדר threads מתחרים.
- **synchronized** — מבטיח שרק thread אחד מחזיק monitor על אובייקט בכל רגע.
- **volatile** — מבטיח **נראות (visibility)** בלבד — קריאה תמיד מ-Main Memory; **לא** מבטיח אטומיות.
- **Atomic Action** — פעולה שלא ניתן לקטוע; רוב הטיפוסים/הפניות אטומיים חוץ מ-`long`/`double`.
- **Deadlock** — 2+ threads לא מתקדמים כי כל אחד ממתין למשאב שהשני מחזיק.
- **Lock Starvation** — thread לעולם לא מקבל מנעול כי אחר מחזיק אותו לנצח (בד"כ בגלל synchronized שעוטף לולאה אינסופית שלמה).

## Concurrency Utilities

- **Callable<V>** — כמו `Runnable` אך `call()` מחזיר `V` וזורק `Exception`.
- **Future<V>** — מייצג תוצאה עתידית; `get()` חוסם עד לסיום; `cancel()` מבטל אם עוד לא הסתיים.
- **ExecutorService** — מנהל Thread Pool; `execute(Runnable)` ללא ערך חוזר; `submit(Callable/Runnable)` מחזיר `Future`.
- **shutdown()** — מחכה לסיום משימות קיימות, חוסם כניסת חדשות.
- **shutdownNow()** — עוצר הכל מיד, כולל רצות (interrupt).

## Event-Driven / JavaFX / MVC

- **Listener** — רשום למקור אירוע (Source), ממתין.
- **Handler** — מטפל בפועל באירוע (Event) שהתרחש.
- **JavaFX Hierarchy** — `Application → Stage → Scene → Layout/Pane → Node`.
- **MVC** — Model / View / Controller; Controller מנהל את שניהם ישירות.
- **MVVM** — Model / View / ViewModel; מבוסס Observer/Observable; Model אינו מודע ל-View/ViewModel.

## Blockchain

- **Blockchain** — יומן חשבונות דיגיטלי מבוזר וציבורי; כל Node ברשת מחזיק עותק.
- **Proof of Work** — הוכחת עבודה; תחרות חישובית פתוחה (Bitcoin).
- **Proof of Stake** — הוכחת החזקה; validator יחיד נבחר משוקלל לפי stake (Ethereum, Cardano).
