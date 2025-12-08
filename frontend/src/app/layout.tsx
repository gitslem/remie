import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'REMIE - Student Payment Platform',
  description: 'Simplifying school-related, government, and institutional payments for students in Africa',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
