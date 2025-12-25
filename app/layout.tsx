import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Area Paziente',
  description: 'Portale pazienti',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}

