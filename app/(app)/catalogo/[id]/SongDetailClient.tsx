'use client'

import { useState } from 'react'
import { Song, Album, ChecklistStep, SongStatus, getSongStatus } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import ChecklistPanel from '@/components/ChecklistPanel'
import StatusBadge from '@/components/StatusBadge'
import ProgressBar from '@/components/ProgressBar'
import { formatDate, formatTime } from '@/lib/format'
import Link from 'next/link'

export default function SongDetailClient({
  song,
  album,
  steps,
  initialStatus,
}: {
  song: Song
  album: Album | null
  steps: ChecklistStep[]
  initialStatus: SongStatus
}) {
  const [currentSteps, setCurrentSteps] = useState(steps)
  const [status, setStatus] = useState(initialStatus)
  const [notes, setNotes] = useState(song.notes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  const completedCount = currentSteps.filter((s) => s.completed).length
  const progress = (completedCount / 3) * 100

  function handleStepsUpdate(updated: ChecklistStep[]) {
    setCurrentSteps(updated)
    setStatus(getSongStatus(updated))
  }

  async function saveNotes() {
    setSavingNotes(true)
    await supabase.from('songs').update({ notes }).eq('id', song.id)
    setSavingNotes(false)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: '#9CA3AF' }}>
        <Link href="/catalogo" style={{ color: '#9CA3AF' }} className="hover:underline">Catálogo</Link>
        <span>›</span>
        {album && (
          <>
            <Link href={`/albumes/${album.id}`} style={{ color: '#9CA3AF' }} className="hover:underline">{album.name}</Link>
            <span>›</span>
          </>
        )}
        <span style={{ color: '#374151' }}>{song.name}</span>
      </div>

      {/* Header */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          background: 'white',
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
          borderLeft: `4px solid ${album?.color ?? '#E5E7EB'}`,
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>{song.name}</h2>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
              {album?.name} · Track {song.track_number} · {song.genre}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        {song.scheduled_date && (
          <p className="text-sm" style={{ color: '#6B7280' }}>
            📅 {formatDate(song.scheduled_date)}{song.scheduled_time ? ` · ${formatTime(song.scheduled_time)}` : ''}
          </p>
        )}

        <div className="mt-4">
          <ProgressBar
            value={progress}
            color={album?.color ?? '#7AAE8A'}
            label={`${completedCount} de 3 pasos completados`}
          />
        </div>
      </div>

      {/* Checklist */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>Checklist de publicación</h3>
        <ChecklistPanel songId={song.id} steps={currentSteps} onUpdate={handleStepsUpdate} />
      </div>

      {/* Notes */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: '#374151' }}>Notas</h3>
          {notesSaved && (
            <span className="text-xs" style={{ color: '#7AAE8A' }}>✓ Guardado</span>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setNotesSaved(false) }}
          placeholder="Recordatorios, links, pendientes, ideas..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
          style={{ border: '1.5px solid #E5E7EB', background: '#FAFAF8', color: '#374151' }}
          onFocus={(e) => { e.target.style.border = '1.5px solid #7AAE8A' }}
          onBlur={(e) => { e.target.style.border = '1.5px solid #E5E7EB' }}
        />
        <button
          onClick={saveNotes}
          disabled={savingNotes}
          className="mt-3 px-4 py-2 rounded-xl text-sm font-medium"
          style={{
            background: '#7AAE8A',
            color: 'white',
            opacity: savingNotes ? 0.7 : 1,
            cursor: savingNotes ? 'not-allowed' : 'pointer',
          }}
        >
          {savingNotes ? 'Guardando...' : 'Guardar notas'}
        </button>
      </div>
    </div>
  )
}
