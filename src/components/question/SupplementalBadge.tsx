interface SupplementalBadgeProps {
  label: string
}

/** Small pill used to mark supplemental (non-core) content - kept out of the main exam screens. */
export function SupplementalBadge({ label }: SupplementalBadgeProps) {
  return (
    <span className="text-meta inline-block rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 font-medium text-[var(--color-accent)]">
      {label}
    </span>
  )
}
