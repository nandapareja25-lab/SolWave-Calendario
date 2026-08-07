'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/', label: 'Dashboard', icon: '◉' },
  { href: '/hoy', label: 'Hoy', icon: '☀' },
  { href: '/calendario', label: 'Calendario', icon: '▦' },
  { href: '/catalogo', label: 'Catálogo', icon: '♪' },
  { href: '/albumes', label: 'Álbumes', icon: '◈' },
  { href: '/agente', label: 'Asistente', icon: '✦' },
  { href: '/ajustes', label: 'Ajustes', icon: '◎' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="fixed top-0 left-0 h-full w-64 flex-col hidden md:flex"
        style={{
          background: 'white',
          borderRight: '1px solid #F0F0ED',
        }}
      >
        <div className="px-6 py-7 border-b" style={{ borderColor: '#F0F0ED' }}>
          <h1
            className="text-3xl leading-none"
            style={{ fontFamily: 'var(--font-satisfy), cursive', color: '#1A1A1A' }}
          >
            SolWave
          </h1>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Panel Editorial</p>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(({ href, label, icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: active ? '#EEF7F1' : 'transparent',
                  color: active ? '#7AAE8A' : '#6B7280',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t" style={{ borderColor: '#F0F0ED' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{ color: '#9CA3AF' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = '#FDF0F0'
              ;(e.currentTarget as HTMLElement).style.color = '#C47A8A'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = '#9CA3AF'
            }}
          >
            <span>⇦</span> Salir
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 md:hidden"
        style={{ background: 'white', borderBottom: '1px solid #F0F0ED' }}
      >
        <h1
          className="text-2xl leading-none"
          style={{ fontFamily: 'var(--font-satisfy), cursive', color: '#1A1A1A' }}
        >
          SolWave
        </h1>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden"
        style={{
          background: 'white',
          borderTop: '1px solid #F0F0ED',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {NAV.filter(n => n.href !== '/ajustes').map(({ href, label, icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
              style={{ color: active ? '#7AAE8A' : '#9CA3AF' }}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{icon}</span>
              <span style={{ fontSize: '0.6rem', fontWeight: active ? 600 : 400 }}>{label}</span>
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
          style={{ color: '#9CA3AF' }}
        >
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>⇦</span>
          <span style={{ fontSize: '0.6rem' }}>Salir</span>
        </button>
      </nav>
    </>
  )
}
