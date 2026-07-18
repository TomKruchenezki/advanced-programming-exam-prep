import { describe, it, expect } from 'vitest'
import { segmentBidiText } from './bidiSegment'
import questionsJson from '../data/questions.json'
import topicsJson from '../data/topics.json'
import studySectionsJson from '../data/studySections.json'
import type { Question, StudySection, Topic } from '../types/domain'

function reconstruct(input: string): string {
  return segmentBidiText(input)
    .map((s) => s.text)
    .join('')
}

function ltrTexts(input: string): string[] {
  return segmentBidiText(input)
    .filter((s) => s.isLtr)
    .map((s) => s.text)
}

describe('segmentBidiText', () => {
  it('never loses or alters characters - reconstruction always equals the original input', () => {
    const samples = [
      'JVM, JRE ו-JDK הם שלושה מונחים הקשורים לפלטפורמת Java',
      'Bytecode, javac וה-JVM: איך קוד Java הופך למכונה',
      'פלטפורמת Java: JVM, Bytecode, JIT ו-Heap/Stack',
      'רשתות: TCP/UDP, Sockets, זרמים (Streams) וסריאליזציה',
      'שדה transient String city = "Beer Sheva"',
      'String name = "Dudi" ו-city = "Beer Sheva"',
      'restoredUser.city ו-restoredUser.name',
      'משתמשים ב-Future<Integer> ו-List<? extends Number>',
      'תבנית Observer (Behavioral Pattern) שימושית',
      'האם זו התכונה הנכונה?',
      '',
      'טקסט עברי טהור ללא אנגלית כלל.',
      'English only, no Hebrew at all.',
    ]
    for (const s of samples) {
      expect(reconstruct(s)).toBe(s)
    }
  })

  it('1. heading containing JVM, JRE and JDK: each English run isolated, hyphen prefix stays with the Hebrew "and"', () => {
    const input = 'JVM, JRE ו-JDK הם שלושה מונחים חשובים'
    expect(ltrTexts(input)).toEqual(['JVM, JRE', '-JDK'])
    expect(reconstruct(input)).toBe(input)
  })

  it('2. "Bytecode, javac וה-JVM: איך קוד Java הופך למכונה" - colon stays attached to JVM, English runs stay internally ordered', () => {
    const input = 'Bytecode, javac וה-JVM: איך קוד Java הופך למכונה'
    const segs = segmentBidiText(input)
    expect(segs[0]).toEqual({ text: 'Bytecode, javac', isLtr: true })
    const jvmSeg = segs.find((s) => s.isLtr && s.text.includes('JVM'))
    expect(jvmSeg?.text).toBe('-JVM:')
    expect(segs.some((s) => s.isLtr && s.text === 'Java')).toBe(true)
    expect(reconstruct(input)).toBe(input)
  })

  it('3. "פלטפורמת Java: JVM, Bytecode, JIT ו-Heap/Stack" - multi-term English list stays one run where unbroken by Hebrew', () => {
    const input = 'פלטפורמת Java: JVM, Bytecode, JIT ו-Heap/Stack'
    const segs = segmentBidiText(input)
    expect(segs.some((s) => s.isLtr && s.text === 'Java: JVM, Bytecode, JIT')).toBe(true)
    expect(segs.some((s) => s.isLtr && s.text === '-Heap/Stack')).toBe(true)
    expect(reconstruct(input)).toBe(input)
  })

  it('4. "רשתות: TCP/UDP, Sockets, זרמים (Streams) וסריאליזציה" - colon+English list and parenthetical phrase isolated intact', () => {
    const input = 'רשתות: TCP/UDP, Sockets, זרמים (Streams) וסריאליזציה'
    const segs = segmentBidiText(input)
    expect(segs.some((s) => s.isLtr && s.text === ': TCP/UDP, Sockets,')).toBe(true)
    expect(segs.some((s) => s.isLtr && s.text === '(Streams)')).toBe(true)
    expect(reconstruct(input)).toBe(input)
  })

  it('5. quoted value "Beer Sheva" stays in one isolated fragment including its quote marks', () => {
    const input = 'שדה transient String city = "Beer Sheva"; ושדה נוסף'
    const segs = segmentBidiText(input)
    const quoted = segs.find((s) => s.isLtr && s.text.includes('"Beer Sheva"'))
    expect(quoted).toBeTruthy()
    expect(quoted!.text).toBe('transient String city = "Beer Sheva";')
    expect(reconstruct(input)).toBe(input)
  })

  it('6. two quoted values "Dudi" and "Beer Sheva" each stay intact with their quote marks', () => {
    const input = 'String name = "Dudi" ו-city = "Beer Sheva"'
    const segs = segmentBidiText(input)
    expect(segs.some((s) => s.isLtr && s.text === 'String name = "Dudi"')).toBe(true)
    expect(segs.some((s) => s.isLtr && s.text === '-city = "Beer Sheva"')).toBe(true)
    expect(reconstruct(input)).toBe(input)
  })

  it('7. "restoredUser.city ו-restoredUser.name" - both dotted identifiers stay intact', () => {
    const input = 'restoredUser.city ו-restoredUser.name'
    const segs = segmentBidiText(input)
    expect(segs.some((s) => s.isLtr && s.text === 'restoredUser.city')).toBe(true)
    expect(segs.some((s) => s.isLtr && s.text === '-restoredUser.name')).toBe(true)
    expect(reconstruct(input)).toBe(input)
  })

  it('8. "Future<Integer> ו-List<? extends Number>" - generic type expressions stay intact', () => {
    const input = 'Future<Integer> ו-List<? extends Number>'
    const segs = segmentBidiText(input)
    expect(segs.some((s) => s.isLtr && s.text === 'Future<Integer>')).toBe(true)
    expect(segs.some((s) => s.isLtr && s.text === '-List<? extends Number>')).toBe(true)
    expect(reconstruct(input)).toBe(input)
  })

  it('9. "Observer (Behavioral Pattern)" - English phrase with parentheses stays one isolated run', () => {
    const input = 'תבנית Observer (Behavioral Pattern) ידועה'
    const segs = segmentBidiText(input)
    expect(segs.some((s) => s.isLtr && s.text === 'Observer (Behavioral Pattern)')).toBe(true)
    expect(reconstruct(input)).toBe(input)
  })

  it('10. Hebrew question ending with a question mark - trailing "?" merges into the RTL segment, not isolated', () => {
    const input = 'מה השם של המחלקה?'
    const segs = segmentBidiText(input)
    expect(segs).toHaveLength(1)
    expect(segs[0]!.isLtr).toBe(false)
    expect(segs[0]!.text).toBe(input)
  })

  it('does not treat a pure-Hebrew sentence as LTR merely because it is short', () => {
    const input = 'זהו משפט עברי לגמרי.'
    const segs = segmentBidiText(input)
    expect(segs.every((s) => !s.isLtr)).toBe(true)
  })

  it('does not treat an entire Hebrew sentence as LTR merely because it contains several English words', () => {
    const input = 'אנחנו משתמשים ב-React וב-TypeScript כדי לבנות את האפליקציה שלנו בצורה טובה'
    const segs = segmentBidiText(input)
    // Most of the string must remain non-LTR; only the embedded English words are isolated.
    const ltrLength = segs.filter((s) => s.isLtr).reduce((sum, s) => sum + s.text.length, 0)
    expect(ltrLength).toBeLessThan(input.length / 2)
  })

  it('never produces a segment with empty text, and segments always alternate isLtr value', () => {
    const cases = [
      'JVM, JRE ו-JDK הם שלושה מונחים חשובים',
      'Bytecode, javac וה-JVM: איך קוד Java הופך למכונה',
      'מה השם של המחלקה?',
      'transient String city = "Beer Sheva"',
    ]
    for (const input of cases) {
      const segs = segmentBidiText(input)
      for (const seg of segs) expect(seg.text.length).toBeGreaterThan(0)
      for (let i = 1; i < segs.length; i++) expect(segs[i]!.isLtr).not.toBe(segs[i - 1]!.isLtr)
    }
  })
})

describe('segmentBidiText — technical expressions with operators stay one intact LTR unit (Part B)', () => {
  // Each case embeds one of the user-specified technical expressions (with its operators)
  // inside a full Hebrew sentence, and asserts the WHOLE expression - operators included -
  // survives as a single LTR segment in the original left-to-right order, not just the
  // individual Latin tokens (JDK / JRE / JVM) isolated separately with operators left outside.
  const cases: { name: string; input: string; expr: string }[] = [
    { name: 'containment ⊇ chain (JDK contains JRE contains JVM)', input: 'חשוב לזכור כי JDK ⊇ JRE ⊇ JVM תמיד', expr: 'JDK ⊇ JRE ⊇ JVM' },
    { name: 'containment ⊆ chain, reverse direction (JVM subset of JRE subset of JDK)', input: 'ניתן גם לכתוב JVM ⊆ JRE ⊆ JDK ולקבל אותה משמעות', expr: 'JVM ⊆ JRE ⊆ JDK' },
    { name: 'equality + addition with multiple terms (JDK = JRE + javac + development tools)', input: 'הכלל הוא כי JDK = JRE + javac + development tools בהגדרה', expr: 'JDK = JRE + javac + development tools' },
    { name: 'equality + addition (JVM = JRE + class libraries)', input: 'באופן דומה JVM = JRE + class libraries הוא לא נכון', expr: 'JVM = JRE + class libraries' },
    { name: 'arrow operator -> (source -> intermediate code)', input: 'התהליך הוא source -> intermediate code ולאחר מכן הרצה', expr: 'source -> intermediate code' },
    { name: 'double comparison with <= (0 <= port <= 65535)', input: 'התנאי התקין הוא 0 <= port <= 65535 לפי התקן', expr: '0 <= port <= 65535' },
    { name: 'field assignment to null (restoredUser.city = null)', input: 'לאחר הדה-סריאליזציה מתקיים restoredUser.city = null בגלל transient', expr: 'restoredUser.city = null' },
    { name: 'bounded wildcard generic (List<? extends Number>)', input: 'משתמשים בטיפוס List<? extends Number> כדי להגביל', expr: 'List<? extends Number>' },
    { name: 'nested generic (Map<String, List<Integer>>)', input: 'מבנה הנתונים הוא Map<String, List<Integer>> במקרה הזה', expr: 'Map<String, List<Integer>>' },
    { name: 'quoted string assignment (String name = "Dudi")', input: 'ההצהרה String name = "Dudi" יוצרת אובייקט חדש במאגר', expr: 'String name = "Dudi"' },
    { name: 'not-equal ≠ symbol', input: 'שימו לב כי JDK ≠ JRE מבחינת התוכן', expr: 'JDK ≠ JRE' },
    { name: 'less-than-or-equal ≤ and greater-than-or-equal ≥ symbols', input: 'מתקיים 1 ≤ x ≤ 10 בכל מקרה', expr: '1 ≤ x ≤ 10' },
    { name: 'element-of ∈ symbol', input: 'הערך x ∈ Set חייב להתקיים', expr: 'x ∈ Set' },
    { name: 'not-element-of ∉ symbol', input: 'הערך y ∉ Set הוא המקרה השני', expr: 'y ∉ Set' },
    { name: 'bidirectional arrow ↔ symbol', input: 'הקשר A ↔ B הוא הדדי', expr: 'A ↔ B' },
    { name: 'unicode arrow → symbol', input: 'המעבר Bytecode → machine code קורה ב-JIT', expr: 'Bytecode → machine code' },
    { name: 'ASCII fat arrow => (lambda-style)', input: 'התחביר x => x + 1 הוא lambda', expr: 'x => x + 1' },
    { name: 'boolean AND/OR operators (&& and ||)', input: 'התנאי a && b || c נבדק בסדר עדיפויות', expr: 'a && b || c' },
    { name: 'equality/inequality ASCII operators (== and !=)', input: 'ההשוואה a == b ו-a != c שונות מהותית', expr: 'a == b' },
    { name: 'strict subset/superset ⊂/⊃ symbols', input: 'הקבוצה A ⊂ B ⊃ C ממחישה את זה', expr: 'A ⊂ B ⊃ C' },
  ]

  for (const { name, input, expr } of cases) {
    it(`${name}: "${expr}" stays intact, in order, as one LTR segment`, () => {
      const segs = segmentBidiText(input)
      expect(reconstruct(input)).toBe(input)
      const exprSeg = segs.find((s) => s.isLtr && s.text === expr)
      expect(exprSeg).toBeTruthy()
    })
  }

  it('does not reverse containment order - JDK still appears before JRE before JVM textually', () => {
    const segs = segmentBidiText('חשוב לזכור כי JDK ⊇ JRE ⊇ JVM תמיד')
    const seg = segs.find((s) => s.isLtr && s.text.includes('⊇'))!
    expect(seg.text.indexOf('JDK')).toBeLessThan(seg.text.indexOf('JRE'))
    expect(seg.text.indexOf('JRE')).toBeLessThan(seg.text.indexOf('JVM'))
  })

  it('does not split the operator away from its operands into a separate segment', () => {
    const segs = segmentBidiText('התנאי התקין הוא 0 <= port <= 65535 לפי התקן')
    // The whole "0 <= port <= 65535" must be ONE segment - operators must never end up
    // isolated on their own, detached from the numbers/identifiers they relate.
    const ltrSegs = segs.filter((s) => s.isLtr)
    expect(ltrSegs).toHaveLength(1)
    expect(ltrSegs[0]!.text).toBe('0 <= port <= 65535')
  })
})

describe('segmentBidiText — bracket/quote pairs split by an interrupting Hebrew word (Part C)', () => {
  // Root cause: a delimiter run with no Latin/digit of its own (e.g. a trailing "),") was left
  // unisolated whenever a Hebrew word split it from the Latin content its matching opening
  // delimiter belongs to. Confirmed via real-browser character-position measurement against the
  // actual rendered "מבנה מחלקה וקובץ ב-Java" section - these are the two real strings that failed.
  it('real case 1: closing paren+comma split from "public class" by the Hebrew word "אחת" stays paired, not reordered', () => {
    const input = 'ציבורי אחד בלבד (public class אחת), ששמו חייב להיות זהה'
    const segs = segmentBidiText(input)
    expect(reconstruct(input)).toBe(input)
    // The trailing "),"  must be its own isolated LTR segment (not merged into Hebrew context).
    const closer = segs.find((s) => s.isLtr && s.text.includes(')'))
    expect(closer?.text).toBe('),')
  })

  it('real case 2: two adjacent parenthetical fragments separated by a Hebrew hyphenated term stay in source order', () => {
    const input = 'מבנה בסיסי: שם הקובץ (Hello.java) תואם בדיוק לשם המחלקה ה-public (Hello) (lec_1_2 סליידים 32-35)'
    expect(reconstruct(input)).toBe(input)
    const segs = segmentBidiText(input)
    const texts = segs.map((s) => s.text)
    // Each fragment must still appear as a distinct, correctly-ordered piece - not merged/scrambled.
    expect(texts).toContain('(Hello.java)')
    expect(texts.some((t) => t.includes('(Hello)') && t.includes('lec_1_2'))).toBe(true)
    expect(texts.some((t) => t === '32-35)')).toBe(true)
  })

  it('does NOT isolate quotes around a purely Hebrew quoted word (no Latin anywhere nearby)', () => {
    // ~111 occurrences of this pattern (Hebrew quoted/emphasized words) exist in the real data -
    // isolating them would create unnecessary spans for perfectly ordinary Hebrew prose.
    const input = "מה ש'מגיע' אל ה-JVM כדי שיעבד אותו הוא Bytecode"
    const segs = segmentBidiText(input)
    expect(reconstruct(input)).toBe(input)
    const quoteSegs = segs.filter((s) => s.isLtr && s.text.includes("'"))
    expect(quoteSegs).toHaveLength(0)
    // JVM and Bytecode themselves are still isolated as before.
    expect(segs.some((s) => s.isLtr && s.text === '-JVM')).toBe(true)
    expect(segs.some((s) => s.isLtr && s.text === 'Bytecode')).toBe(true)
  })

  it('does not isolate any punctuation in a purely Hebrew sentence with commas, periods, and a question mark', () => {
    const input = 'שלום, מה שלומך היום? אני מקווה שהכל בסדר, ושתהיה לך שבת שלום.'
    const segs = segmentBidiText(input)
    expect(reconstruct(input)).toBe(input)
    expect(segs.every((s) => !s.isLtr)).toBe(true)
  })

  it('does not isolate a plain Hebrew sentence-level dash separator', () => {
    const input = 'טעות נפוצה - יש להימנע ממנה בכל מחיר'
    const segs = segmentBidiText(input)
    expect(reconstruct(input)).toBe(input)
    expect(segs.every((s) => !s.isLtr)).toBe(true)
  })

  it('real case 3: backtick-quoted identifiers split across a Hebrew word stay paired (e.g. `OrderService`)', () => {
    const input = 'בקוד אמיתי שהופיע במבחן (2025, Q15): מחלקת `OrderService` שגם מבצעת לוגיקה עסקית (`placeOrder`) וגם יוצרת ומנהלת ישירות אובייקט `MySQLDatabase` בבנאי שלה'
    const segs = segmentBidiText(input)
    expect(reconstruct(input)).toBe(input)
    expect(segs.some((s) => s.isLtr && s.text === '`OrderService`')).toBe(true)
    expect(segs.some((s) => s.isLtr && s.text.includes('`placeOrder`'))).toBe(true)
  })

  it('real case 4: does not falsely pair Hebrew gershayim abbreviation marks (ע"י, בד"כ) across unrelated Latin content between them', () => {
    const input =
      'Socket מוגדר ברמת Transport layer (מודל OSI) ומיוצג ע"י כתובת IP + מספר Port. פורטים 0-1023 שמורים לשירותים ידועים (FTP=21). ברגע שמתקבל לקוח, ה-accept() מחזיר אובייקט Socket חדש (בד"כ עם פורט אחר)'
    const segs = segmentBidiText(input)
    expect(reconstruct(input)).toBe(input)
    // Neither gershayim mark should be isolated as part of a bogus quote-pair spanning the paragraph.
    const geshayimSegs = segs.filter((s) => s.isLtr && s.text === '"')
    expect(geshayimSegs).toHaveLength(0)
    // The real technical fragments around them must still be correctly isolated.
    expect(segs.some((s) => s.isLtr && s.text.includes('FTP=21'))).toBe(true)
    expect(segs.some((s) => s.isLtr && s.text.includes('accept()'))).toBe(true)
  })

  it('real case 5: a parenthetical gloss with purely Hebrew content still stays paired when it directly follows an English term (e.g. "DIP (תלות ישירה...)."', () => {
    const input = 'וגם DIP (תלות ישירה במימוש קונקרטי). שאלות מבחן על SOLID לעיתים מציגות תרשים כזה'
    const segs = segmentBidiText(input)
    expect(reconstruct(input)).toBe(input)
    const closer = segs.find((s) => s.isLtr && s.text.includes(')'))
    expect(closer?.text).toBe(').')
  })

  it('does NOT isolate a purely Hebrew parenthetical aside with no Latin content anywhere nearby', () => {
    const input = 'המשפט הזה (רק עברית בסוגריים) ממשיך הלאה בלי שום קשר לאנגלית'
    const segs = segmentBidiText(input)
    expect(reconstruct(input)).toBe(input)
    expect(segs.every((s) => !s.isLtr)).toBe(true)
  })

  it('handles nested parentheses correctly', () => {
    const input = 'תבנית Observer (Behavioral Pattern (חדש)) שימושית'
    const segs = segmentBidiText(input)
    expect(reconstruct(input)).toBe(input)
    const closer = segs.find((s) => s.isLtr && s.text.startsWith('))'))
    expect(closer).toBeTruthy()
  })

  it('does not crash and does not mark anything ltr-worthy for unbalanced/unmatched brackets', () => {
    const input = 'זהו משפט עם סוגר לא תואם ( באמצע המשפט העברי'
    expect(() => segmentBidiText(input)).not.toThrow()
    expect(reconstruct(input)).toBe(input)
  })

  it('the 293+ question stems, 16 topic titles, and 53 section headings still reconstruct exactly (no regression from the new pass)', () => {
    const questions = questionsJson as unknown as Question[]
    const topics = topicsJson as unknown as Topic[]
    const sections = studySectionsJson as unknown as StudySection[]
    for (const q of questions) expect(reconstruct(q.stemHe)).toBe(q.stemHe)
    for (const t of topics) expect(reconstruct(t.titleHe)).toBe(t.titleHe)
    for (const s of sections) expect(reconstruct(s.headingHe)).toBe(s.headingHe)
  })
})

describe('segmentBidiText — Markdown backtick inline-code stripping (Part D)', () => {
  it('real case: a whole backtick-delimited identifier gets displayText stripped of backticks and isInlineCode=true', () => {
    const input = 'מחלקת `OrderService` שגם מבצעת לוגיקה עסקית'
    expect(reconstruct(input)).toBe(input) // text (source) is completely untouched
    const segs = segmentBidiText(input)
    const codeSeg = segs.find((s) => s.text === '`OrderService`')
    expect(codeSeg).toBeTruthy()
    expect(codeSeg!.displayText).toBe('OrderService')
    expect(codeSeg!.isInlineCode).toBe(true)
  })

  it('real case: a backtick pair merged with surrounding parentheses still has backticks stripped from displayText, but isInlineCode is false (mixed content)', () => {
    const input = 'מחלקת OrderService שגם מבצעת לוגיקה עסקית (`placeOrder`) וגם'
    expect(reconstruct(input)).toBe(input)
    const segs = segmentBidiText(input)
    const seg = segs.find((s) => s.text === '(`placeOrder`)')
    expect(seg).toBeTruthy()
    expect(seg!.displayText).toBe('(placeOrder)')
    expect(seg!.isInlineCode).toBe(false)
  })

  it('multiple backtick-delimited identifiers in one sentence are each stripped independently', () => {
    const input = 'תלות ישירה במחלקה הקונקרטית `MySQLDatabase` במקום בממשק כמו `IDatabase`'
    expect(reconstruct(input)).toBe(input)
    const segs = segmentBidiText(input)
    const displayTexts = segs.filter((s) => s.isInlineCode).map((s) => s.displayText)
    expect(displayTexts).toEqual(['MySQLDatabase', 'IDatabase'])
  })

  it('a lone unmatched backtick is left completely untouched (no displayText, no crash)', () => {
    const input = 'זהו משפט עם תו בודד ` באמצע המשפט העברי'
    expect(() => segmentBidiText(input)).not.toThrow()
    expect(reconstruct(input)).toBe(input)
    const segs = segmentBidiText(input)
    expect(segs.some((s) => s.displayText)).toBe(false)
  })

  it('a string with no backticks at all has no displayText/isInlineCode on any segment', () => {
    const input = 'JVM (Java Virtual Machine) הוא מנוע ההרצה'
    const segs = segmentBidiText(input)
    expect(segs.every((s) => s.displayText === undefined && s.isInlineCode === undefined)).toBe(true)
  })
})

describe('segmentBidiText — regression sweep over the real data set', () => {
  const questions = questionsJson as unknown as Question[]
  const topics = topicsJson as unknown as Topic[]
  const sections = studySectionsJson as unknown as StudySection[]

  it('reconstructs every real question stem exactly (293+ questions)', () => {
    for (const q of questions) {
      expect(reconstruct(q.stemHe)).toBe(q.stemHe)
    }
  })

  it('reconstructs every real topic title and summary exactly (16 topics)', () => {
    for (const t of topics) {
      expect(reconstruct(t.titleHe)).toBe(t.titleHe)
      expect(reconstruct(t.summary)).toBe(t.summary)
    }
  })

  it('reconstructs every real study section heading exactly (53 sections)', () => {
    for (const s of sections) {
      expect(reconstruct(s.headingHe)).toBe(s.headingHe)
    }
  })
})
