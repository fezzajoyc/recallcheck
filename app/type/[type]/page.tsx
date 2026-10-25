import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import AdSlot from '@/components/AdSlot'
import { byType, TYPES } from '@/lib/recalls'

export const revalidate = 86400

export function generateStaticParams() {
  return TYPES.map((t) => ({ type: t.key }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>
}): Promise<Metadata> {
  const { type } = await params
  const t = TYPES.find((x) => x.key === type)
  if (!t) return {}
  return {
    title: `${t.label} — Full Database`,
    description: `${t.blurb} Faithful transcriptions of official records, one page per recall.`,
    alternates: { canonical: `/type/${type}` },
  }
}

export default async function TypePage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const { type } = await params
  const t = TYPES.find((x) => x.key === type)
  if (!t) notFound()
  const rows = byType(type).slice(0, 200)

  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-widest text-brand">Category</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t.label}</h1>
      <p className="mt-3 text-[15px] text-ink/65">{t.blurb} Showing the 200 most recent records.</p>

      <AdSlot slot="type-top" />

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

      <AdSlot slot="type-bottom" />
    </div>
  )
}
