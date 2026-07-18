import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BidiText, BidiSegments } from './BidiText'

describe('BidiText', () => {
  it('renders the outer element with dir="rtl", never dir="auto"', () => {
    const { container } = render(<BidiText as="h2" text="Bytecode, javac וה-JVM: איך קוד Java הופך למכונה" />)
    const h2 = container.querySelector('h2')!
    expect(h2.getAttribute('dir')).toBe('rtl')
    expect(h2.getAttribute('dir')).not.toBe('auto')
  })

  it('applies physical text-right alignment, not the logical text-start', () => {
    const { container } = render(<BidiText as="p" text="שלום" className="text-body-lg" />)
    const p = container.querySelector('p')!
    expect(p.className).toContain('text-right')
    expect(p.className).not.toContain('text-start')
  })

  it('preserves the caller-supplied typography className alongside text-right', () => {
    const { container } = render(<BidiText as="h2" text="כותרת" className="text-section-title font-bold" />)
    const h2 = container.querySelector('h2')!
    expect(h2.className).toContain('text-section-title')
    expect(h2.className).toContain('font-bold')
    expect(h2.className).toContain('text-right')
  })

  it('sets aria-label to the exact, unmodified original source string', () => {
    const text = 'Bytecode, javac וה-JVM: איך קוד Java הופך למכונה'
    const { container } = render(<BidiText as="h2" text={text} />)
    const h2 = container.querySelector('h2')!
    expect(h2.getAttribute('aria-label')).toBe(text)
  })

  it('renders every LTR fragment isolated via the existing Ltr component (span.ltr-inline)', () => {
    const { container } = render(<BidiText as="p" text='transient String city = "Beer Sheva"; ושדה נוסף' />)
    const isolated = container.querySelectorAll('span.ltr-inline')
    expect(isolated.length).toBeGreaterThan(0)
    expect(isolated[0]!.textContent).toBe('transient String city = "Beer Sheva";')
  })

  it('preserves heading tag semantics (h1 stays h1, h3 stays h3)', () => {
    const { container: c1 } = render(<BidiText as="h1" text="כותרת ראשית" />)
    expect(c1.querySelector('h1')).toBeTruthy()
    const { container: c3 } = render(<BidiText as="h3" text="כותרת משנית" />)
    expect(c3.querySelector('h3')).toBeTruthy()
  })

  it('never loses or reorders characters - full textContent equals the original string', () => {
    const text = 'רשתות: TCP/UDP, Sockets, זרמים (Streams) וסריאליזציה'
    const { container } = render(<BidiText as="h2" text={text} />)
    expect(container.querySelector('h2')!.textContent).toBe(text)
  })

  it('renders a pure-Hebrew string with no isolated fragments at all', () => {
    const { container } = render(<BidiText as="p" text="זהו משפט עברי לגמרי." />)
    expect(container.querySelectorAll('span.ltr-inline')).toHaveLength(0)
    expect(container.querySelector('p')!.textContent).toBe('זהו משפט עברי לגמרי.')
  })

  it('strips raw Markdown backticks from the visible text while keeping the full original source in aria-label', () => {
    const text = 'מחלקת `OrderService` שגם מבצעת לוגיקה עסקית'
    const { container } = render(<BidiText as="p" text={text} />)
    const p = container.querySelector('p')!
    // The visible text must never contain a literal backtick character.
    expect(p.textContent).not.toContain('`')
    expect(p.textContent).toBe('מחלקת OrderService שגם מבצעת לוגיקה עסקית')
    // aria-label still carries the exact, unmodified original (backticks included) - proving
    // the underlying source string was never touched, only the display.
    expect(p.getAttribute('aria-label')).toBe(text)
  })

  it('renders a whole backtick-delimited term as an isolated inline-code element', () => {
    const { container } = render(<BidiText as="p" text="מחלקת `OrderService` שגם מבצעת" />)
    const code = container.querySelector('code.ltr-inline')
    expect(code).toBeTruthy()
    expect(code!.textContent).toBe('OrderService')
  })
})

describe('BidiSegments (composable, no outer wrapper)', () => {
  it('renders only the fragments, without adding its own dir/alignment wrapper', () => {
    const { container } = render(
      <bdi dir="auto" className="min-w-0 flex-1 text-right">
        <BidiSegments text="Observer (Behavioral Pattern)" />
      </bdi>,
    )
    const bdi = container.querySelector('bdi')!
    expect(bdi.getAttribute('dir')).toBe('auto')
    expect(bdi.className).toContain('text-right')
    expect(bdi.textContent).toBe('Observer (Behavioral Pattern)')
    expect(bdi.querySelector('span.ltr-inline')).toBeTruthy()
  })
})
