import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RecallCheck — Product Recall Database (FDA & CPSC)',
    short_name: 'RecallCheck',
    description: 'Searchable database of official FDA and CPSC product recall records.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fcfcfb',
    theme_color: '#b03a2e',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
