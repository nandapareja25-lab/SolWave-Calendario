import { supabase } from '@/lib/supabase'
import { getSongStatus, ChecklistStep, getAlbumStatus, ALBUM_STATUS_LABELS } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ProgressBar from '@/components/ProgressBar'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatTime } from '@/lib/format'
import Link from 'next/link'
import AlbumStatusEditor from './AlbumStatusEditor'

export const dynamic = 'force-dynamic'

export default async function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [{ data: album }, { data: songs }, { data: steps }] = await Promise.all([
    supabase.from('albums').select('*').eq('id', id).single(),
    supabase.from('songs').select('*').eq('album_id', id).order('track_number'),
    supabase.from('checklist_steps').select('*'),
  ])

  if (!album) notFound()

  const stepsMap = new Map<string, ChecklistStep[]>()
  for (const step of steps ?? []) {
    if (!stepsMap.has(step.song_id)) stepsMap.set(step.song_id, [])
    stepsMap.get(step.song_id)!.push(step)
  }

  const songsWithStatus = (songs ?? []).map((s) => ({
    ...s,
    status: getSongStatus(stepsMap.get(s.id) ?? []),
  }))

  const published = songsWithStatus.filter((s) => s.status === 'published' || s.status === 'complete').length
  const pct = songsWithStatus.length > 0 ? (published / songsWithStatus.length) * 100 : 0

  const nextSong = songsWithStatus.find((s) => s.status !== 'published' && s.status !== 'complete')
  const lastPending = songsWithStatus.filter((s) => s.status !== 'published' && s.status !== 'complete').at(-1)
  const estimatedEnd = lastPending?.scheduled_date

  const albumStatus = getAlbumStatus(album)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: '#9CA3AF' }}>
        <Link href="/albumes" className="hover:underline" style={{ color: '#9CA3AF' }}>Álbumes</Link>
        <span>›</span>
        <span style={{ color: '#374151' }}>{album.name}</span>
      </div>

      {/* Album header */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          background: 'white',
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
          borderLeft: `4px solid ${album.color}`,
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2
              className="text-2xl font-semibold"
              style={{ fontFamily: 'var(--font-satisfy), cursive', color: '#1A1A1A' }}
            >
              {album.name}
            </h2>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>{album.genre}</p>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded-full"
            style={{
              background:
                albumStatus === 'published' ? '#EEF5FD' :
                albumStatus === 'scheduled' ? '#F2EDF9' : '#F3F4F6',
              color:
                albumStatus === 'published' ? '#3B7CBF' :
                albumStatus === 'scheduled' ? '#7A5BAD' : '#9CA3AF',
            }}
          >
            Álbum completo: {ALBUM_STATUS_LABELS[albumStatus]}
          </span>
        </div>

        <p className="text-sm mb-4" style={{ color: '#6B7280' }}>{album.concept}</p>

        <ProgressBar
          value={pct}
          color={album.color}
          label={`${published}/${songsWithStatus.length} canciones publicadas`}
        />

        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          {nextSong && (
            <div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Próxima canción</p>
              <p style={{ color: '#374151' }}>{nextSong.name}</p>
              {nextSong.scheduled_date && (
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  {formatDate(nextSong.scheduled_date)}
                </p>
              )}
            </div>
          )}
          {estimatedEnd && (
            <div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Fin estimado canciones</p>
              <p style={{ color: '#374151' }}>{formatDate(estimatedEnd)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Album complete status editor */}
      <AlbumStatusEditor album={album} />

      {/* Song list */}
      <div
        className="rounded-2xl overflow-hidden mt-6"
        style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#F0F0ED' }}>
          <h3 className="text-sm font-semibold" style={{ color: '#374151' }}>Canciones</h3>
          <Link
            href={`/albumes/${album.id}/nueva-cancion`}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: '#EEF7F1', color: '#7AAE8A' }}
          >
            + Agregar canción
          </Link>
        </div>
        <div className="divide-y" style={{ borderColor: '#F0F0ED' }}>
          {songsWithStatus.map((song) => (
            <Link
              key={song.id}
              href={`/catalogo/${song.id}`}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs font-mono w-5 text-right flex-shrink-0" style={{ color: '#D1D5DB' }}>
                {song.track_number}
              </span>
              <p className="flex-1 text-sm" style={{ color: '#374151' }}>{song.name}</p>
              {song.scheduled_date && (
                <span className="text-xs flex-shrink-0" style={{ color: '#9CA3AF' }}>
                  {formatDate(song.scheduled_date)}
                  {song.scheduled_time ? ` · ${formatTime(song.scheduled_time)}` : ''}
                </span>
              )}
              <StatusBadge status={song.status} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
