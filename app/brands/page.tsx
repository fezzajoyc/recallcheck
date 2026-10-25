import Link from 'next/link'
import type { Metadata } from 'next'
import AdSlot from '@/components/AdSlot'
import { indexInfo, topBrands } from '@/lib/recalls'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Brands With the Most Recalls — Full Directory',
  description: 'Companies with the most FDA and CPSC recall records in our database — every brand page lists its full recall history.',
  alternates: { canonical: '/brands' },
}

export default function BrandsPage() {
  const idx = indexInfo()
  const brands = topBrands(1000)
  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-widest text-brand">{idx.brands.length.toLocaleString('en-US')} companies tracked</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Brands directory</h1>
      <p className="mt-3 text-[15px] text-ink/65">
        Ranked by number of recall records. A high count reflects record volume over decades —
        never an interpretation of safety.
      </p>

      <AdSlot slot="brands-top" />

      <ul className="mt-6 grid gap-x-6 gap-y-1 text-[14px] sm:grid-cols-2">
        {brands.map((b) => (
          <li key={b.slug} className="flex items-baseline justify-between gap-3 border-b border-ink/5 py-1.5">
            <Link href={`/brand/${b.slug}`} className="truncate font-medium hover:text-brand">{b.slug.replace(/-/g, ' ')}</Link>
            <span className="shrink-0 text-ink/50">{b.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
