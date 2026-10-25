/** 召回数据访问层。分片在 data/rec/(sync 写入),generated.ts 静态打包。
 *  纪律:每条忠实转写官方字段,不做任何解读;页面全程链接官方源。 */

import { SHARDS } from '@/data/generated'
import rawIndex from '@/data/rec/index.json'

export type RecallSrc = 'fda-food' | 'fda-drug' | 'fda-device' | 'cpsc'

export interface Recall {
  id: string
  src: RecallSrc
  date: string
  init: string
  classification: string | null
  status: string | null
  title: string
  product: string
  reason: string
  firm: string | null
  city: string
  state: string
  country: string
  distribution: string
  codes: string
  quantity: string
  voluntary: string | null
  official: string
  // CPSC 附加
  hazards?: string[]
  remedies?: string[]
  injuries?: string[]
  units?: string | null
  image?: string | null
}

interface IndexShape {
  sources: Record<string, number>
  total: number
  fetched_at: string
  brands: Array<{ slug: string; count: number }>
}

export const INDEX = rawIndex as unknown as IndexShape
export const ALL: Recall[] = SHARDS.flatMap((sh) => sh.rows as unknown as Recall[])

const BY_ID = new Map<string, Recall>(ALL.map((r) => [r.id, r]))
const sorted = [...ALL].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

export function indexInfo() {
  return INDEX
}

export function allSorted(): Recall[] {
  return sorted
}

export function recallById(id: string): Recall | null {
  return BY_ID.get(id) ?? null
}

export function latest(n: number): Recall[] {
  return sorted.slice(0, n)
}

export function years(): number[] {
  const set = new Set<number>()
  for (const r of sorted) {
    const y = Number(r.date.slice(0, 4))
    if (y) set.add(y)
  }
  return [...set].sort((a, b) => b - a)
}

export function byYear(year: number): Recall[] {
  return sorted.filter((r) => r.date.startsWith(String(year)))
}

export const TYPES: Array<{ key: string; label: string; blurb: string }> = [
  { key: 'food', label: 'Food recalls', blurb: 'FDA food safety recalls and withdrawals.' },
  { key: 'drug', label: 'Drug recalls', blurb: 'FDA drug enforcement recalls.' },
  { key: 'device', label: 'Device recalls', blurb: 'FDA medical device recalls.' },
  { key: 'cpsc', label: 'Consumer products', blurb: 'CPSC consumer product recalls — toys, appliances, vehicles parts and more.' },
]

export function typeKey(src: RecallSrc | string): string {
  if (src.startsWith('fda-')) return src.slice(4)
  return 'cpsc'
}

export function byType(type: string): Recall[] {
  return sorted.filter((r) => typeKey(r.src) === type)
}

export function brandRecalls(brandSlug: string): Recall[] {
  return sorted.filter((r) => brandSlugOf(r) === brandSlug)
}

export function brandSlugOf(r: Recall): string {
  const firm = (r.firm ?? '').split(';')[0].trim()
  return slugify(firm)
}

export function slugify(text: string, max = 60): string {
  let out = ''
  let dash = false
  for (const c of String(text).toLowerCase().replace(/&/g, ' and ')) {
    if (/[a-z0-9]/.test(c)) { out += c; dash = false }
    else if (!dash && out) { out += '-'; dash = true }
  }
  return out.replace(/-+$/, '').slice(0, max)
}

export function topBrands(limit: number): Array<{ slug: string; count: number }> {
  return INDEX.brands.slice(0, limit)
}
