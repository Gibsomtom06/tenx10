import type { Metadata } from 'next'
import ArtistsClient from './ArtistsClient'

export const metadata: Metadata = {
  title: 'Artists — TENx10 Management',
  description: 'The TENx10 Management artist roster. DirtySnatcha, WHOiSEE, DARK MATTER and more — managed by Thomas Nalian.',
}

export default function ArtistsPage() {
  return <ArtistsClient />
}
