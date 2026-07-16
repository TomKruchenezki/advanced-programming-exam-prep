export function CodeBlock({ code, language = 'java' }: { code: string; language?: string }) {
  return (
    <pre className="ltr-code overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-code-bg)] p-4 text-sm">
      <code className={`language-${language}`}>{code}</code>
    </pre>
  )
}
