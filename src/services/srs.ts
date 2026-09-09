import type { Flashcard, SrsRating } from '../types/study'

const DAY_MS = 24 * 60 * 60 * 1000

const RATING_QUALITY: Record<SrsRating, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
}

/**
 * SM-2 inspired scheduler, simplified to 4 ratings (Again/Hard/Good/Easy).
 * A card with no scheduling state yet is treated as brand new.
 */
export function scheduleReview(card: Flashcard, rating: SrsRating): Flashcard {
  const quality = RATING_QUALITY[rating]
  const prevEase = card.easeFactor ?? 2.5
  const prevReps = card.repetitions ?? 0
  const prevInterval = card.intervalDays ?? 0

  let easeFactor = prevEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  easeFactor = Math.max(1.3, easeFactor)

  let repetitions: number
  let intervalDays: number

  if (rating === 'again') {
    repetitions = 0
    intervalDays = 1
  } else {
    repetitions = prevReps + 1
    if (repetitions === 1) {
      intervalDays = rating === 'easy' ? 3 : 1
    } else if (repetitions === 2) {
      intervalDays = rating === 'easy' ? 8 : 6
    } else {
      intervalDays = Math.round(prevInterval * easeFactor)
    }
  }

  const now = Date.now()

  return {
    ...card,
    easeFactor,
    repetitions,
    intervalDays,
    lastReviewedAt: now,
    dueAt: now + intervalDays * DAY_MS,
  }
}

export function isCardDue(card: Flashcard): boolean {
  if (card.dueAt == null) return true
  return card.dueAt <= Date.now()
}

export function countDueCards(cards: Flashcard[]): number {
  return cards.filter(isCardDue).length
}
