import type { MetadataRoute } from 'next'
import { BASE } from '@/lib/site'
import { allSorted, topBrands, years, TYPES } from '@/lib/recalls'

/** 首页 + latest + 类型 + 年份 + Top 2000 品牌 + 最新年全部召回。长尾靠品牌/年份枢纽发现。 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const base: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${BASE}/latest`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/brands`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    ...TYPES.map((t) => ({ url: `${BASE}/type/${t.key}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.8 })),
  ]
  const yearUrls: MetadataRoute.Sitemap = years().map((y) => ({
    url: `${BASE}/year/${y}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))
  const brandUrls: MetadataRoute.Sitemap = topBrands(2000).map((b) => ({
    url: `${BASE}/brand/${b.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))
  const thisYear = allSorted().filter((r) => r.date.startsWith(String(years()[0]))).map((r) => ({
    url: `${BASE}/recall/${r.id}`,
    lastModified: new Date(r.date),
    changeFrequency: 'yearly' as const,
    priority: 0.55,
  }))
  return [...base, ...yearUrls, ...brandUrls, ...thisYear]
}
