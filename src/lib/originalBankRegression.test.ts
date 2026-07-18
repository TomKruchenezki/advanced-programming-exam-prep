import { describe, it, expect } from 'vitest'
import questionsJson from '../data/questions.json'
import snapshot from '../data/__snapshots__/originalActiveQuestions.snapshot.json'
import pastExamSnapshotJson from '../data/__snapshots__/pastExamQuestions.snapshot.json'
import pastExamIndexJson from '../data/pastExamIndex.json'
import type { Question } from '../types/domain'

describe('original question bank regression', () => {
  const currentActive = (questionsJson as unknown as Question[]).filter((q) => q.active)
  const frozenActive = snapshot as unknown as Question[]

  it('still has exactly the same number of active questions as the frozen snapshot', () => {
    expect(currentActive.length).toBe(frozenActive.length)
    expect(currentActive.length).toBe(293)
  })

  it('has not lost, gained, or renamed any original active question id', () => {
    const currentIds = new Set(currentActive.map((q) => q.id))
    const frozenIds = new Set(frozenActive.map((q) => q.id))
    expect(currentIds).toEqual(frozenIds)
  })

  // NOTE: this used to assert byte-for-byte identity across all 293 active questions - that
  // was correct while the only prior changes were structural (supplemental packs, BiDi display).
  // The Phase-B distractor-quality pass explicitly and intentionally rewrites weak distractors
  // in generated core-practice questions (origin: 'new_past_exam_style', not linked to any real
  // Past Exam) - so byte-for-byte identity is now enforced only for every OTHER origin
  // (reconstruction/adapted, i.e. every question actually derived from a real past exam), which
  // must never be touched SILENTLY. The 73 Past-Exam-linked questions specifically are
  // additionally covered by the more targeted pastExamQuestions.snapshot.json regression below.
  //
  // A one-time, user-authorized, source-verified correction round (2026-07-18) then fixed 23 of
  // those 73 Past-Exam questions after a full audit against the original exam transcripts in
  // Sample past exams/ found: (a) 22 questions where the real exam only had 4 options but the
  // stored data had padded in a fabricated 5th distractor not present in any source, and
  // (b) q-pastexam-2025-019, whose correctOptionId was flatly wrong (stored "b"; the confirmed
  // 100/100 graded exam paper shows "c" is correct) in addition to the same 5th-option padding.
  // Both snapshots below were deliberately regenerated to this corrected, source-verified
  // baseline - this is the one sanctioned exception to "never touch", made with direct evidence
  // and explicit user approval, not a silent edit.
  it('every non-generated question (reconstruction/adapted - i.e. derived from a real past exam) is byte-for-byte identical to its frozen snapshot record', () => {
    const currentById = new Map(currentActive.map((q) => [q.id, q]))
    const protectedFrozen = frozenActive.filter((q) => q.origin !== 'new_past_exam_style')
    expect(protectedFrozen.length).toBeGreaterThan(0)
    for (const frozen of protectedFrozen) {
      const current = currentById.get(frozen.id)
      expect(current, `question ${frozen.id} should still exist`).toBeTruthy()
      expect(current).toEqual(frozen)
    }
  })
})

describe('Past Exam question provenance protection', () => {
  const pastExamIds = new Set(pastExamIndexJson.flatMap((e) => e.questionIds))
  const currentById = new Map((questionsJson as unknown as Question[]).map((q) => [q.id, q]))
  const pastExamSnapshot = pastExamSnapshotJson as unknown as (Question & { pastExamYear: number | null })[]

  it('the Past Exam index still references exactly 73 questions, all present in the dedicated frozen snapshot', () => {
    expect(pastExamIds.size).toBe(73)
    expect(pastExamSnapshot.length).toBe(73)
    expect(new Set(pastExamSnapshot.map((q) => q.id))).toEqual(pastExamIds)
  })

  it('every Past-Exam-linked question keeps its exact id, stem, options, correctOptionId, year and active status', () => {
    for (const frozen of pastExamSnapshot) {
      const current = currentById.get(frozen.id)
      expect(current, `Past Exam question ${frozen.id} should still exist`).toBeTruthy()
      expect(current!.stemHe).toBe(frozen.stemHe)
      expect(current!.options).toEqual(frozen.options)
      expect(current!.correctOptionId).toBe(frozen.correctOptionId)
      expect(current!.pastExamYear).toBe(frozen.pastExamYear)
      expect(current!.active).toBe(frozen.active)
    }
  })
})
