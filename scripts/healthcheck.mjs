#!/usr/bin/env node
/** 线上体检:首页/最新/类目/品牌/召回详情/API/sitemap。 */
const SITE_URL = (process.env.SITE_URL ?? '').replace(/\/+$/, '')
if (!SITE_URL) { console.error('[health] SITE_URL not configured'); process.exit(1) }
const failures = []
const check = async (name, fn) => {
  try { await fn(); console.log(`[health] ✓ ${name}`) } catch (err) {
    failures.push(name); console.error(`[health] ✗ ${name}: ${err.message}`)
  }
}
const get = async (path, timeout = 30_000) => {
  const res = await fetch(`${SITE_URL}${path}`, { signal: AbortSignal.timeout(timeout), headers: { 'User-Agent': 'recallcheck-healthcheck' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}
await check('home renders', async () => {
  const html = await get('/')
  if (!/official FDA or CPSC/i.test(html)) throw new Error('no attribution')
})
await check('latest page lists records', async () => {
  const html = await get('/latest')
  const count = (html.match(/\/recall\//g) ?? []).length
  if (count < 50) throw new Error(`only ${count} links`)
})
await check('one recall detail renders via api', async () => {
  const s = JSON.parse(await get('/api/recall?q=recall'))
  if (!s.results?.length) throw new Error('search empty')
  const body = JSON.parse(await get(`/api/recall?id=${s.results[0].id}`))
  if (!body.recall?.product) throw new Error('missing product')
})
await check('brand page renders', async () => {
  const idx = JSON.parse(await get('/api/recall'))
  const slug = idx.dataset.brands?.[0]?.slug
  if (!slug) throw new Error('no brands')
  const html = await get(`/brand/${slug}`)
  if (!/recall history/i.test(html)) throw new Error('missing history')
})
await check('sitemap covers recalls', async () => {
  const xml = await get('/sitemap.xml', 60_000)
  const count = (xml.match(/<url>/g) ?? []).length
  if (count < 3000) throw new Error(`only ${count} URLs`)
})
if (failures.length > 0) { console.error(`[health] FAILED: ${failures.join(' | ')}`); process.exit(1) }
console.log('[health] all checks passed')
