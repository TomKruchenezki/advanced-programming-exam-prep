import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import type { MockExam, Question, Topic } from '../src/types/domain'
import { mulberry32, shuffleArray } from '../src/lib/shuffle'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../src/data')

const topics: Topic[] = JSON.parse(readFileSync(path.join(DATA_DIR, 'topics.json'), 'utf-8'))
const questions: Question[] = JSON.parse(readFileSync(path.join(DATA_DIR, 'questions.json'), 'utf-8'))
const active = questions.filter((q) => q.active && !q.needsReview)

const FREQ_WEIGHT: Record<Topic['examFrequency'], number> = { high: 3, medium: 1.8, low: 1 }

// Some real questions legitimately repeat verbatim across exam years (e.g. the same
// Observer-pattern trap appeared in both 2018 and 2024) - valuable historical data, but we
// don't want the SAME wording to consume two slots within a single generated mock exam.
function stemFingerprint(q: Question): string {
  return (q.stemHe + '\n' + (q.code ?? '')).trim().toLowerCase().replace(/\s+/g, ' ')
}

function pickExamQuestions(pool: Question[], rng: () => number, size = 20): Question[] {
  const byTopic = new Map<string, Question[]>()
  for (const q of pool) {
    for (const topicId of q.topicIds) {
      if (!byTopic.has(topicId)) byTopic.set(topicId, [])
      byTopic.get(topicId)!.push(q)
    }
  }
  const totalWeight = topics.reduce((sum, t) => sum + FREQ_WEIGHT[t.examFrequency], 0)
  const selected: Question[] = []
  const used = new Set<string>()
  const usedStems = new Set<string>()

  for (const topic of topics) {
    const share = FREQ_WEIGHT[topic.examFrequency] / totalWeight
    const target = Math.round(share * size)
    const candidates = shuffleArray(byTopic.get(topic.id) ?? [], rng).filter((q) => !used.has(q.id) && !usedStems.has(stemFingerprint(q)))
    for (const q of candidates.slice(0, target)) {
      selected.push(q)
      used.add(q.id)
      usedStems.add(stemFingerprint(q))
    }
  }
  if (selected.length < size) {
    const remaining = shuffleArray(pool.filter((q) => !used.has(q.id) && !usedStems.has(stemFingerprint(q))), rng)
    for (const q of remaining) {
      if (selected.length >= size) break
      selected.push(q)
      used.add(q.id)
      usedStems.add(stemFingerprint(q))
    }
  }
  return shuffleArray(selected, rng).slice(0, size)
}

function buildExamsWithMinimalOverlap(count: number, size: number): Question[][] {
  const globallyUsed = new Set<string>()
  const exams: Question[][] = []
  for (let i = 0; i < count; i++) {
    const rng = mulberry32(1000 + i * 97)
    const freshPool = active.filter((q) => !globallyUsed.has(q.id))
    const examQuestions = pickExamQuestions(freshPool.length >= size ? freshPool : active, rng, size)
    // Top up with previously used questions only if the fresh pool ran short.
    if (examQuestions.length < size) {
      const usedStems = new Set(examQuestions.map(stemFingerprint))
      const extra = shuffleArray(
        active.filter((q) => !examQuestions.some((e) => e.id === q.id) && !usedStems.has(stemFingerprint(q))),
        rng,
      )
      for (const q of extra) {
        if (examQuestions.length >= size) break
        examQuestions.push(q)
        usedStems.add(stemFingerprint(q))
      }
    }
    for (const q of examQuestions) globallyUsed.add(q.id)
    exams.push(examQuestions)
  }
  return exams
}

function buildAuthenticPastExam(): Question[] | null {
  const byYear = new Map<number, Question[]>()
  for (const q of questions) {
    if (q.source !== 'past-exam' || !q.active || q.needsReview) continue
    const year = q.pastExamYear
    if (year == null) continue
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year)!.push(q)
  }
  for (const [, list] of byYear) {
    if (list.length >= 20) {
      const sorted = list.slice().sort((a, b) => {
        const rank = { high: 0, medium: 1, low: 2 }
        return rank[a.confidence] - rank[b.confidence]
      })
      return sorted.slice(0, 20)
    }
  }
  return null
}

// Always generate at least 6 exams regardless of whether an authentic past-exam bundle
// is available; the authentic one (if found) is added as a bonus extra exam.
const NUM_GENERATED_EXAMS = 6
const exams: MockExam[] = []

const authentic = buildAuthenticPastExam()
if (authentic) {
  const totalPoints = authentic.reduce((s, q) => s + q.points, 0)
  exams.push({
    id: 'mock-0-authentic',
    titleHe: `מבחן עבר אמיתי (${authentic[0]?.pastExamYear ?? ''})`,
    isAuthenticPastExam: true,
    questionIds: authentic.map((q) => q.id),
    durationMinutesDefault: 90,
    totalPoints,
  })
}

const generated = buildExamsWithMinimalOverlap(NUM_GENERATED_EXAMS, 20)
generated.forEach((qs, i) => {
  const totalPoints = qs.reduce((s, q) => s + q.points, 0)
  exams.push({
    id: `mock-${i + 1}`,
    titleHe: `מבחן מדומה ${i + 1}`,
    questionIds: qs.map((q) => q.id),
    durationMinutesDefault: 90,
    totalPoints,
  })
})

writeFileSync(path.join(DATA_DIR, 'mockExams.json'), JSON.stringify(exams, null, 2), 'utf-8')
console.log(`Wrote ${exams.length} mock exams (authentic past exam: ${authentic ? 'yes' : 'no'})`)
for (const exam of exams) {
  console.log(`  ${exam.id}: ${exam.questionIds.length} questions, ${exam.totalPoints} points`)
}
