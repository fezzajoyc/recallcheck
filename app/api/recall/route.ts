import { NextResponse } from 'next/server'
import { indexInfo, recallById } from '@/lib/recalls'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const q = searchParams.get('q')

  if (id) {
    const r = recallById(id)
    if (!r) return NextResponse.json({ error: 'unknown recall id' }, { status: 404 })
    return NextResponse.json(
      { recall: r, official: r.official },
      { headers: { 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=3600' } },
    )
  }
  if (q) {
    const needle = q.trim().toLowerCase()
    const { allSorted } = await import('@/lib/recalls')
    const hits = allSorted().filter((r) => (r.firm ?? '').toLowerCase().includes(needle) || r.product.toLowerCase().includes(needle)).slice(0, 30)
    return NextResponse.json(
      { query: q, results: hits.map((r) => ({ id: r.id, product: r.product.slice(0, 120), date: r.date, firm: r.firm })) },
      { headers: { 'access-control-allow-origin': '*' } },
    )
  }
  return NextResponse.json({ dataset: indexInfo(), usage: '?id=<recall-id> for one record; ?q=<keyword> to search' }, { headers: { 'access-control-allow-origin': '*' } })
}
