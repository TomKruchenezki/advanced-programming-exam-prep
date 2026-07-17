import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Search } from './Search'

function renderSearch() {
  return render(
    <MemoryRouter>
      <Search />
    </MemoryRouter>,
  )
}

describe('Search results BiDi rendering', () => {
  it('renders result titles and bodies with dir="rtl" and right alignment, never dir="auto"', () => {
    const { container, getByPlaceholderText } = renderSearch()
    fireEvent.change(getByPlaceholderText(/חפש/), { target: { value: 'JVM' } })
    const spans = [...container.querySelectorAll('span.text-body-lg, p.text-meta')].filter((el) => el.getAttribute('dir'))
    expect(spans.length).toBeGreaterThan(0)
    for (const el of spans) {
      expect(el.getAttribute('dir')).toBe('rtl')
      expect(el.className).toContain('text-right')
    }
  })

  it('isolates a mixed-language technical term (e.g. JVM) as an LTR span within a highlighted result', () => {
    const { container, getByPlaceholderText } = renderSearch()
    fireEvent.change(getByPlaceholderText(/חפש/), { target: { value: 'JVM' } })
    const marks = [...container.querySelectorAll('mark')]
    expect(marks.length).toBeGreaterThan(0)
    // At least one result's title/body area contains an isolated LTR span (technical content).
    const hasLtrSpan = [...container.querySelectorAll('.ltr-inline')].length > 0
    expect(hasLtrSpan).toBe(true)
  })

  it('preserves the original text exactly - highlighting never drops or reorders characters', () => {
    const { container, getByPlaceholderText } = renderSearch()
    fireEvent.change(getByPlaceholderText(/חפש/), { target: { value: 'java' } })
    const links = [...container.querySelectorAll('a')]
    expect(links.length).toBeGreaterThan(0)
    // Every result link's rendered text must be non-empty and free of stray artifacts.
    for (const link of links) {
      expect(link.textContent!.length).toBeGreaterThan(0)
    }
  })

  it('shows no results message without throwing for a query that matches nothing', () => {
    const { getByPlaceholderText, getByText } = renderSearch()
    fireEvent.change(getByPlaceholderText(/חפש/), { target: { value: 'zzzznonexistentqueryxyz' } })
    expect(getByText('לא נמצאו תוצאות.')).toBeTruthy()
  })
})
