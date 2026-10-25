import Link from 'next/link'
import { DATA_NOTE } from '@/lib/site'
import { indexInfo } from '@/lib/recalls'

export default function Footer() {
  const idx = indexInfo()
  return (
    <footer className="border-t border-ink/10 bg-white">
      <div className="mx-auto w-full max-w-4xl px-5 py-8 text-[13px] leading-relaxed text-ink/55">
        <p>
          {DATA_NOTE} Sources: <a href="https://open.fda.gov/" target="_blank" rel="noopener noreferrer" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">openFDA</a> (food/drug/device enforcement) and <a href="https://www.cpsc.gov/Recalls" target="_blank" rel="noopener noreferrer" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">CPSC</a> — {idx.total.toLocaleString('en-US')} records. This site is an independent reference and is not affiliated with FDA or CPSC.
        </p>
        <p className="mt-3">
          <Link href="/sitemap.xml" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">Sitemap</Link> ·{' '}
          <Link href="/llms.txt" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">llms.txt</Link> ·{' '}
          <Link href="/api/recall" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">JSON API</Link>
        </p>
      </div>
    </footer>
  )
}
