import { supabase } from '@/lib/supabase'
import { getSongStatus, ChecklistStep, Song, Album } from '@/lib/supabase'
import ProgressBar from '@/components/ProgressBar'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatTime, isPast } from '@/lib/format'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getData() {
  const [{ data: albums }, { data: songs }, { data: steps }] = await Promise.all([
    supabase.from('albums').select('*').order('created_at'),
    supabase.from('songs').select('*').order('scheduled_date', { ascending: true }).order('scheduled_time', { ascending: true }),
    supabase.from('checklist_steps').select('*'),
  ])
  return { albums: albums ?? [], songs: songs ?? [], steps: steps ?? [] }
}

export default async function DashboardPage() {
  const { albums, songs, steps } = await getData()

  const stepsMap = new Map<string, ChecklistStep[]>()
  for (const step of steps) {
    if (!stepsMap.has(step.song_id)) stepsMap.set(step.song_id, [])
    stepsMap.get(step.song_id)!.push(step)
  }

  const songStatuses = songs.map((s) => ({
    song: s,
    status: getSongStatus(stepsMap.get(s.id) ?? []),
  }))

  const totalSongs = songs.length
  const publishedSongs = songStatuses.filter((s) => s.status === 'published').length
  const inProductionSongs = songStatuses.filter((s) => s.status === 'in_production').length
  const pendingSongs = songStatuses.filter((s) => s.status === 'not_started').length
  const overallProgress = totalSongs > 0 ? (publishedSongs / totalSongs) * 100 : 0

  const today = new Date().toISOString().split('T')[0]

  const atrasadas = songStatuses.filter(
    (s) =>
      s.song.scheduled_date &&
      s.song.scheduled_date < today &&
      s.status !== 'published'
  )

  const upcoming = songs.filter(
    (s) => s.scheduled_date && s.scheduled_date >= today
  )
  const nextSong = upcoming[0]

  const albumProgress = albums.map((album) => {
    const albumSongs = songStatuses.filter((s) => s.song.album_id === album.id)
    const pub = albumSongs.filter((s) => s.status === 'published' || s.status === 'complete').length
    return { album, pub, total: albumSongs.length, pct: albumSongs.length > 0 ? (pub / albumSongs.length) * 100 : 0 }
  })
  const mostAdvanced = albumProgress.sort((a, b) => b.pct - a.pct)[0]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>Dashboard</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
          {formatDate(today)}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { label: 'Total', value: totalSongs, color: '#1A1A1A' },
          { label: 'Publicadas', value: publishedSongs, color: '#3B7CBF' },
          { label: 'En producción', value: inProductionSongs, color: '#B56A3A' },
          { label: 'Sin empezar', value: pendingSongs, color: '#9CA3AF' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-5"
            style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
          >
            <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>{s.label}</p>
            <p className="text-3xl font-semibold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress general */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Progreso general del catálogo</h3>
        <ProgressBar value={overallProgress} color="#7AAE8A" label={`${publishedSongs} de ${totalSongs} canciones publicadas`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Próximo lanzamiento */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Próximo lanzamiento</h3>
          {nextSong ? (
            <div>
              <p className="font-medium" style={{ color: '#1A1A1A' }}>{nextSong.name}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                {formatDate(nextSong.scheduled_date!)} · {formatTime(nextSong.scheduled_time!)}
              </p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                {albums.find((a) => a.id === nextSong.album_id)?.name}
              </p>
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Sin próximos lanzamientos</p>
          )}
        </div>

        {/* Álbum más avanzado */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Álbum más avanzado</h3>
          {mostAdvanced && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: mostAdvanced.album.color }}
                />
                <p className="font-medium text-sm" style={{ color: '#1A1A1A' }}>
                  {mostAdvanced.album.name}
                </p>
              </div>
              <ProgressBar
                value={mostAdvanced.pct}
                color={mostAdvanced.album.color}
                label={`${mostAdvanced.pub}/${mostAdvanced.total} canciones`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Publicaciones atrasadas */}
      {atrasadas.length > 0 && (
        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            background: '#FDF0F0',
            border: '1px solid #F2A7A7',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#C47A8A' }}>
            ⚠ Publicaciones atrasadas ({atrasadas.length})
          </h3>
          <div className="flex flex-col gap-2">
            {atrasadas.slice(0, 5).map(({ song, status }) => (
              <Link
                key={song.id}
                href={`/catalogo/${song.id}`}
                className="flex items-center justify-between text-sm py-1 hover:underline"
                style={{ color: '#B05070' }}
              >
                <span>{song.name}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={status} />
                  <span style={{ color: '#C47A8A', fontSize: '0.75rem' }}>
                    {formatDate(song.scheduled_date!)}
                  </span>
                </div>
              </Link>
            ))}
            {atrasadas.length > 5 && (
              <p className="text-xs" style={{ color: '#C47A8A' }}>
                +{atrasadas.length - 5} más
              </p>
            )}
          </div>
        </div>
      )}

      {/* Progreso por álbum */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>Progreso por álbum</h3>
        <div className="flex flex-col gap-4">
          {albumProgress.sort((a, b) => b.pct - a.pct).map(({ album, pub, total, pct }) => (
            <Link key={album.id} href={`/albumes/${album.id}`} className="block group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: album.color }} />
                  <span className="text-sm font-medium group-hover:underline" style={{ color: '#374151' }}>
                    {album.name}
                  </span>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{album.genre}</span>
                </div>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>
                  {pub}/{total}
                </span>
              </div>
              <ProgressBar value={pct} color={album.color} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
