import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import AdSlot from '@/components/AdSlot'
import { byYear, years } from '@/lib/recalls'

export const revalidate = 86400

export function generateStaticParams() {
  return years().map((y) => ({ year: String(y) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>
}): Promise<Metadata> {
  const { year } = await params
  return {
    title: `Product Recalls ${year} — Full List`,
    description: `Every FDA and CPSC recall record from ${year} in our database, one page per recall.`,
    alternates: { canonical: `/year/${year}` },
  }
}

export default async function YearPage({
  params,
}: {
  params: Promise<{ year: string }>
}) {
  const { year: y } = await params
  const year = Number(y)
  if (!Number.isInteger(year) || year < 1970 || year > 2100) notFound()
  const rows = byYear(year).slice(0, 300)
  if (rows.length === 0) notFound()
  const idx = years().indexOf(year)
  const prev = years()[idx + 1]
  const next = years()[idx - 1]

  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-widest text-brand">{rows.length}+ records shown</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Recalls in {year}</h1>
      <p className="mt-3 text-[15px] text-ink/65">The most recent 300 records from {year}.</p>

      <AdSlot slot="year-top" />

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

      <AdSlot slot="year-bottom" />

      <nav className="mt-8 flex items-center justify-between gap-3 text-[14px]">
        {prev ? <Link href={`/year/${prev}`} className="font-medium hover:text-brand">← {prev}</Link> : <span />}
        {next ? <Link href={`/year/${next}`} className="font-medium hover:text-brand">{next} →</Link> : <span />}
      </nav>
    </div>
  )
}
