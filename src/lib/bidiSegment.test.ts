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
