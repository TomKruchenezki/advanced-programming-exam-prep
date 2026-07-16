export const EXAM_DATE_ISO = '2026-07-19T17:30:00+03:00' // Asia/Jerusalem

export interface CountdownParts {
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
}

export function getCountdown(now: Date = new Date()): CountdownParts {
  const target = new Date(EXAM_DATE_ISO)
  const totalMs = target.getTime() - now.getTime()
  const isPast = totalMs <= 0
  const abs = Math.abs(totalMs)
  const days = Math.floor(abs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((abs / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((abs / (1000 * 60)) % 60)
  const seconds = Math.floor((abs / 1000) % 60)
  return { totalMs, days, hours, minutes, seconds, isPast }
}
