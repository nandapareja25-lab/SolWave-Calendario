import type { Metadata } from 'next'
import { Inter, Satisfy } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const satisfy = Satisfy({
  variable: '--font-satisfy',
  weight: '400',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SolWave — Panel Editorial',
  description: 'Gestión del catálogo y calendario de publicaciones de SolWave',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${satisfy.variable} h-full antialiased`}>
      <body className="min-h-full" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
