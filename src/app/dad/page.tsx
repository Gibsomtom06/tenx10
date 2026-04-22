import type { Metadata } from 'next'
import DADClient from './DADClient'

export const metadata: Metadata = {
  title: 'DAD — Digital Asset Declutterer | Autonomous AI for Your Digital Life',
  description: 'One AI that autonomously cleans, labels, and organizes all your email accounts, cloud drives, and files. Built for entrepreneurs running multiple businesses.',
}

export default function DADPage() {
  return <DADClient />
}
