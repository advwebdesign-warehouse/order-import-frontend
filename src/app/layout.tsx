'use client'

import { useAccountInitialization } from '@/hooks/useAccountInitialization'

import './globals.css'
import './print.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ✅ Validates session, redirects if invalid
  useAccountInitialization()

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
