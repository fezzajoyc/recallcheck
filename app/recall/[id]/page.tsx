import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import AdSlot from '@/components/AdSlot'
import { jsonLdScript, breadcrumbLd } from '@/lib/jsonld'
import { BASE, DATA_NOTE } from '@/lib/site'
import { typeKey, brandSlugOf, brandRecalls, recallById, latest } from '@/lib/recalls'

/** 召回详情页:忠实转写官方记录。ISR——最新年预渲染,长尾按需。 */
export const revalidate = 86400
export const dynamicParams = true

export function generateStaticParams() {
  return latest(800).map((r) => ({ id: r.id }))
}

function fmtDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || '—'
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' })
}

const SRC_LABEL: Record<string, string> = {
  food: 'FDA food recall',
  drug: 'FDA drug recall',
  device: 'FDA device recall',
  cpsc: 'CPSC product recall',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const r = recallById(id)
  if (!r) return {}
  const cls = r.classification ? ` (${r.classification})` : ''
  return {
    title: `${r.product.slice(0, 80)} recalled ${r.date}${cls} — Recall Record`,
    description: `${SRC_LABEL[typeKey(r.src)]}: ${r.product.slice(0, 140)}. Recalled ${fmtDate(r.date)}${r.reason ? ` — ${r.reason.slice(0, 120)}` : ''}. Faithful transcription of the official record.`.slice(0, 300),
    alternates: { canonical: `/recall/${r.id}` },
  }
}

export default async function RecallPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const r = recallById(id)
  if (!r) notFound()

  const type = typeKey(r.src)
  const brand = brandSlugOf(r)
  const sameBrand = brand ? brandRecalls(brand).filter((x) => x.id !== r.id).slice(0, 8) : []

  const faqLd = jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What product was recalled by ${r.firm || 'the agency'}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${r.product.slice(0, 280)}`,
        },
      },
      ...(r.reason
        ? [
            {
              '@type': 'Question',
              name: `Why was this product recalled?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: r.reason.slice(0, 280),
              },
            },
          ]
        : []),
    ],
  })

  const breadcrumb = breadcrumbLd([
    { name: 'Home', url: `${BASE}/` },
    { name: SRC_LABEL[typeKey(r.src)] ?? 'Recall', url: `${BASE}/type/${type}` },
    { name: r.id },
  ])

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-0.5 border-b border-ink/5 py-2.5 sm:flex-row sm:gap-4">
      <span className="w-44 shrink-0 text-[12px] font-medium uppercase tracking-wider text-ink/45">{label}</span>
      <span className="text-[14px] text-ink/80">{children}</span>
    </div>
  )

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumb }} />

      <p className="text-[13px] font-semibold uppercase tracking-widest text-brand">
        {SRC_LABEL[type] ?? 'Recall'} · {r.date}
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
        {r.product.slice(0, 200) || r.title || r.id}
      </h1>
      {r.classification ? (
        <p className="mt-3 inline-block rounded-lg bg-brand/10 px-3 py-1 text-[13px] font-semibold text-brand">
          {r.classification}
        </p>
      ) : null}

      <AdSlot slot="recall-below-title" />

      <section className="mt-6 rounded-xl border border-ink/10 bg-white p-5">
        {r.reason ? <Row label="Reason for recall">{r.reason}</Row> : null}
        {r.firm ? (
          <Row label="Recalling firm">
            {brand ? (
              <Link href={`/brand/${brand}`} className="font-medium text-brand hover:underline">{r.firm}</Link>
            ) : (
              r.firm
            )}
          </Row>
        ) : null}
        {r.city || r.state || r.country ? (
          <Row label="Firm location">{[r.city, r.state, r.country].filter(Boolean).join(', ')}</Row>
        ) : null}
        <Row label="Recall initiation date">{fmtDate(r.init)}</Row>
        <Row label="Report date">{fmtDate(r.date)}</Row>
        {r.status ? <Row label="Status">{r.status}</Row> : null}
        {r.voluntary ? <Row label="Initiation">{r.voluntary}</Row> : null}
        {r.distribution ? <Row label="Distribution">{r.distribution}</Row> : null}
        {r.quantity ? <Row label="Quantity">{r.quantity}</Row> : null}
        {r.codes ? <Row label="Codes">{r.codes}</Row> : null}
        {r.units ? <Row label="Units">{r.units}</Row> : null}
        {r.hazards && r.hazards.length > 0 ? <Row label="Hazards">{r.hazards.join('; ')}</Row> : null}
        {r.remedies && r.remedies.length > 0 ? <Row label="Remedy">{r.remedies.join('; ')}</Row> : null}
        {r.injuries && r.injuries.length > 0 ? <Row label="Incidents">{r.injuries.join('; ')}</Row> : null}
      </section>

      {r.image ? (
        <p className="mt-4">
          {/* 官方图直链,referrerpolicy 防盗链兼容 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={r.image} alt={`Official recall image for ${r.product.slice(0, 80)}`} className="max-h-80 rounded-xl border border-ink/10" referrerPolicy="no-referrer" loading="lazy" />
        </p>
      ) : null}

      <div className="mt-6 rounded-xl border border-brand/30 bg-brand/5 p-4 text-[13.5px]">
        This is a faithful transcription of an official government record. {DATA_NOTE}
        {' '}
        <a href={r.official} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
          View the official page ↗
        </a>
      </div>

      {sameBrand.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Other recalls involving {r.firm?.split(';')[0]}</h2>
          <ul className="mt-3 divide-y divide-ink/8 text-[13.5px]">
            {sameBrand.map((x) => (
              <li key={x.id} className="py-2">
                <Link href={`/recall/${x.id}`} className="flex items-baseline justify-between gap-3 hover:text-brand">
                  <span className="truncate">{x.product.slice(0, 90) || x.title.slice(0, 90)}</span>
                  <span className="shrink-0 text-ink/50">{x.date}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
