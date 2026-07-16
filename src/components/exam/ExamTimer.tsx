import { useEffect, useRef, useState } from 'react'

interface ExamTimerProps {
  durationMinutes: number | null // null = no timer
  onExpire?: () => void
  paused?: boolean
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ExamTimer({ durationMinutes, onExpire, paused }: ExamTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const expiredRef = useRef(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [paused])

  useEffect(() => {
    if (durationMinutes == null) return
    const remaining = durationMinutes * 60 - elapsedSeconds
    if (remaining <= 0 && !expiredRef.current) {
      expiredRef.current = true
      onExpire?.()
    }
  }, [elapsedSeconds, durationMinutes, onExpire])

  if (durationMinutes == null) {
    return <span className="text-sm text-[var(--color-text-muted)]">זמן שחלף: {formatTime(elapsedSeconds)}</span>
  }

  const remaining = Math.max(0, durationMinutes * 60 - elapsedSeconds)
  const isLow = remaining < 120
  return <span className={`text-sm font-medium ${isLow ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'}`}>נותר: {formatTime(remaining)}</span>
}

export { formatTime }
