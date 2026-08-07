'use client'

import { useState } from 'react'
import { Album, Song, STEP_ORDER } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { suggestPublicationDate } from '@/lib/calendar-algorithm'
import { formatDate, formatTime } from '@/lib/format'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NuevaCancionClient({
  album,
  albums,
  songs,
}: {
  album: Album
  albums: Album[]
  songs: Song[]
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [trackNumber, setTrackNumber] = useState('')
  const [duration, setDuration] = useState('')
  const [priority, setPriority] = useState<'normal' | 'high'>('normal')
  const [minDate, setMinDate] = useState('')
  const [suggestion, setSuggestion] = useState<{ date: string; time: string } | null>(null)
  const [chosenDate, setChosenDate] = useState('')
  const [chosenTime, setChosenTime] = useState('')
  const [noDate, setNoDate] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [allowCatchup, setAllowCatchup] = useState(false)
  const [catchupWarning, setCatchupWarning] = useState(false)

  function getSuggestion() {
    const result = suggestPublicationDate({
      songs,
      albums,
      albumId: album.id,
      minDate: minDate || undefined,
      allowCatchup,
    })
    if (result) {
      // Check if it's a catchup (3rd slot)
      const daySlots = songs.filter((s) => s.scheduled_date === result.date).length
      if (daySlots >= 2 && !allowCatchup) {
        setCatchupWarning(true)
        return
      }
      setSuggestion(result)
      setChosenDate(result.date)
      setChosenTime(result.time)
      setShowConfirm(true)
    }
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)

    const finalDate = noDate ? null : chosenDate || null
    const finalTime = noDate ? null : chosenTime || null

    const { data: newSong, error } = await supabase
      .from('songs')
      .insert({
        album_id: album.id,
        name: name.trim(),
        track_number: trackNumber ? parseInt(trackNumber) : null,
        genre: album.genre,
        approximate_duration: duration || null,
        priority,
        notes: null,
        scheduled_date: finalDate,
        scheduled_time: finalTime,
      })
      .select()
      .single()

    if (error || !newSong) { setSaving(false); return }

    // Create checklist steps
    await supabase.from('checklist_steps').insert(
      STEP_ORDER.map((step_key) => ({
        song_id: newSong.id,
        step_key,
        completed: false,
        completed_at: null,
      }))
    )

    router.push(`/albumes/${album.id}`)
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: '#9CA3AF' }}>
        <Link href="/albumes" className="hover:underline" style={{ color: '#9CA3AF' }}>Álbumes</Link>
        <span>›</span>
        <Link href={`/albumes/${album.id}`} className="hover:underline" style={{ color: '#9CA3AF' }}>{album.name}</Link>
        <span>›</span>
        <span style={{ color: '#374151' }}>Nueva canción</span>
      </div>

      <h2 className="text-2xl font-semibold mb-6" style={{ color: '#1A1A1A' }}>Agregar canción</h2>

      <div
        className="rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        {/* Album info */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: album.color + '20', border: `1px solid ${album.color}40` }}
        >
          <span className="w-3 h-3 rounded-full" style={{ background: album.color }} />
          <div>
            <p className="text-sm font-medium" style={{ color: '#374151' }}>{album.name}</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{album.genre}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Nombre de la canción *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la canción"
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ border: '1.5px solid #E5E7EB', background: '#FAFAF8' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
              Número de pista
            </label>
            <input
              type="number"
              value={trackNumber}
              onChange={(e) => setTrackNumber(e.target.value)}
              placeholder="ej. 12"
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ border: '1.5px solid #E5E7EB', background: '#FAFAF8' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
              Duración aprox.
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="ej. 3:45"
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ border: '1.5px solid #E5E7EB', background: '#FAFAF8' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Prioridad</label>
          <div className="flex gap-3">
            {(['normal', 'high'] as const).map((p) => (
              <label key={p} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: '#374151' }}>
                <input
                  type="radio"
                  name="priority"
                  value={p}
                  checked={priority === p}
                  onChange={() => setPriority(p)}
                />
                {p === 'normal' ? 'Normal' : 'Alta'}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Fecha mínima de publicación
          </label>
          <input
            type="date"
            value={minDate}
            onChange={(e) => setMinDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ border: '1.5px solid #E5E7EB', background: '#FAFAF8' }}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: '#6B7280' }}>
          <input
            type="checkbox"
            checked={allowCatchup}
            onChange={(e) => setAllowCatchup(e.target.checked)}
          />
          Permitir día de catch-up (3ª publicación en el mismo día)
        </label>

        {/* Catchup warning */}
        {catchupWarning && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: '#FFF4EC', border: '1px solid #FFD6B0', color: '#B56A3A' }}
          >
            ⚠ El primer hueco disponible requeriría una 3ª publicación en el mismo día.
            Activa "Permitir día de catch-up" para usar ese hueco, o buscaré el siguiente día disponible.
            <button
              onClick={() => { setCatchupWarning(false); setAllowCatchup(true) }}
              className="ml-2 underline text-sm"
            >
              Activar y sugerir
            </button>
          </div>
        )}

        {/* Suggestion */}
        {showConfirm && suggestion && (
          <div
            className="rounded-xl px-4 py-4 flex flex-col gap-3"
            style={{ background: '#EEF7F1', border: '1px solid #C3E6CB' }}
          >
            <p className="text-sm font-medium" style={{ color: '#374151' }}>Fecha sugerida:</p>
            <p className="text-base" style={{ color: '#1A1A1A' }}>
              {formatDate(suggestion.date)} · {formatTime(suggestion.time)}
            </p>

            <div className="grid grid-cols-2 gap-3 mt-1">
              <div>
                <label className="text-xs block mb-1" style={{ color: '#9CA3AF' }}>Cambiar fecha</label>
                <input
                  type="date"
                  value={chosenDate}
                  onChange={(e) => setChosenDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ border: '1.5px solid #E5E7EB' }}
                />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: '#9CA3AF' }}>Cambiar hora</label>
                <input
                  type="time"
                  value={chosenTime}
                  onChange={(e) => setChosenTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ border: '1.5px solid #E5E7EB' }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { getSuggestion() }}
                className="text-sm px-3 py-1.5 rounded-lg"
                style={{ background: '#F3F4F6', color: '#374151' }}
              >
                ↻ Recalcular
              </button>
              <button
                onClick={() => { setNoDate(true); setShowConfirm(false) }}
                className="text-sm px-3 py-1.5 rounded-lg"
                style={{ background: '#F3F4F6', color: '#9CA3AF' }}
              >
                Sin fecha por ahora
              </button>
            </div>
          </div>
        )}

        {noDate && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: '#F3F4F6', color: '#9CA3AF' }}
          >
            La canción se guardará sin fecha de publicación.{' '}
            <button onClick={() => setNoDate(false)} className="underline">Asignar fecha</button>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {!showConfirm && !noDate && (
            <button
              onClick={getSuggestion}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
              style={{ borderColor: '#7AAE8A', color: '#7AAE8A' }}
            >
              Sugerir fecha →
            </button>
          )}

          <button
            onClick={save}
            disabled={!name.trim() || saving || (!showConfirm && !noDate)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: '#7AAE8A',
              color: 'white',
              opacity: (!name.trim() || saving || (!showConfirm && !noDate)) ? 0.5 : 1,
              cursor: (!name.trim() || saving || (!showConfirm && !noDate)) ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar canción'}
          </button>
        </div>
      </div>
    </div>
  )
}
