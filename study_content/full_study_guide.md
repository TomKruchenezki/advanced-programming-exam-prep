# מדריך לימוד מקיף — נושאים מתקדמים בתכנות
### ד"ר דודי בן שמעון, BGU | מבוסס על 10 הרצאות רשמיות, 11 מעבדות, ו-4 מבחנים אמיתיים מאושרים (2018/2019/2024/2025)

מסמך זה בנוי לקריאה מהתחלה לסוף לפי סדר הוראה. לכל נושא: הגדרה מדויקת, דוגמת קוד אמיתית (מהמעבדות בפועל), והמלכודות שבאמת נבדקו במבחנים.

---

## חלק 1 — יסודות Java והפלטפורמה

### 1.1 JVM, Bytecode, JIT

Java מהודרת (`javac`) לשפת ביניים בשם **Bytecode** (קובץ `.class`), לא לשפת מכונה ישירות. **JVM** (Java Virtual Machine) קורא את ה-Bytecode שורה-שורה ומתרגם אותו לשפת המכונה של מערכת ההפעלה הספציפית. זה **מדויק** מה שהופך את Java ל-cross-platform: ה-Bytecode עצמו אוניברסלי, ה-JVM הוא זה שתלוי-פלטפורמה (יש JVM נפרד לכל OS, אבל אותו bytecode רץ על כולם).

**JIT** (Just-In-Time Compiler) הוא רכיב *בתוך* ה-JVM. כשקוד רץ הרבה פעמים (hot code — למשל לולאה עם 1000 איטרציות), במקום לפרש כל שורה בכל פעם מחדש, ה-JIT מקמפל את הקוד הזה ישירות לקוד מכונה נייטיבי ומריץ אותו. זה חוסך את ה"תשלום" של אינטרפרטציה חוזרת. ה-JIT יכול גם לבצע אופטימיזציות כמו inlining על סמך מידע דינמי מזמן הריצה — יתרון על פני קומפיילר מסורתי (כמו ב-C) שמקמפל הכל מראש לפני שהתוכנית רצה בכלל.

> **שגיאה נפוצה:** לחשוב ש-JIT הוא זה שהופך Java ל-Bytecode. זה תפקידו של `javac`. ה-JIT ממיר *חלק* מה-Bytecode הקיים למכונה, בזמן ריצה.

Java, אגב, היא **גם מהדר וגם אינטרפרטר** — javac מהדר, ה-JVM מפרש.

**JDK** = JRE + כלי פיתוח (javac, jdb). **JRE** = JVM + ספריות מחלקה סטנדרטיות. **JVM** = מנוע ההרצה בלבד.

### 1.2 Heap מול Stack

ה-**Heap** הוא אזור זיכרון גדול משותף לכל האובייקטים והמחלקות ב-JRE. אספן הזבל (**Garbage Collector**, GC) מנקה אובייקטים שאין אליהם יותר הפניות. אפשר "להזמין" ניקוי עם `System.gc()` אבל לא לאלץ אותו. כשה-Heap מתמלא — `java.lang.OutOfMemoryError` (מוגדל ב-`-Xms`/`-Xmx`). כל מחלקה יכולה לדרוס `finalize()` — נקראת כשה-GC משחרר את האובייקט, אבל אין למתכנת שליטה מדויקת מתי זה קורה (אלא אם קוראים לה ישירות).

ה-**Stack** קטן יותר, אישי לכל Thread — מכיל משתנים מקומיים (פרימיטיביים) והפניות לאובייקטים ב-Heap. מנוקה בשיטת **LIFO**. כשהוא מתמלא (בד"כ מרקורסיה אינסופית) — `java.lang.StackOverflowError` (מוגדל ב-`-Xss`).

### 1.3 Pass-by-Value

Java היא **תמיד** Pass-by-Value, גם כשמעבירים אובייקטים. כשמעבירים אובייקט, מה שמועבר הוא *עותק של ערך ההפניה* (הכתובת בזיכרון), לא ההפניה עצמה ולא האובייקט. לכן:

```java
public static void main(String[] args) {
    Dog aDog = new Dog("Max");
    foo(aDog);
    aDog.getName().equals("Fifi"); // true - שינוי שדה משפיע על האובייקט המקורי
}
public static void foo(Dog d) {
    d.setName("Fifi"); // d ו-aDog מצביעים לאותו אובייקט ב-Heap
}
```

אבל אם בתוך `foo` היינו כותבים `d = new Dog("Fifi");` — זה רק היה מחליף את העותק המקומי של ההפניה, ולא היה משפיע על `aDog` בחוץ כלל.

---

## חלק 2 — עקרונות OOP ו-UML

### 2.1 ארבעת העקרונות

- **Encapsulation** (כימוס) — אריזת מצב והתנהגות יחד, הסתרת מימוש פנימי (`private` + גישה דרך `public` methods).
- **Inheritance** (ירושה) — `extends`, מונע שכפול קוד, בונה היררכיה.
- **Polymorphism** (פולימורפיזם) — אובייקט "לובש" זהויות שונות (Circle הוא גם Shape וגם Object).
- **Abstraction** — תכנות טיפוסים (types), לא מופעים ספציפיים.

### 2.2 Abstract Class מול Interface

מחלקה עם מתודה **אחת** מסומנת `abstract` הופכת **כל המחלקה** למופשטת — לא ניתן ליצור ממנה מופע (`new`). רק תת-מחלקה **קונקרטית** שמימשה את כל המתודות האבסטרקטיות ניתנת ליצירה.

השתמשו במחלקה אבסטרקטית כש: המחלקות קשורות זו לזו הדוקות, רוצים לשתף קוד/שדות לא-סטטיים, וצריך `protected`/`private`.
השתמשו בממשק כש: המחלקות לא-קשורות (למשל `Comparable`, `Cloneable`), רוצים "ריבוי ירושה" של טיפוס (Java מאפשרת `implements` מרובה אך `extends` יחיד בלבד), או רק מגדירים חוזה בלי state. מ-Java 8: אפשר `default` methods בממשק.

**מלכודת:** Overriding = פולימורפיזם ב-**runtime** (dynamic binding). Overloading = פולימורפיזם ב-**compile-time** (static binding). שאלה: "מה מבין הבאים אינה polymorphism בזמן קומפילציה?" → התשובה: Overriding.

### 2.3 UML: קשרים בין מחלקות

| קשר | סימון | משמעות |
|---|---|---|
| Association | חץ רגיל, עם Multiplicity | קשר כללי בין מחלקות |
| Aggregation | יהלום ריק | הכלה חלשה — החלק יכול להתקיים בלי המכיל (מכונית-דלת) |
| Composition | יהלום מלא | הכלה חזקה — החלק תלוי בקיום המכיל (מצולע-נקודות) |
| Generalization | חץ משולש ריק, קו רציף | ירושה |
| Realization | חץ משולש ריק, קו מקווקו | מימוש ממשק |

Multiplicity: `1` (בדיוק אחד), `*`/`0..*` (אפס-או-יותר), `1..*` (אחד-או-יותר), `0..1` (אפס-או-אחד).

---

## חלק 3 — מסיפור לקוד: הפרדת אלגוריתם מבעיה (הרצאה 3)

בעיות רבות (מבוך, פאזל-8, תכנון מסלול) הן בעצם **בעיות חיפוש במרחב-מצבים** (State-Space Search): מוגדרות ע"י **State Space**, **Start State**, **Goal Test**, ו-**Successor Function** (מחזירה שכנים ועלותם).

כדי לא לצמוד אלגוריתם (BFS) לבעיה ספציפית (מבוך), מגדירים **שני ממשקים**: `ISearchable` (חוזה מול הבעיה) ו-`ISearcher` (חוזה מול האלגוריתם), עם `BaseSearcher` אבסטרקטי משותף למניעת שכפול קוד בניהול open/closed lists. הארכיטקטורה הזו — שתי היררכיות עצמאיות המחוברות דרך ממשקים — היא בעצם מימוש טבעי של תבנית **Bridge**.

**כלל זהב:** אל תדלגו על שלב תרשים המחלקות ולא תקפצו ישר לפיתוח — זה מוביל ל"קוד ספגטי".

---

## חלק 4 — SOLID

| אות | שם | ההגדרה המדויקת (למבחן) | דוגמה |
|---|---|---|---|
| **S** | Single Responsibility | "There should never be more than one reason for a class to change" | Modem עם connect+data → פצל ל-2 ממשקים |
| **O** | Open Closed | "Open for extension, closed for modification" | GraphicEditor עם if-else → `Shape.draw()` |
| **L** | Liskov Substitution | "Functions using base-class pointers must be able to use derived-class objects without knowing it" | **Square extends Rectangle** |
| **I** | Interface Segregation | "Clients should not be forced to depend upon interfaces they do not use" | Mammal(eat+walkOnLand) → Whale לא הולך |
| **D** | Dependency Inversion | "High-level modules should not depend on low-level modules; both depend on abstractions" | OrderService תלוי ב-MySQLDatabase ישירות |

**דוגמת קוד אמיתית ממבחן 2025 (מאושר 100/100):**

```java
class MySQLDatabase {
    public void saveOrder(String order){ System.out.println("Saving order to MySQL: "+order); }
}
class OrderService {
    private MySQLDatabase database = new MySQLDatabase(); // תלות ישירה — הפרת D!
    public void placeOrder(String order){ database.saveOrder(order); }
}
```

**מלכודות קריטיות:**
1. Factory Design Pattern **אינו** פוגע בשום עיקרון SOLID — הוא דווקא **תומך** ב-OCP. (נבדק ב-2023: "איזה עיקרון סוליד נפגע ב-factory dp" → "factory אינו פוגע").
2. "ריבוע יורש ממלבן" הוא **תמיד** שאלת L (Liskov), למרות שאינטואיטיבית זה "נראה" כמו יחס is-a תקין גיאומטרית.
3. תשובות משולבות ("ג+ד") מופיעות בפועל במבחנים אמיתיים — אל תניחו שרק תשובה בודדת נכונה.

---

## חלק 5 — תבניות עיצוב (Design Patterns)

Gang of Four מחלקים ל-3 משפחות: **Creational** (יצירה), **Structural** (מבנית), **Behavioral** (התנהגותית). כלל שימוש: הבעיה קודמת, ורק אז מתאימים תבנית — לא מחפשים בכוח איפה לדחוף תבנית. סימנים לצורך בתבנית: הרבה if-else/switch, לוגיקה מורכבת חוזרת, קושי בכתיבת טסטים.

### 5.1 Creational: Factory, Singleton

**Factory Method** — מגדיר ממשק ליצירת אובייקט, מאפשר למחלקה (או תת-מחלקות) להחליט איזו מחלקה קונקרטית ליצור בזמן ריצה. פותר בעיית if-else מרובה; תומך ב-OCP. **`Executors.newFixedThreadPool()` הוא בעצמו Factory** שיוצר `ExecutorService` (מאושר במבחן 2025: Q12).

**Singleton** — מחלקה עם מופע יחיד וגישה גלובלית. מימוש: בנאי `private`, שדה `static` פרטי, מתודה `static` ציבורית (`getInstance()`):

```java
public class TaskManager {
    private static TaskManager instance = null;
    private TaskManager() { ... } // private!
    public static TaskManager getInstance(){
        if(instance == null){ instance = new TaskManager(); }
        return instance;
    }
}
```

⚠️ המימוש הזה **אינו Thread-Safe**! שני threads יכולים לעבור את `if(instance==null)` בו-זמנית לפני שהראשון סיים ליצור מופע → שני מופעים. פתרונות: `synchronized` על המתודה (פוגע בביצועים), double-checked locking, או Bill Pugh Singleton (static holder class).

### 5.2 Structural: Bridge, Facade, Adapter, Decorator

**Bridge** — מפריד Abstraction מ-Implementation כך ששניהם מתפתחים עצמאית. פותר "התפוצצות מחלקות" כשיש שני צירי שינוי (למשל Calculator x CalculatorEngine, או ThreadScheduler x OS). **הדוגמה החוזרת ביותר במבחנים** (2018/2019/2024): תרשים עם `ThreadScheduler → {PreemptiveThreadScheduler → UnixPTS/WindowsPTS}, {TimeSlicedThreadScheduler → UnixTSTS/WindowsTSTS}` — התשובה המאושרת (2024, 100% ודאות): **Bridge**.

**Facade** — מחלקה יחידה מסתירה מורכבות תת-מערכת (דוגמת ATM: welcome + accountChecker + codeChecker + fundsChecker מאחורי חזית אחת).

**Adapter** — מתרגם ממשק לממשק:
- *Class Adapter* — יורש גם מהמחלקה המקורית וגם מהממשק היעד (ירושה מרובה).
- *Object Adapter* — מכיל מופע של המחלקה המקורית (Composition), גמיש יותר (מתאים לכל תת-מחלקה).

```java
// Object Adapter אמיתי מהמעבדה
public class WorkerSorterTask implements ITask{
    private IWorkerSorter mySorter;
    private Worker[] workers;
    public void doTask() { mySorter.sort(workers); }
}
```

**Decorator** — מוסיף התנהגות למופע *בודד* בזמן ריצה, בלי לשנות את המחלקה המקורית ובלי להשפיע על מופעים אחרים:

```java
public abstract class IcecreamDecorator implements Icecream {
    protected Icecream specialIcecream;
    public IcecreamDecorator(Icecream i) { this.specialIcecream = i; }
    public String makeIcecream() { return specialIcecream.makeIcecream(); }
}
public class NuttyDecorator extends IcecreamDecorator {
    public String makeIcecream() { return specialIcecream.makeIcecream() + " + nuts"; }
}
// new HoneyDecorator(new NuttyDecorator(new SimpleIcecream())).makeIcecream()
```

**Bridge מול Strategy** (מלכודת מבנית קלאסית): שתיהן משתמשות ב-Composition ונראות דומות בקוד, אך Bridge היא Structural (מפריד מימוש מאבסטרקציה, הלקוח לרוב לא בוחר במפורש), Strategy היא Behavioral (בוחרים אלגוריתם בזמן ריצה, הלקוח מודע ובוחר במפורש).

### 5.3 Behavioral: Strategy, Observer, Mediator, Command

**Strategy** — משפחת אלגוריתמים חליפיים. דוגמה אמיתית: מיון עובדים לפי שם/גיל/משכורת עם `IWorkerComparator` שונים המוזרקים ל-`BubbleWorkerSorter`.

**Observer** (Publish-Subscribe) — Subject משתנה → כל Observers הרשומים מתעדכנים אוטומטית. `java.util.Observable` הוא **class, לא interface** — מגביל כי Java לא תומכת בירושה מרובה (מוזכר במפורש בהרצאות).

⚠️ **שאלת המבחן החוזרת בעקביות מוחלטת:** "מה מהבאים *אינו* נכון בתבנית Observer?" → התשובה השגויה (=זו שהיא הנכונה לשאלה) היא תמיד: **"ה-Observable חייב להיות מודע למחלקות הקונקרטיות של ה-Observers"** — זה שגוי; הקשר ביניהם אבסטרקטי (דרך ממשק Observer בלבד).

**Mediator** — מרכז תקשורת בין אובייקטים מרובים (Colleagues) דרך מתווך יחיד, מונע צימוד ישיר. Mediator מול Adapter: Adapter מחבר קוד קיים; Mediator מתכנן ארכיטקטורה חדשה. **Thread Pool ממומש בשילוב Mediator+Command יחד.**

**Command** — בקשה עטופה כאובייקט, מועברת ל-Invoker שמפעיל אותה על Receiver (דוגמת שלט טלוויזיה: TurnOnCommand/TurnOffCommand).

---

## חלק 6 — Generics, Collections, equals/hashCode

Generics מקבלים רק **Object types** (לא primitives) — צריך Wrapper classes (`Pair<Integer,Integer>` לא `Pair<int,int>`). **Type Erasure**: בקומפילציה `List<Integer>`≠`List<String>`, אך בזמן ריצה שניהם `List<Object>` — לא ניתן להגדיר שתי מתודות עם אותו שם שנבדלות רק בטיפוס הגנרי.

### השאלה החוזרת בכל מבחן שנבדק (2018/2019/2024) — "בדיחת ה-Generic Stack"

```java
public class GenericStack<E>{
    Stack<E> stk = new Stack<E>();
    public void push(E obj){ stk.push(obj); }
    public E pop(){ return stk.pop(); }
}
GenericStack<String> gs = new GenericStack<>();
gs.push("Rusia");
System.out.print(gs.pop() + " ");        // Rusia
GenericStack<Integer> gs2 = new GenericStack<>();
gs2.push(2018);
System.out.print(gs2.pop());              // 2018
// Output: Rusia 2018  — אין שגיאת קומפילציה או ריצה!
```

זהו למעשה **שני מופעים גנריים נפרדים לגמרי** (`GenericStack<String>` ו-`GenericStack<Integer>`) — אין שום קונפליקט. מופיע עם שינויים קוסמטיים בלבד (מדינה/שנה) ב-2018, 2019, ו-2024 (עם Germany/2024 במקום Russia/2018).

### equals ו-hashCode

חוזה `equals()`: רפלקסיבי, סימטרי, טרנזיטיבי, עקבי, ו-`x.equals(null)==false` תמיד. **חוק ברזל:** אם דורסים `equals()` **חובה** לדרוס גם `hashCode()` — שני אובייקטים השווים לפי `equals()` **חייבים** להחזיר את אותו `hashCode()` (ההפך לא מחייב — collisions מותרים אך פוגעים ביעילות).

⚠️ **מלכודת שחוזרת בעקביות:** "עשיתי override ל-equals ולא דרסתי hashcode — מה נכון?" — התשובה השגויה: "זה בכלל לא אפשרי, שגיאת הידור". **התשובה הנכונה:** זה מותר קומפילטיבית (!), אבל יגרום לבעיות לוגיות שקטות באוספים מבוססי-hash (`HashMap`/`HashSet`) — אובייקטים "זהים לוגית" עלולים להיכנס לדליים שונים.

### מלכודות String/Integer

```java
String s1 = new String("moshe");
String s2 = new String("moshe");
String s3 = "moshe";
String s4 = "moshe";
s1 == s2  // false - שני אובייקטים נפרדים ב-Heap
s3 == s4  // true - שני literals משותפים מה-String Pool
```

```java
Integer a1 = 5;
Integer a2 = 5;
a1 == a2  // true - Integer caching (-128 עד 127)
```

---

## חלק 7 — רשתות: Sockets, TCP/UDP, Streams, סריאליזציה

**Socket** = endpoint לתקשורת, מוגדר ע"י **IP + Port** (16-bit; 0-1023 שמורים; משתמשים ≥1024). **TCP** — connection-oriented, אמין, מסודר (stream), ללא הגבלת גודל ("שיחת טלפון"). **UDP** — connectionless, לא אמין, עד 64KB לחבילה ("דואר").

`ServerSocket.accept()` **חוסם** עד שמגיע לקוח. אם יוצרים `ServerSocket`+`Socket` לקוח באותו `main` בלי Threads: אם השרת נוצר ראשון (וקורא ל-`accept`), התוכנית תיתקע לפני שמגיעים ליצירת הלקוח; אם הלקוח נוצר ראשון, הוא ינסה להתחבר לשרת שעדיין לא מאזין → שגיאה. **שתי הבעיות קיימות בו-זמנית** (תשובה משולבת נפוצה).

**פורט תפוס** → תמיד: תיזרק שגיאה שהפורט תפוס (BindException) — לא המתנה, לא הרמוניה.

`InputStream`/`OutputStream` מספקים **שיטות לקריאה וכתיבה** מעל ה-sockets (לא מייצרים סוקטים, לא ממסדים חיבור).

**Serialization** = כתיבת אובייקט כרצף בייטים. **Deserialization** = **שליפה/קריאה** של נתונים מה-Stream לשחזור אובייקט. שדות `transient` **לא** נשמרים ולא משוחזרים (מקבלים ערך ברירת מחדל — `null`/`0`/`false`):

```java
class User implements Serializable {
    private String username;   // נשמר ומשוחזר
    public String password;    // נשמר ומשוחזר
    transient CreditCard creditCard; // NOT restored!
    transient String city;           // NOT restored!
}
```

---

## חלק 8 — Threads, בטיחות תהליכונים, וכלי java.util.concurrent

### 8.1 יסודות

**Process** — מרחב Data עצמאי. **Thread** — הרצף הקטן ביותר שניתן לנהל ע"י Scheduler; threads באותו process חולקים Heap אך לכל אחד Stack פרטי. שתי דרכי יצירה: `extends Thread` (דורס `run()`) או `implements Runnable` (מעביר ל-`new Thread(runnable)`).

**חוק ברזל:** לעולם אל תקראו ל-`run()` ישירות! זה פשוט מריץ קוד רגיל וסינכרוני. תמיד `start()` — זה יוצר thread חדש בפועל.

```java
public class Test extends Thread implements Runnable {
    public void run() { System.out.print("GFG "); }
    public static void main(String[] args) throws InterruptedException {
        Test obj = new Test();
        obj.run();   // סינכרוני - מדפיס GFG מיד
        obj.start(); // thread חדש - גם קורא ל-run(), מדפיס GFG שוב
    }
}
// Output: GFG GFG  (חוזר ב-2018/2019/2024!)
```

מחזור חיים: **Runnable** (ready, בתור) → **Running** → **Blocked** (IO/lock/sleep) → **Dead** (לא ניתן להפעיל שוב — `IllegalThreadStateException`).

### 8.2 בטיחות תהליכונים

`counter++` **אינו אטומי** — 3 פעולות נפרדות (קריאה, הוספה, כתיבה) → race condition אם כמה threads מריצים זאת בו-זמנית.

`synchronized` — רק thread אחד יכול להחזיק את ה-monitor של אובייקט בכל רגע נתון. ניתן לסנכרן מתודה שלמה (המנעול הוא `this`) או בלוק ספציפי (יעיל יותר).

⚠️ **המלכודת החשובה ביותר בכל הקורס:** `volatile` מבטיח **נראות (visibility)** בלבד — קריאה תמיד מ-Main Memory, לא cache מקומי. `volatile` **אינו** מבטיח **אטומיות** (atomicity)! `counter++` על משתנה `volatile` עדיין **לא** thread-safe.

**Deadlock** — שני threads (או יותר) לא מתקדמים כי כל אחד ממתין למשאב שהשני מחזיק (לא "thread שסיים ונעל").

**Lock Starvation** — נעילת `synchronized` שעוטפת לולאת `while(true)` שלמה מונעת מ-`stop()` לגשת למנעול לנצח. **פתרון (כלל הברזל): החזק מנעולים לזמן הקצר ביותר האפשרי** — הכניסו רק את הבדיקה `if(done) break;` לתוך הלולאה בבלוק מסונכרן קצר.

**Atomic Actions:** קריאה/כתיבה של רוב הטיפוסים אטומית מטבעה, **חוץ מ**-`long` ו-`double` (64-bit, מטופלים כשני חצאים 32-bit). `java.util.concurrent.atomic.AtomicInteger.incrementAndGet()` — פתרון יעיל יותר מ-synchronized לפעולה פשוטה כמו increment.

### 8.3 Callable, Future, ExecutorService

`Callable<V>` — כמו `Runnable` אך `call()` מחזיר `V` וזורק `Exception`. `Future<V>` — מייצג תוצאה עתידית; `get()` **חוסם** עד שהחישוב מסתיים; `cancel()` מבטל (אם עוד לא הסתיים).

`execute(Runnable)` — אין ערך חוזר. `submit(Callable/Runnable)` — מחזיר `Future`.

**מאושר במבחן 2025 (100/100):** היתרון המרכזי ב-`ExecutorService`+`Future` על פני יצירת Thread חדש לכל משימה: **"מאפשר ניהול מאגר קבוע של תהליכונים, שליחת משימות אליו, וקבלת תוצאה מהמשימות"**.

`shutdown()` — מחכה לסיום משימות קיימות, מונע כניסת חדשות. `shutdownNow()` — עוצר הכל מיד (גם רצות, עם interrupt).

---

## חלק 9 — תכנות מונחה-אירועים, JavaFX, MVC/MVVM

**Event-Driven Programming:** זרימת התוכנית נקבעת ע"י אירועים (לחיצות, הודעות threads), לא סדר קבוע מראש — הכרחי ל-GUI ולשרתים.

**Listener** — רשום (subscribe) למקור אירוע (Source), מקשיב. **Handler** — מטפל בפועל באירוע (Event) שקרה.

**היסטוריית GUI:** AWT (1995, native לכל OS) → Swing (1998, ציור עצמי, dead-end כיום) → SWT (2001, IBM, DI בין JAR-ים) → **JavaFX** (2008, המודרני/הרשמי).

**עקרון ברזל:** GUI רץ ב-Thread נפרד מ-Main. אסור להריץ חישובים כבדים/רשת/DB על ה-GUI Thread — המסך "יקפא" (Not Responding).

**היררכיית JavaFX (חובה לשנן):** `Application → Stage (חלון) → Scene (עץ תוכן) → Layout/Pane → Node (אלמנטים)`.

**MVC מול MVVM** — 4 הבדלים:
1. **תלויות:** MVC — Controller מכיל Model+View. MVVM — View מכיל ViewModel, ViewModel מכיל Model; Model אינו מודע לשניים.
2. **המתווך:** MVC — Controller מנהל את שניהם ישירות. MVVM — ViewModel רק מעביר נתונים ומוודא תקינות.
3. **תקשורת:** MVC — Controller מקבל אירוע ומטפל ישירות. MVVM — View מקבל אירוע → קורא ל-ViewModel וממתין להתראה → ViewModel קורא ל-Model וממתין להתראה → שרשרת notify חוזרת.
4. **ירושה:** MVVM מבוסס Observer/Observable — Model=Observable בלבד; ViewModel=Observable+Observer; View=Observer בלבד.

---

## חלק 10 — בלוקצ'יין ומטבעות קריפטוגרפיים (הרצאה 12)

**Blockchain** — יומן חשבונות דיגיטלי, מבוזר וציבורי; כל Node ברשת מחזיק עותק. **Mining** — פתרון בעיות hash מורכבות ליצירת בלוק חדש, תמורת פרס.

**Proof of Work** (Bitcoin) — כל הכורים מתחרים לפתור חידה בכוח; הראשון מקבל פרס; שאר הרשת (>50%) מאמתת. בזבזני-אנרגיה. **Proof of Stake** (Ethereum, Cardano) — validator יחיד נבחר באקראי משוקלל לפי כמות ה-stake; חסכוני יותר.

**Wallet** שומר **private key** בלבד — המטבעות עצמם רשומים על הבלוקצ'יין, לא "נשמרים" בארנק.

*(נושא זה לא נמצא בפועל באף שאלת מבחן אמיתית שנבדקה — משקל נמוך יחסית לשאר החומר.)*

---

## סיכום: 10 העובדות שהכי משתלם לשנן ברגע האחרון

1. Cross-platform = **JVM** (לעולם לא JavaFX).
2. JIT מתרגם **חלק** מה-bytecode למכונה **בזמן ריצה** — לא הופך java ל-bytecode (זה javac).
3. GenericStack<String> ואז GenericStack<Integer> נפרד = **אין שגיאה**, שני stacks עצמאיים.
4. Square extends Rectangle = **תמיד** הפרת **L**iskov.
5. Factory **אינו** מפר שום עיקרון SOLID.
6. Observer: ה-Observable **אינו** צריך להכיר את המחלקות הקונקרטיות של ה-Observers.
7. `volatile` = נראות בלבד, **לא** אטומיות.
8. `run()` לעולם לא במקום `start()` — obj.run()+obj.start() = הדפסה **כפולה**.
9. equals() בלי hashCode() = **לא שגיאת קומפילציה**, רק באג לוגי ב-hash collections.
10. ThreadScheduler עם 2 צירי שינוי (מדיניות x OS) = **Bridge**.
