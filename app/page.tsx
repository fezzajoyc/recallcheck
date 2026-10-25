import Link from 'next/link'
import type { Metadata } from 'next'
import AdSlot from '@/components/AdSlot'
import { jsonLdScript } from '@/lib/jsonld'
import { BASE, SITE_NAME } from '@/lib/site'
import { indexInfo, latest, years, TYPES } from '@/lib/recalls'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Product Recall Database — FDA & CPSC Recalls, Searchable',
  description: 'Search every FDA food, drug and device recall plus CPSC consumer product recalls — 20,000+ faithful records with brand histories, updated daily from official government data.',
  alternates: { canonical: '/' },
}

export default function Home() {
  const idx = indexInfo()
  const recent = latest(12)
  const yrs = years()
  const siteLd = jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${BASE}/`,
    description: 'Product recall database from official FDA and CPSC records.',
  })

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteLd }} />

      <p className="text-[13px] font-semibold uppercase tracking-widest text-brand">
        {idx.total.toLocaleString('en-US')} official recall records · updated daily
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Product recall database
      </h1>
      <p className="mt-3 text-[15px] text-ink/65">
        Every entry is a faithful transcription of an official FDA or CPSC recall record — food,
        drug, device and consumer product recalls with brand histories. No interpretation, always a
        link to the official page.
      </p>

      <AdSlot slot="home-top" />

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        {TYPES.map((t) => (
          <Link key={t.key} href={`/type/${t.key}`} className="group rounded-xl border border-ink/10 bg-white p-5">
            <span className="block text-[15px] font-semibold group-hover:text-brand">{t.label}</span>
            <span className="mt-1 block text-[13px] text-ink/55">{t.blurb}</span>
            <span className="mt-1 block text-[12.5px] text-ink/40">{(idx.sources[t.key === 'cpsc' ? 'cpsc' : `fda-${t.key}`] ?? 0).toLocaleString('en-US')} records</span>
          </Link>
        ))}
      </section>

      <AdSlot slot="home-middle" />

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Latest recalls</h2>
          <Link href="/latest" className="text-[13.5px] font-medium text-brand hover:underline">View all recent →</Link>
        </div>
        <ul className="mt-4 divide-y divide-ink/8 text-[14px]">
          {recent.map((r) => (
            <li key={r.id} className="py-2.5">
              <Link href={`/recall/${r.id}`} className="flex items-baseline justify-between gap-3 hover:text-brand">
                <span className="truncate font-medium">{r.product.slice(0, 90) || r.title.slice(0, 90)}</span>
                <span className="shrink-0 text-[12.5px] text-ink/50">{r.date}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">Browse by year</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {yrs.map((y) => (
            <Link key={y} href={`/year/${y}`} className="rounded-lg border border-ink/12 bg-white px-3 py-1.5 text-[13px] font-medium hover:border-ink/40">
              {y}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
