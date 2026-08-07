import { supabase } from '@/lib/supabase'
import { getSongStatus, ChecklistStep, getAlbumStatus, ALBUM_STATUS_LABELS } from '@/lib/supabase'
import ProgressBar from '@/components/ProgressBar'
import { formatDate } from '@/lib/format'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getData() {
  const [{ data: albums }, { data: songs }, { data: steps }] = await Promise.all([
    supabase.from('albums').select('*').order('created_at'),
    supabase.from('songs').select('*'),
    supabase.from('checklist_steps').select('*'),
  ])

  const stepsMap = new Map<string, ChecklistStep[]>()
  for (const step of steps ?? []) {
    if (!stepsMap.has(step.song_id)) stepsMap.set(step.song_id, [])
    stepsMap.get(step.song_id)!.push(step)
  }

  return { albums: albums ?? [], songs: songs ?? [], stepsMap }
}

export default async function AlbumesPage() {
  const { albums, songs, stepsMap } = await getData()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>Álbumes</h2>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>{albums.length} álbumes</p>
        </div>
        <Link
          href="/albumes/nuevo"
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: '#7AAE8A', color: 'white' }}
        >
          + Álbum nuevo
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {albums.map((album) => {
          const albumSongs = songs.filter((s) => s.album_id === album.id)
          const published = albumSongs.filter((s) => {
            const st = getSongStatus(stepsMap.get(s.id) ?? [])
            return st === 'published' || st === 'complete'
          }).length
          const pct = albumSongs.length > 0 ? (published / albumSongs.length) * 100 : 0
          const albumStatus = getAlbumStatus(album)

          const nextSong = albumSongs
            .sort((a, b) => (a.track_number ?? 0) - (b.track_number ?? 0))
            .find((s) => {
              const st = getSongStatus(stepsMap.get(s.id) ?? [])
              return st !== 'published' && st !== 'complete'
            })

          return (
            <Link
              key={album.id}
              href={`/albumes/${album.id}`}
              className="rounded-2xl p-6 block hover:shadow-md transition-shadow"
              style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ background: album.color }}
                  />
                  <div>
                    <h3
                      className="text-base font-semibold"
                      style={{ fontFamily: 'var(--font-satisfy), cursive', color: '#1A1A1A' }}
                    >
                      {album.name}
                    </h3>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{album.genre}</p>
                  </div>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background:
                      albumStatus === 'published' ? '#EEF5FD' :
                      albumStatus === 'scheduled' ? '#F2EDF9' : '#F3F4F6',
                    color:
                      albumStatus === 'published' ? '#3B7CBF' :
                      albumStatus === 'scheduled' ? '#7A5BAD' : '#9CA3AF',
                  }}
                >
                  {ALBUM_STATUS_LABELS[albumStatus]}
                </span>
              </div>

              <ProgressBar value={pct} color={album.color} label={`${published}/${albumSongs.length} canciones publicadas`} />

              <div className="mt-4 text-xs" style={{ color: '#9CA3AF' }}>
                {nextSong ? (
                  <span>Próxima: <span style={{ color: '#374151' }}>{nextSong.name}</span></span>
                ) : (
                  <span style={{ color: '#7AAE8A' }}>✓ Todas publicadas</span>
                )}
              </div>

              {album.album_launch_date && (
                <div className="mt-1 text-xs" style={{ color: '#9CA3AF' }}>
                  Lanzamiento álbum: {formatDate(album.album_launch_date)}
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
