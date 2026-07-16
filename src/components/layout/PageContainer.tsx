import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  size?: 'default' | 'wide'
  className?: string
}

// Fluid width with a ceiling rather than a fixed rem cap: on a 1920px+ desktop monitor this
// uses ~92-96% of the available main content area, but never stretches past a sane maximum
// on ultra-wide/4K monitors (where the fixed px ceiling intentionally takes over so a single
// question card or lesson section doesn't stretch across the entire physical screen).
// `default` suits reading-focused/general screens; `wide` is for the exam-taking/results
// screens which need the most room (question + 5 options + code + citations).
const SIZE_CLASS: Record<NonNullable<PageContainerProps['size']>, string> = {
  default: 'max-w-[min(95%,1900px)]',
  wide: 'max-w-[min(97%,2000px)]',
}

export function PageContainer({ children, size = 'default', className = '' }: PageContainerProps) {
  return <div className={`mx-auto w-full ${SIZE_CLASS[size]} ${className}`.trim()}>{children}</div>
}
