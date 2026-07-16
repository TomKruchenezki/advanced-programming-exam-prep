import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  size?: 'default' | 'wide'
  className?: string
}

const SIZE_CLASS: Record<NonNullable<PageContainerProps['size']>, string> = {
  default: 'max-w-4xl',
  wide: 'max-w-6xl',
}

export function PageContainer({ children, size = 'default', className = '' }: PageContainerProps) {
  return <div className={`mx-auto w-full ${SIZE_CLASS[size]} ${className}`.trim()}>{children}</div>
}
