import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  size?: 'default' | 'wide'
  className?: string
}

// Fluid width with a ceiling rather than a fixed rem cap: on a 1920px+ desktop monitor this
// uses ~96-97% of the available main content area, but never stretches past a sane maximum
// on ultra-wide monitors. `default` suits reading-focused/general screens; `wide` is for the
// exam-taking/results screens which need the most room (question + 5 options + code + citations).
const SIZE_CLASS: Record<NonNullable<PageContainerProps['size']>, string> = {
  default: 'max-w-[min(96%,1600px)]',
  wide: 'max-w-[min(97%,1900px)]',
}

export function PageContainer({ children, size = 'default', className = '' }: PageContainerProps) {
  return <div className={`mx-auto w-full ${SIZE_CLASS[size]} ${className}`.trim()}>{children}</div>
}
