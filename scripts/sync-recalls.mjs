#!/usr/bin/env node
/**
 * 召回数据同步(三源,本版双源:openFDA food/drug/device + CPSC;FSIS 留 CI 阶段)。
 *
 *   openFDA  search=report_date:[YYYY0101 TO YYYY1231] 按年窗口分页(limit 100,skip 递增;
 *            精简字段后 ~700B/条)。food/drug/device 三线,近 3 个自然年。
 *   CPSC     saferproducts.gov RestWebServices/Recall 全量(全史 ~1 万条,一次拉齐)。
 *
 *   纪律  每条忠实转写官方字段(不做任何解读/分级建议);页面全程链接官方源。
 *   分片  data/rec/<source>-<year>.json + index.json(计数与品牌清单)。幂等。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'data', 'rec')
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const YEARS = [2026, 2025, 2024]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJson(url, timeout = 60_000, attempt = 1) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(timeout) })
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 6) throw new Error(`HTTP ${res.status}`)
    await sleep(attempt * 6000)
    return getJson(url, timeout, attempt + 1)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const d8 = (v) => `${String(v).slice(0, 4)}-${String(v).slice(4, 6)}-${String(v).slice(6, 8)}`

/** openFDA 三线:按年窗口 + skip 分页。 */
async function fetchFda(endpoint, year) {
  const out = []
  const search = encodeURIComponent(`report_date:[${year}0101 TO ${year}1231]`)
  let skip = 0
  let pagesFailed = 0
  while (true) {
    let j
    try {
      j = await getJson(`https://api.fda.gov/${endpoint}/enforcement.json?search=${search}&limit=100&skip=${skip}`)
    } catch (err) {
      pagesFailed += 1
      console.log(`[sync-rec] ${endpoint} ${year} page@${skip}: ${err.message.slice(0, 50)}`)
      if (pagesFailed >= 4 || err.message.includes('HTTP 4')) break
      skip += 100 // 跳过失败页:部分数据好过全无,CI 每日会补齐
      if (skip > 2000) break
      continue
    }
    const results = j.results ?? []
    for (const r of results) {
      out.push({
        id: `fda-${r.event_id}`,
        src: endpoint,
        date: d8(r.report_date ?? r.recall_initiation_date),
        init: d8(r.recall_initiation_date ?? r.report_date),
        classification: r.classification ?? null,
        status: r.status ?? null,
        title: (r.product_description ?? '').trim(),
        product: (r.product_description ?? '').trim().slice(0, 160),
        reason: (r.reason_for_recall ?? '').trim(),
        firm: (r.recalling_firm ?? '').trim(),
        city: r.city ?? '',
        state: r.state ?? '',
        country: r.country ?? '',
        distribution: (r.distribution_pattern ?? '').trim(),
        codes: (r.code_info ?? '').trim(),
        quantity: (r.product_quantity ?? '').trim(),
        voluntary: r.voluntary_mandated ?? null,
        official: 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts',
      })
    }
    const total = j.meta?.results?.total ?? 0
    skip += results.length
    if (out.length >= total || results.length === 0 || skip > 2000) break
    await sleep(250)
  }
  return out
}

/** CPSC 全量 → 近 N 年 + 精简。 */
async function fetchCpsc() {
  const j = await getJson('https://www.saferproducts.gov/RestWebServices/Recall?format=json', 60_000)
  return j.map((r) => ({
    id: `cpsc-${r.RecallID}`,
    src: 'cpsc',
    date: String(r.RecallDate ?? '').slice(0, 10),
    init: String(r.LastPublishDate ?? '').slice(0, 10),
    classification: null,
    status: null,
    title: (r.Title ?? '').trim(),
    product: (r.Products ?? []).map((p) => p.Name).filter(Boolean).join('; ') || (r.Title ?? ''),
    reason: (r.Hazards ?? []).map((h) => h.Name).filter((x) => x && x !== 'None reported.').join('; ') || (r.Description ?? '').slice(0, 200),
    firm: (r.Manufacturers ?? []).map((m) => m.Name).filter(Boolean).join('; ') || (r.CompanyName ?? null) || null,
    city: '',
    state: '',
    country: (r.ManufacturerCountries ?? []).map((c) => c.Country).filter(Boolean).join(', '),
    distribution: (r.Retailers ?? []).map((x) => x.Name).filter(Boolean).join('; '),
    codes: '',
    quantity: '',
    voluntary: null,
    official: r.URL && String(r.URL).startsWith('https://') ? r.URL : 'https://www.cpsc.gov/Recalls',
    hazards: (r.Hazards ?? []).map((h) => h.Name).filter((x) => x && x !== 'None reported.'),
    remedies: (r.Remedies ?? []).map((x) => x.Name).filter(Boolean),
    injuries: (r.Injuries ?? []).map((x) => x.Name).filter((x) => x && x !== 'None reported.'),
    units: (r.Products ?? []).map((p) => p.Units).filter(Boolean).join(', ') || null,
    image: r.Images?.[0]?.URL ?? null,
  }))
}

function slugify(text, max = 60) {
  let out = '', dash = false
  for (const c of String(text).toLowerCase().replace(/&/g, ' and ')) {
    if (/[a-z0-9]/.test(c)) { out += c; dash = false }
    else if (!dash && out) { out += '-'; dash = true }
  }
  return out.replace(/-+$/, '').slice(0, max)
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const bySourceYear = new Map()
  const put = (src, year, arr) => {
    const key = `${src}-${year}`
    bySourceYear.set(key, [...(bySourceYear.get(key) ?? []), ...arr])
  }
  const freshKeys = new Set()
  const putFresh = (src, year, arr) => { put(src, year, arr); freshKeys.add(`${src}-${year}`) }

  for (const ep of ['food', 'drug', 'device']) {
    for (const year of YEARS) {
      try {
        const rows = await fetchFda(ep, year)
        putFresh(`fda-${ep}`, year, rows)
        console.log(`[sync-rec] fda-${ep} ${year}: ${rows.length}`)
      } catch (err) {
        console.log(`[sync-rec] fda-${ep} ${year}: ${err.message} — 保留旧数据`)
        const key = `fda-${ep}-${year}`
        if (!freshKeys.has(key) && existsSync(join(OUT_DIR, `${key}.json`))) {
          put(ep === 'food' ? 'fda-food' : ep === 'drug' ? 'fda-drug' : 'fda-device', year, JSON.parse(readFileSync(join(OUT_DIR, `${key}.json`), 'utf8')))
        }
      }
      await sleep(400)
    }
  }

  try {
    const cpsc = await fetchCpsc()
    for (const r of cpsc) {
      const y = Number(r.date.slice(0, 4))
      if (!y) continue
      putFresh('cpsc', y, [r])
    }
    console.log(`[sync-rec] cpsc: ${cpsc.length} total (fresh)`)
  } catch (err) {
    console.log(`[sync-rec] cpsc: ${err.message} — 保留旧数据`)
    for (const f of readdirSync(OUT_DIR).filter((f) => f.startsWith('cpsc-') && f.endsWith('.json'))) {
      const year = Number(f.match(/(\d{4})/)?.[1])
      if (year && !freshKeys.has(`cpsc-${year}`)) put('cpsc', year, JSON.parse(readFileSync(join(OUT_DIR, f), 'utf8')))
    }
  }

  // 写分片 + index
  const index = { sources: {}, total: 0, fetched_at: new Date().toISOString() }
  const all = []
  for (const [key, rowsRaw] of bySourceYear) {
    const seen = new Set()
    const rows = rowsRaw.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    rows.sort((a, b) => (a.date < b.date ? 1 : -1))
    writeFileSync(join(OUT_DIR, `${key}.json`), JSON.stringify(rows) + '\n')
    index.sources[key] = rows.length
    index.total += rows.length
    all.push(...rows.map((r) => ({ ...r, srcYear: key })))
  }

  // 品牌清单(firm/manufacturer)
  const brandMap = new Map()
  for (const r of all) {
    const firm = (r.firm ?? '').split(';')[0].trim()
    if (!firm) continue
    const slug = slugify(firm)
    if (!slug) continue
    brandMap.set(slug, (brandMap.get(slug) ?? 0) + 1)
  }
  index.brands = [...brandMap.entries()].sort((a, b) => b[1] - a[1]).map(([slug, count]) => ({ slug, count }))
  writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(index) + '\n')

  // 生成静态 import 清单(Next 构建可靠打包分片)
  const imports = []
  const decls = []
  let i = 0
  for (const key of bySourceYear.keys()) {
    const varName = `s${i}`
    imports.push(`import ${varName} from './rec/${key}.json'`)
    decls.push(`  { key: '${key}', rows: ${varName} as RawRecall[] },`)
    i += 1
  }
  const gen = `// AUTO-GENERATED by scripts/sync-recalls.mjs — do not edit\n` +
    imports.join('\n') + '\n\nexport interface RawRecall { [k: string]: unknown }\n' +
    'export const SHARDS: Array<{ key: string; rows: RawRecall[] }> = [\n' + decls.join('\n') + '\n]\n'
  writeFileSync(join(ROOT, 'data', 'generated.ts'), gen)
  console.log(`[sync-rec] generated.ts: ${bySourceYear.size} shards`)
  console.log(`[sync-rec] total=${index.total} brands=${index.brands.length} shards=${bySourceYear.size}`)

  // 幂等:比较 index 与旧 index
  const prevPath = join(OUT_DIR, 'index.json.prev')
  if (existsSync(prevPath) && readFileSync(prevPath, 'utf8') === JSON.stringify(index)) {
    console.log('[sync-rec] no change vs prev marker')
  }
  writeFileSync(prevPath, JSON.stringify(index))
}

main().catch((err) => { console.error(`[sync-rec] failed: ${err.message}`); process.exitCode = 1 })
