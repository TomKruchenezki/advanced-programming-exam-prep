import { NavLink, Outlet } from 'react-router-dom'
import { useProgress } from '../../lib/ProgressContext'
import { ProgressControls } from './ProgressControls'

const NAV_ITEMS = [
  { to: '/', label: 'לוח בקרה', end: true },
  { to: '/learn', label: 'למידה' },
  { to: '/diagnostic', label: 'מבחן אבחון' },
  { to: '/quiz', label: 'תרגול' },
  { to: '/mock', label: 'מבחן מדומה' },
  { to: '/past-exams', label: 'מבחני עבר' },
  { to: '/flashcards', label: 'כרטיסיות' },
  { to: '/mistakes', label: 'מחברת טעויות' },
  { to: '/review', label: 'חזרה אחרונה' },
  { to: '/search', label: 'חיפוש' },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'block rounded-lg px-3 py-2 text-nav-link font-medium transition-colors',
    isActive
      ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]'
      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)]',
  ].join(' ')
}

function ThemeToggle() {
  const { progress, updateProgress } = useProgress()
  const theme = progress.settings.theme
  function cycle() {
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
    updateProgress((prev) => ({ ...prev, settings: { ...prev.settings, theme: next } }))
  }
  const label = theme === 'system' ? 'מערכת' : theme === 'light' ? 'בהיר' : 'כהה'
  return (
    <button
      onClick={cycle}
      className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
    >
      ערכת נושא: {label}
    </button>
  )
}

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full shrink-0 border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] md:w-56 md:border-b-0 md:border-s">
        <div className="p-4">
          <h1 className="mb-1 text-base font-bold leading-tight">הכנה למבחן</h1>
          <p className="mb-4 text-xs text-[var(--color-text-muted)]">נושאים מתקדמים בתכנות</p>
          <nav className="flex flex-row flex-wrap gap-1 md:flex-col">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 space-y-3">
            <ThemeToggle />
            <ProgressControls />
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8 xl:p-10">
        <Outlet />
      </main>
    </div>
  )
}
