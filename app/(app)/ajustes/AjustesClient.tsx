'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AjustesClient({ initialCatchup }: { initialCatchup: boolean }) {
  const [catchup, setCatchup] = useState(initialCatchup)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  async function saveCatchup(val: boolean) {
    setSaving(true)
    await supabase
      .from('app_settings')
      .upsert({ key: 'allow_catchup_days', value: val })
    setCatchup(val)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>Ajustes</h2>
      </div>

      <div
        className="rounded-2xl p-6 mb-4"
        style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: '#374151' }}>
              Permitir días de catch-up
            </h3>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
              Cuando está activo, el algoritmo puede sugerir una tercera publicación en el mismo día
              (1:00 p.&thinsp;m., 5:00 p.&thinsp;m. y 8:30 p.&thinsp;m.) si los dos primeros huecos ya están ocupados.
              Siempre pide confirmación antes de asignar la tercera.
            </p>
          </div>
          <button
            onClick={() => saveCatchup(!catchup)}
            disabled={saving}
            className="flex-shrink-0 ml-4 mt-0.5 w-11 h-6 rounded-full transition-all relative"
            style={{
              background: catchup ? '#7AAE8A' : '#D1D5DB',
              opacity: saving ? 0.7 : 1,
            }}
          >
            <span
              className="absolute top-1 rounded-full w-4 h-4 bg-white shadow transition-all"
              style={{ left: catchup ? '1.5rem' : '0.25rem' }}
            />
          </button>
        </div>
        {saved && (
          <p className="text-xs mt-3" style={{ color: '#7AAE8A' }}>✓ Configuración guardada</p>
        )}
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        <h3 className="text-sm font-semibold mb-1" style={{ color: '#374151' }}>Sesión</h3>
        <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
          Aplicación de uso personal. Solo una cuenta administradora.
        </p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl text-sm"
          style={{ background: '#FDF0F0', color: '#C47A8A' }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
