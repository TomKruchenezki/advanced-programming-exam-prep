import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Learn } from './Learn'
import { ProgressProvider } from '../lib/ProgressContext'
import { topicsSorted, sectionsByTopic, questionsById } from '../lib/dataStore'
import { stableShuffleQuestionOptions } from '../lib/shuffle'

const NARROW_MAXW_PATTERNS = [
  'max-w-[85ch]',
  'max-w-prose',
  'max-w-sm',
  'max-w-md',
  'max-w-lg',
  'max-w-xl',
  'max-w-2xl',
  'max-w-3xl',
  'max-w-4xl',
  'max-w-5xl',
  'max-w-6xl',
  'max-w-7xl',
  'prose',
]

function renderTopic(topicId: string) {
  return render(
    <MemoryRouter initialEntries={[`/learn/${topicId}`]}>
      <ProgressProvider>
        <Routes>
          <Route path="/learn/:topicId" element={<Learn />} />
        </Routes>
      </ProgressProvider>
    </MemoryRouter>,
  )
}

describe('Learn TopicReader full-width layout', () => {
  it('uses the wide PageContainer variant (2000px ceiling), not the narrower default', () => {
    const { container } = renderTopic('solid-principles')
    const pageContainer = container.querySelector('main > div, .space-y-10')!
    expect(pageContainer.className).toContain('max-w-[min(97%,2000px)]')
    expect(pageContainer.className).not.toContain('1900px')
  })

  it('renders no paragraph with a narrow reading-measure max-width', () => {
    const { container } = renderTopic('solid-principles')
    const paragraphs = [...container.querySelectorAll('p')]
    expect(paragraphs.length).toBeGreaterThan(0)
    for (const p of paragraphs) {
      for (const pattern of NARROW_MAXW_PATTERNS) {
        expect(p.className).not.toContain(pattern)
      }
    }
  })

  it('still renders every study section heading for the topic (no content lost)', () => {
    // Headings now render via BidiText, which isolates embedded LTR fragments into nested
    // <span> elements - getByText's default matcher looks for one element whose OWN text node
    // equals the query, so a heading fragmented across children needs a textContent-based check
    // (which is robust to that fragmentation) rather than getByText's node-level matching.
    const { container } = renderTopic('solid-principles')
    const sections = sectionsByTopic.get('solid-principles') ?? []
    expect(sections.length).toBeGreaterThan(0)
    const headings = [...container.querySelectorAll('h2')]
    for (const section of sections) {
      expect(headings.some((h) => h.textContent === section.headingHe)).toBe(true)
    }
  })

  it('still renders working previous/next topic navigation', () => {
    const currentIndex = topicsSorted.findIndex((t) => t.id === 'solid-principles')
    const { container } = renderTopic('solid-principles')
    const navLinks = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    if (currentIndex > 0) {
      const prevTopic = topicsSorted[currentIndex - 1]!
      expect(navLinks).toContain(`/learn/${prevTopic.id}`)
    }
    if (currentIndex >= 0 && currentIndex < topicsSorted.length - 1) {
      const nextTopic = topicsSorted[currentIndex + 1]!
      expect(navLinks).toContain(`/learn/${nextTopic.id}`)
    }
  })

  it('keeps code blocks LTR-isolated (ltr-code) and untouched by the width change', () => {
    const { container } = renderTopic('java-platform-jvm')
    const codeBlocks = [...container.querySelectorAll('pre')]
    expect(codeBlocks.length).toBeGreaterThan(0)
    for (const block of codeBlocks) {
      expect(block.className).toContain('ltr-code')
    }
  })
})

describe('Learn supplemental questions do not inherit answer state from other questions', () => {
  // generics-collections-equals-hashcode has 6 real supplemental-pack questions - enough to
  // prove answering one never touches its neighbors.
  function optionButtons(container: Element) {
    return [...container.querySelectorAll('button[aria-label]')].filter((b) => /^[A-E]\. /.test(b.getAttribute('aria-label') ?? ''))
  }
  function isNeutral(button: Element) {
    // The default (never-selected, never-revealed) button carries `hover:border-[var(--color-accent)]`
    // - only the actual highlight-fill classes (bg-*) indicate a selected/correct/incorrect state.
    const cls = button.className
    return !cls.includes('bg-[var(--color-success)]') && !cls.includes('bg-[var(--color-danger)]') && !cls.includes('bg-[var(--color-accent)]')
  }

  it('renders every never-answered supplemental question with no option selected, no green/red styling, and no explanation visible', () => {
    const { container } = renderTopic('generics-collections-equals-hashcode')
    const heading = [...container.querySelectorAll('h2')].find((h) => h.textContent === 'שאלות חדשות בנושא זה')
    expect(heading).toBeTruthy()
    const section = heading!.closest('section')!
    const buttons = optionButtons(section)
    expect(buttons.length).toBeGreaterThanOrEqual(5)
    for (const b of buttons) {
      expect(isNeutral(b)).toBe(true)
      expect((b as HTMLButtonElement).disabled).toBe(false)
    }
    // No explanation text ("הסבר:") should be visible anywhere in this section yet.
    expect(section.textContent).not.toContain('הסבר:')
  })

  it('answering one supplemental question only changes that question - neighbors stay neutral and unanswered', () => {
    const { container } = renderTopic('generics-collections-equals-hashcode')
    const heading = [...container.querySelectorAll('h2')].find((h) => h.textContent === 'שאלות חדשות בנושא זה')!
    const section = heading.closest('section')!
    const questionCards = [...section.querySelectorAll('.rounded-xl')].filter((el) => el.querySelector('button[aria-label]'))
    expect(questionCards.length).toBeGreaterThanOrEqual(2)

    const firstCardButtons = optionButtons(questionCards[0]!)
    fireEvent.click(firstCardButtons[0]!)

    // The clicked question now shows feedback (one option is marked, disabled).
    const afterFirstCard = optionButtons(questionCards[0]!)
    expect(afterFirstCard.some((b) => (b as HTMLButtonElement).disabled)).toBe(true)

    // Every OTHER question in the same section remains completely neutral and interactive.
    for (const card of questionCards.slice(1)) {
      const buttons = optionButtons(card)
      for (const b of buttons) {
        expect(isNeutral(b)).toBe(true)
        expect((b as HTMLButtonElement).disabled).toBe(false)
      }
      expect(card.textContent).not.toContain('הסבר:')
    }
  })

  it('scrolling/rerendering the parent topic never answers or reveals a never-clicked supplemental question', () => {
    const { container, rerender } = render(
      <MemoryRouter initialEntries={['/learn/generics-collections-equals-hashcode']}>
        <ProgressProvider>
          <Routes>
            <Route path="/learn/:topicId" element={<Learn />} />
          </Routes>
        </ProgressProvider>
      </MemoryRouter>,
    )
    const heading = () => [...container.querySelectorAll('h2')].find((h) => h.textContent === 'שאלות חדשות בנושא זה')!
    const before = optionButtons(heading().closest('section')!).map((b) => b.className)

    // Force a re-render of the whole tree (simulates a parent state change / rerender).
    rerender(
      <MemoryRouter initialEntries={['/learn/generics-collections-equals-hashcode']}>
        <ProgressProvider>
          <Routes>
            <Route path="/learn/:topicId" element={<Learn />} />
          </Routes>
        </ProgressProvider>
      </MemoryRouter>,
    )
    const after = optionButtons(heading().closest('section')!).map((b) => b.className)
    expect(after).toEqual(before)
  })
})

function optionButtonsInDomOrder(container: HTMLElement, optionTexts: string[]) {
  return [...container.querySelectorAll('button')].filter((b) => optionTexts.some((t) => (b.getAttribute('aria-label') ?? '').endsWith(t)))
}

describe('Learn check-question stable option order (correctness gate)', () => {
  // These are the exact two questions reported by the user as reshuffling: the javac/java
  // compilation question, and the cross-platform Java question - both are check questions
  // under java-platform-jvm's first study section.
  const question = questionsById.get('q-java-platform-jvm-002')!
  const optionTexts = question.options.map((o) => o.text)

  it('does not reshuffle options after selecting the correct Learn answer', () => {
    const { container } = renderTopic('java-platform-jvm')
    const before = optionButtonsInDomOrder(container, optionTexts).map((b) => b.getAttribute('aria-label'))
    expect(before).toHaveLength(5)

    // The component seeds its shuffle with the question id, exactly like the production code -
    // this predicts which button currently displays the correct answer.
    const expectedShuffle = stableShuffleQuestionOptions(question, question.id)
    const correctText = expectedShuffle.options.find((o) => o.id === expectedShuffle.correctOptionId)!.text
    const correctButton = optionButtonsInDomOrder(container, optionTexts).find((b) => (b.getAttribute('aria-label') ?? '').endsWith(correctText))!

    fireEvent.click(correctButton)

    expect(correctButton.className).toContain('color-success')
    const after = optionButtonsInDomOrder(container, optionTexts).map((b) => b.getAttribute('aria-label'))
    expect(after).toEqual(before)
  })

  it('Learn confidence and learned controls do not reshuffle check-question options', () => {
    const { container, getAllByText } = renderTopic('java-platform-jvm')
    const before = optionButtonsInDomOrder(container, optionTexts).map((b) => b.getAttribute('aria-label'))
    expect(before).toHaveLength(5)

    fireEvent.click(getAllByText('סמן כלמדתי')[0]!)
    const afterLearned = optionButtonsInDomOrder(container, optionTexts).map((b) => b.getAttribute('aria-label'))
    expect(afterLearned).toEqual(before)

    const confidenceButtons = [...container.querySelectorAll('button')].filter((b) => /^[1-5]$/.test(b.textContent ?? '') && b.className.includes('rounded-full'))
    expect(confidenceButtons.length).toBeGreaterThan(0)
    for (const btn of confidenceButtons.slice(0, 5)) {
      fireEvent.click(btn)
      const afterConfidence = optionButtonsInDomOrder(container, optionTexts).map((b) => b.getAttribute('aria-label'))
      expect(afterConfidence).toEqual(before)
    }
  })

  it('does not reshuffle the supplemental "new questions" preview cards across unrelated re-renders', () => {
    const { container, getAllByText } = renderTopic('java-platform-jvm')
    const supplementalHeading = container.querySelector('h2')
    if (!supplementalHeading) return // no supplemental questions for this topic - nothing to assert
    const badges = [...container.querySelectorAll('span')].filter((s) => s.textContent === 'מאגר נוסף')
    if (badges.length === 0) return
    // Trigger unrelated re-renders (confidence + learned clicks) and confirm supplemental
    // preview cards (revealed, non-interactive) keep the same displayed option order.
    const before = [...container.querySelectorAll('button[aria-label]')].map((b) => b.getAttribute('aria-label'))
    fireEvent.click(getAllByText('סמן כלמדתי')[0]!)
    const after = [...container.querySelectorAll('button[aria-label]')].map((b) => b.getAttribute('aria-label'))
    expect(after).toEqual(before)
  })
})

describe.each(topicsSorted.map((t) => [t.id, t.titleHe] as const))('Learn topic %s (%s)', (topicId) => {
  it('has no paragraph with a narrow reading-measure max-width anywhere in its rendered content', () => {
    const { container } = renderTopic(topicId)
    const paragraphs = [...container.querySelectorAll('p')]
    for (const p of paragraphs) {
      for (const pattern of NARROW_MAXW_PATTERNS) {
        expect(p.className).not.toContain(pattern)
      }
    }
  })
})
