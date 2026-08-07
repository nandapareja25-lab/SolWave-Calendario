'use client'

import { useState, useMemo } from 'react'
import { Album, Song, SongStatus, STATUS_LABELS } from '@/lib/supabase'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatTime, isPast } from '@/lib/format'
import Link from 'next/link'

type SongRow = Song & { status: SongStatus; hasNotes: boolean }

const ALL_STATUSES: SongStatus[] = ['not_started', 'in_production', 'published']

export default function CatalogoClient({
  albums,
  songs,
}: {
  albums: Album[]
  songs: SongRow[]
}) {
  const [search, setSearch] = useState('')
  const [filterAlbum, setFilterAlbum] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPast, setFilterPast] = useState(false)

  const albumMap = new Map(albums.map((a) => [a.id, a]))

  const filtered = useMemo(() => {
    return songs.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterAlbum && s.album_id !== filterAlbum) return false
      if (filterStatus && s.status !== filterStatus) return false
      if (filterPast && !(s.scheduled_date && isPast(s.scheduled_date))) return false
      return true
    })
  }, [songs, search, filterAlbum, filterStatus, filterPast])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>Catálogo</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
          {songs.length} canciones en total
        </p>
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-4 mb-6 flex flex-wrap gap-3"
        style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        <input
          type="text"
          placeholder="Buscar canción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 rounded-xl text-sm border outline-none"
          style={{ border: '1.5px solid #E5E7EB', background: '#FAFAF8' }}
        />

        <select
          value={filterAlbum}
          onChange={(e) => setFilterAlbum(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm border outline-none"
          style={{ border: '1.5px solid #E5E7EB', background: '#FAFAF8', color: '#374151' }}
        >
          <option value="">Todos los álbumes</option>
          {albums.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm border outline-none"
          style={{ border: '1.5px solid #E5E7EB', background: '#FAFAF8', color: '#374151' }}
        >
          <option value="">Todos los estados</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#6B7280' }}>
          <input
            type="checkbox"
            checked={filterPast}
            onChange={(e) => setFilterPast(e.target.checked)}
            className="rounded"
          />
          Solo atrasadas
        </label>

        {(search || filterAlbum || filterStatus || filterPast) && (
          <button
            onClick={() => { setSearch(''); setFilterAlbum(''); setFilterStatus(''); setFilterPast(false) }}
            className="text-sm px-3 py-2 rounded-xl"
            style={{ color: '#9CA3AF' }}
          >
            Limpiar
          </button>
        )}
      </div>

      <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>
        {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Song list */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p style={{ color: '#9CA3AF' }}>No hay canciones que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#F0F0ED' }}>
            {filtered.map((song) => {
              const album = albumMap.get(song.album_id)
              const past = song.scheduled_date && isPast(song.scheduled_date) && song.status !== 'published'

              return (
                <Link
                  key={song.id}
                  href={`/catalogo/${song.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <span
                    className="w-1.5 h-8 rounded-full flex-shrink-0"
                    style={{ background: album?.color ?? '#E5E7EB' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>
                        {song.name}
                      </p>
                      {song.hasNotes && (
                        <span title="Tiene notas" style={{ color: '#FFB347', fontSize: '0.75rem' }}>📝</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#9CA3AF' }}>
                      {album?.name} · Track {song.track_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {song.scheduled_date && (
                      <span className="text-xs" style={{ color: past ? '#C47A8A' : '#9CA3AF' }}>
                        {formatDate(song.scheduled_date)} · {song.scheduled_time ? formatTime(song.scheduled_time) : ''}
                      </span>
                    )}
                    <StatusBadge status={song.status} />
                    {past && (
                      <span style={{ color: '#EF4444', fontSize: '0.75rem' }}>⚠</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
