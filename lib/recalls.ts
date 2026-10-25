/** 召回数据访问层。分片在 data/rec/(sync 写入),generated.ts 静态打包。
 *  纪律:每条忠实转写官方字段,不做任何解读;页面全程链接官方源。 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

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

// 运行时 fs 加载 + 进程级缓存(避免 27MB JSON 打进每页 JS 包 —— Vercel 构建每页 >60s 的根因)
interface CacheShape { index: IndexShape; all: Recall[] }
const g = globalThis as unknown as { __recallCache?: CacheShape }

function cache(): CacheShape {
  if (!g.__recallCache) {
    const dir = join(process.cwd(), 'data', 'rec')
    const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8')) as IndexShape
    const all: Recall[] = []
    for (const f of Object.keys(index.sources)) {
      const rows = JSON.parse(readFileSync(join(dir, `${f}.json`), 'utf8')) as Recall[]
      all.push(...rows)
    }
    all.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    g.__recallCache = { index, all }
  }
  return g.__recallCache
}

const sortedAll = [...cache().all].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
g.__recallCache = { index: cache().index, all: sortedAll }

export function indexInfo(): IndexShape {
  return cache().index
}

export function allSorted(): Recall[] {
  return cache().all
}

export function recallById(id: string): Recall | null {
  return cache().all.find((r) => r.id === id) ?? null
}

export function latest(n: number): Recall[] {
  return cache().all.slice(0, n)
}

export function years(): number[] {
  const set = new Set<number>()
  for (const r of cache().all) {
    const y = Number(r.date.slice(0, 4))
    if (y) set.add(y)
  }
  return [...set].sort((a, b) => b - a)
}

export function byYear(year: number): Recall[] {
  return cache().all.filter((r) => r.date.startsWith(String(year)))
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
  return cache().all.filter((r) => typeKey(r.src) === type)
}

export function brandRecalls(brandSlug: string): Recall[] {
  return cache().all.filter((r) => brandSlugOf(r) === brandSlug)
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
  return cache().index.brands.slice(0, limit)
}
