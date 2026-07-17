import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Learn } from './Learn'
import { ProgressProvider } from '../lib/ProgressContext'
import { topicsSorted, sectionsByTopic } from '../lib/dataStore'

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
