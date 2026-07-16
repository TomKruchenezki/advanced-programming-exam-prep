import Fuse from 'fuse.js'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { topics, questions, flashcards, studySections } from '../lib/dataStore'
import { PageContainer } from '../components/layout/PageContainer'

interface SearchItem {
  id: string
  kind: 'topic' | 'question' | 'flashcard' | 'section'
  title: string
  body: string
  link: string
}

type KindFilter = 'all' | SearchItem['kind']

function highlightMatches(text: string, ranges: readonly (readonly [number, number])[] | undefined) {
  if (!ranges || ranges.length === 0) return text
  const parts: ReactNode[] = []
  let cursor = 0
  ranges
    .slice()
    .sort((a, b) => a[0] - b[0])
    .forEach(([start, end], i) => {
      if (start > cursor) parts.push(text.slice(cursor, start))
      parts.push(
        <mark key={i} className="rounded bg-[var(--color-accent)]/25 text-inherit">
          {text.slice(start, end + 1)}
        </mark>,
      )
      cursor = end + 1
    })
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}

export function Search() {
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')

  const items = useMemo<SearchItem[]>(() => {
    const topicItems: SearchItem[] = topics.map((t) => ({ id: t.id, kind: 'topic', title: t.titleHe, body: `${t.titleEn} ${t.summary}`, link: `/learn/${t.id}` }))
    const questionItems: SearchItem[] = questions.map((q) => ({ id: q.id, kind: 'question', title: q.stemHe, body: `${q.subtopic} ${q.explanation}`, link: `/quiz` }))
    const flashcardItems: SearchItem[] = flashcards.map((c) => ({ id: c.id, kind: 'flashcard', title: c.frontHe, body: c.backHe, link: `/flashcards/${c.topicId}` }))
    const sectionItems: SearchItem[] = studySections.map((s) => ({
      id: s.id,
      kind: 'section',
      title: s.headingHe,
      body: `${s.intuitionHe} ${s.examKnowledgeHe}`,
      link: `/learn/${s.topicId}`,
    }))
    return [...topicItems, ...sectionItems, ...questionItems, ...flashcardItems]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics.length, questions.length, flashcards.length, studySections.length])

  const fuse = useMemo(() => new Fuse(items, { keys: ['title', 'body'], threshold: 0.35, ignoreLocation: true, includeMatches: true }), [items])

  const allResults = query.trim() ? fuse.search(query).slice(0, 60) : []
  const results = kindFilter === 'all' ? allResults : allResults.filter((r) => r.item.kind === kindFilter)

  const kindLabel: Record<SearchItem['kind'], string> = {
    topic: 'נושא',
    question: 'שאלה',
    flashcard: 'כרטיסייה',
    section: 'חומר לימוד',
  }

  const FILTERS: { value: KindFilter; label: string }[] = [
    { value: 'all', label: 'הכל' },
    { value: 'topic', label: 'נושאים' },
    { value: 'section', label: 'חומר לימוד' },
    { value: 'question', label: 'שאלות' },
    { value: 'flashcard', label: 'כרטיסיות' },
  ]

  return (
    <PageContainer className="space-y-6">
      <h1 className="text-2xl font-bold">חיפוש</h1>
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חפש נושא, מושג, שאלה או כרטיסייה..."
        className="w-full rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-sm"
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setKindFilter(f.value)}
            className={`rounded-full border px-3 py-1 text-xs ${kindFilter === f.value ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'border-[var(--color-border)]'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {results.map((r) => {
          const titleMatch = r.matches?.find((m) => m.key === 'title')
          const bodyMatch = r.matches?.find((m) => m.key === 'body')
          return (
            <Link key={`${r.item.kind}-${r.item.id}`} to={r.item.link} className="block rounded-lg border border-[var(--color-border)] p-3 text-sm hover:border-[var(--color-accent)]">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium">{highlightMatches(r.item.title, titleMatch?.indices)}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{kindLabel[r.item.kind]}</span>
              </div>
              <p className="line-clamp-2 text-xs text-[var(--color-text-muted)]">{highlightMatches(r.item.body, bodyMatch?.indices)}</p>
            </Link>
          )
        })}
        {query.trim() && results.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">לא נמצאו תוצאות.</p>}
      </div>
    </PageContainer>
  )
}
