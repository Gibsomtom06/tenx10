import type { Metadata } from 'next'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: 'About — Thomas Nalian | TENx10 Management',
  description: 'Thomas Nalian is the founder of TENx10 Management and head of DirtySnatcha Records. Music manager, A&R, and technology builder based in Detroit.',
}

export default function AboutPage() {
  return <AboutClient />
}
