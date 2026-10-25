import { describe, expect, it } from 'vitest'
import { allSorted, indexInfo, recallById, years, byYear, typeKey } from '@/lib/recalls'

const HAS = allSorted().length > 0

describe.skipIf(!HAS)('recall data integrity', () => {
  it('total matches index, unique ids', () => {
    expect(allSorted().length).toBe(indexInfo().total)
    expect(new Set(allSorted().map((r) => r.id)).size).toBe(allSorted().length)
  })

  it('every record has date, product/title, official url', () => {
    for (const r of allSorted()) {
      expect(/^\d{4}-\d{2}-\d{2}$/.test(r.date), r.id).toBe(true)
      expect((r.product || r.title).length, r.id).toBeGreaterThan(0)
      expect(r.official.startsWith('https://'), r.id).toBe(true)
    }
  })

  it('sorted newest first', () => {
    const rows = allSorted()
    for (let i = 1; i < Math.min(rows.length, 500); i += 1) {
      expect(rows[i - 1].date >= rows[i].date).toBe(true)
    }
  })

  it('cpsc history reaches decades back, fda recent years', () => {
    expect(Math.min(...years())).toBeLessThan(2000)
    expect(years()[0]).toBeGreaterThanOrEqual(2026)
    expect(byYear(years()[0]).length).toBeGreaterThan(100)
  })

  it('type mapping covers all sources', () => {
    for (const r of allSorted().slice(0, 500)) {
      expect(['food', 'drug', 'device', 'cpsc'], r.id).toContain(typeKey(r.src))
    }
  })
})

describe('accessors degrade honestly', () => {
  it('unknown id returns null', () => {
    expect(recallById('fda-999999999')).toBeNull()
  })
})
