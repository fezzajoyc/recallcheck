import { NextResponse } from 'next/server'
import { BASE, SITE_NAME } from '@/lib/site'
import { indexInfo, years } from '@/lib/recalls'

export const revalidate = 86400

export function GET(): Response {
  const idx = indexInfo()
  const body = `# ${SITE_NAME}

> Product recall database: ${idx.total.toLocaleString('en-US')} official FDA (food/drug/device enforcement) and CPSC records, one faithful page per recall, with brand histories and daily updates.
> Live at ${BASE} . U.S. government public data, transcribed without interpretation; AI crawlers and agents are welcome.

## Endpoints

- ${BASE}/api/recall?id=<recall-id> — one record (ids look like fda-75272 / cpsc-11031)
- ${BASE}/api/recall?q=<brand keyword> — brand search
- ${BASE}/sitemap.xml — URL list (latest year + brand hubs + year hubs)

## Pages

- /recall/<id> — one page per recall: product, reason, classification, firm, dates, distribution, codes, official link
- /brand/<slug> — a company's full recall history (record count is a count, not a safety judgment)
- /type/<food|drug|device|cpsc>, /year/<year>, /latest

## Facts & policy

- Sources: openFDA (food/drug/device enforcement) and CPSC RestWebServices; transcribed as-is.
- This site adds no interpretation and gives no safety advice; always follow the official page linked on each record.
`
  return new NextResponse(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400' },
  })
}
