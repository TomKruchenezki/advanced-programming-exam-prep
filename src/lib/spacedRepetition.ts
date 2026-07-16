import type { FlashcardReviewState } from '../types/domain'

const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 16] // Leitner-style box -> days until next review

export type Rating = 'again' | 'hard' | 'good' | 'easy'

export function nextReviewState(prev: FlashcardReviewState | undefined, cardId: string, rating: Rating): FlashcardReviewState {
  const prevBox = prev?.box ?? 0
  let nextBox: number
  if (rating === 'again') nextBox = 0
  else if (rating === 'hard') nextBox = Math.max(0, prevBox)
  else if (rating === 'good') nextBox = Math.min(BOX_INTERVAL_DAYS.length - 1, prevBox + 1)
  else nextBox = Math.min(BOX_INTERVAL_DAYS.length - 1, prevBox + 2) // easy

  const days = BOX_INTERVAL_DAYS[nextBox] ?? 1
  const nextReview = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

  const history = prev?.reviewHistory ?? []
  return {
    cardId,
    box: nextBox,
    nextReview,
    lastRating: rating,
    reviewHistory: [...history, { timestampISO: new Date().toISOString(), rating }],
  }
}

export function isDue(state: FlashcardReviewState | undefined): boolean {
  if (!state) return true
  return new Date(state.nextReview).getTime() <= Date.now()
}
