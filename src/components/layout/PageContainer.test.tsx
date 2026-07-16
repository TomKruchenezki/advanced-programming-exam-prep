import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PageContainer } from './PageContainer'

describe('PageContainer width ceilings', () => {
  it('default variant uses a wide fluid ceiling, not the old narrow 1600px/896px/1152px caps', () => {
    const { container } = render(<PageContainer>content</PageContainer>)
    const div = container.firstElementChild as HTMLElement
    expect(div.className).toContain('max-w-[min(95%,1900px)]')
    expect(div.className).not.toContain('1600px')
    expect(div.className).not.toContain('max-w-4xl')
    expect(div.className).not.toContain('max-w-6xl')
  })

  it('wide variant uses an even larger fluid ceiling than default', () => {
    const { container } = render(<PageContainer size="wide">content</PageContainer>)
    const div = container.firstElementChild as HTMLElement
    expect(div.className).toContain('max-w-[min(97%,2000px)]')
    expect(div.className).not.toContain('1900px')
  })

  it('both variants use a high fluid percentage (>=95%) so normal desktop monitors are nearly full width', () => {
    const { container: defaultContainer } = render(<PageContainer>content</PageContainer>)
    const { container: wideContainer } = render(<PageContainer size="wide">content</PageContainer>)
    expect((defaultContainer.firstElementChild as HTMLElement).className).toMatch(/min\(95%/)
    expect((wideContainer.firstElementChild as HTMLElement).className).toMatch(/min\(97%/)
  })

  it('still centers via mx-auto and stays full-width up to its cap', () => {
    const { container } = render(<PageContainer>content</PageContainer>)
    const div = container.firstElementChild as HTMLElement
    expect(div.className).toContain('mx-auto')
    expect(div.className).toContain('w-full')
  })
})
