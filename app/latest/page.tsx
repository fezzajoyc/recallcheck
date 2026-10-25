import Link from 'next/link'
import type { Metadata } from 'next'
import AdSlot from '@/components/AdSlot'
import { latest } from '@/lib/recalls'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Latest Recalls — FDA & CPSC, Updated Daily',
  description: 'The most recent FDA food, drug and device recalls plus CPSC consumer product recalls — faithful transcriptions of official records, updated daily.',
  alternates: { canonical: '/latest' },
}

export default function LatestPage() {
  const rows = latest(100)
  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-widest text-brand">Updated daily · official sources</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Latest recalls</h1>
      <p className="mt-3 text-[15px] text-ink/65">The 100 most recent records across all categories.</p>

      <AdSlot slot="latest-top" />

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
    </div>
  )
}
