import type { Metadata } from 'next'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: 'About — TENx10',
  description: 'TENx10 is an AI-powered artist management platform built by a manager who was tired of running his business on spreadsheets. Booking intelligence, streaming analytics, revenue tracking, and daily AI briefings for independent artists and labels.',
}

export default function AboutPage() {
  return <AboutClient />
}
