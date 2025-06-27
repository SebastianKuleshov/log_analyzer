import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Log Analyzer',
  description: 'Professional log analysis tool created by Kuleshov Sebastian',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
