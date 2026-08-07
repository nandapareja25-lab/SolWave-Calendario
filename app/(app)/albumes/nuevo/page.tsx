'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const COLORES = [
  { label: 'Rosa', value: '#F2A7A7' },
  { label: 'Azul cielo', value: '#B5D5F5' },
  { label: 'Verde salvia', value: '#C3E6CB' },
  { label: 'Lavanda', value: '#D4BBEE' },
  { label: 'Durazno', value: '#FFD6B0' },
  { label: 'Amarillo', value: '#FFF0A0' },
]

export default function NuevoAlbumPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [genre, setGenre] = useState('')
  const [concept, setConcept] = useState('')
  const [emotion, setEmotion] = useState('')
  const [audience, setAudience] = useState('')
  const [color, setColor] = useState('#C3E6CB')
  const [launchDate, setLaunchDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!name.trim() || !genre.trim()) {
      setError('El nombre y el género son obligatorios.')
      return
    }
    setSaving(true)
    setError('')

    const { error: err } = await supabase.from('albums').insert({
      name: name.trim(),
      genre: genre.trim(),
      concept: concept.trim(),
      main_emotion: emotion.trim(),
      target_audience: audience.trim(),
      color,
      total_songs: 0,
      album_launch_date: launchDate || null,
      album_scheduled: false,
      album_published: false,
      youtube_url: null,
      launch_notes: null,
    })

    if (err) {
      setError('Error al guardar: ' + err.message)
      setSaving(false)
      return
    }

    router.push('/albumes')
    router.refresh()
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: '#9CA3AF' }}>
        <Link href="/albumes" className="hover:underline" style={{ color: '#9CA3AF' }}>Álbumes</Link>
        <span>›</span>
        <span style={{ color: '#374151' }}>Álbum nuevo</span>
      </div>

      <h2 className="text-2xl font-semibold mb-6" style={{ color: '#1A1A1A' }}>Nuevo álbum</h2>

      <div
        className="rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Nombre *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del álbum"
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ border: '1.5px solid #E5E7EB', background: '#FAFAF8' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Género *
          </label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="ej. Bachata, Salsa, Indie Folk..."
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ border: '1.5px solid #E5E7EB', background: '#FAFAF8' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Concepto
          </label>
          <textarea
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="De qué trata el álbum..."
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none"
            style={{ border: '1.5px solid #E5E7EB', background: '#FAFAF8' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
              Emoción principal
            </label>
            <input
              type="text"
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              placeholder="ej. Alegría, Desamor..."
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ border: '1.5px solid #E5E7EB', background: '#FAFAF8' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
              Público objetivo
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="ej. 22-40 años..."
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ border: '1.5px solid #E5E7EB', background: '#FAFAF8' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
            Color del álbum
          </label>
          <div className="flex gap-2 flex-wrap">
            {COLORES.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className="w-8 h-8 rounded-full border-2 transition-all"
                style={{
                  background: c.value,
                  borderColor: color === c.value ? '#374151' : 'transparent',
                  transform: color === c.value ? 'scale(1.15)' : 'scale(1)',
                }}
                title={c.label}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-full cursor-pointer border-0"
              title="Color personalizado"
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full border" style={{ background: color }} />
            <span className="text-xs" style={{ color: '#9CA3AF' }}>{color}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Fecha de lanzamiento del álbum completo
          </label>
          <input
            type="date"
            value={launchDate}
            onChange={(e) => setLaunchDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ border: '1.5px solid #E5E7EB', background: '#FAFAF8' }}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Link
            href="/albumes"
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center border"
            style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
          >
            Cancelar
          </Link>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: '#7AAE8A',
              color: 'white',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Guardando...' : 'Crear álbum'}
          </button>
        </div>
      </div>
    </div>
  )
}
