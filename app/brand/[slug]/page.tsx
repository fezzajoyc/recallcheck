import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import AdSlot from '@/components/AdSlot'
import { brandRecalls, indexInfo } from '@/lib/recalls'

export const revalidate = 86400
export const dynamicParams = true

export function generateStaticParams() {
  return indexInfo().brands.slice(0, 400).map((b) => ({ slug: b.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const rows = brandRecalls(slug)
  if (rows.length === 0) return {}
  return {
    title: `${rows[0].firm?.split(';')[0] ?? slug} — Recall History (${rows.length} Records)`,
    description: `All ${rows.length} FDA and CPSC recall records involving ${rows[0].firm?.split(';')[0] ?? slug} in our database, faithful to official records.`,
    alternates: { canonical: `/brand/${slug}` },
  }
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const rows = brandRecalls(slug).slice(0, 300)
  if (rows.length === 0) notFound()
  const name = rows[0].firm?.split(';')[0] ?? slug

  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-widest text-brand">
        {rows.length} recall records · NCES-free · official sources
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{name} recall history</h1>
      <p className="mt-3 text-[15px] text-ink/65">
        Every FDA and CPSC record involving this company in our database, newest first. Record
        volume spans decades and product categories — it is a count, not a judgment.
      </p>

      <AdSlot slot="brand-top" />

      <ul className="mt-6 divide-y divide-ink/8 text-[14px]">
        {rows.map((r) => (
          <li key={r.id} className="py-2.5">
            <Link href={`/recall/${r.id}`} className="flex items-baseline justify-between gap-3 hover:text-brand">
              <span className="truncate font-medium">{r.product.slice(0, 100) || r.title.slice(0, 100)}</span>
              <span className="shrink-0 text-[12.5px] text-ink/50">{r.date}</span>
            </Link>
          </li>
        ))}
      </ul>

      <AdSlot slot="brand-bottom" />
    </div>
  )
}
