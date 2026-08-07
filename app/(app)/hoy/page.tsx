import { supabase } from '@/lib/supabase'
import { getSongStatus, ChecklistStep } from '@/lib/supabase'
import ChecklistPanel from '@/components/ChecklistPanel'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatTime } from '@/lib/format'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getData() {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const [{ data: albums }, { data: todaySongs }, { data: tomorrowSongs }, { data: allSongs }, { data: steps }] = await Promise.all([
    supabase.from('albums').select('*'),
    supabase.from('songs').select('*').eq('scheduled_date', today).order('scheduled_time'),
    supabase.from('songs').select('*').eq('scheduled_date', tomorrow).order('scheduled_time'),
    supabase.from('songs').select('*'),
    supabase.from('checklist_steps').select('*'),
  ])

  return {
    albums: albums ?? [],
    todaySongs: todaySongs ?? [],
    tomorrowSongs: tomorrowSongs ?? [],
    allSongs: allSongs ?? [],
    steps: steps ?? [],
    today,
  }
}

export default async function HoyPage() {
  const { albums, todaySongs, tomorrowSongs, allSongs, steps, today } = await getData()

  const stepsMap = new Map<string, ChecklistStep[]>()
  for (const step of steps) {
    if (!stepsMap.has(step.song_id)) stepsMap.set(step.song_id, [])
    stepsMap.get(step.song_id)!.push(step)
  }

  const atrasadas = allSongs.filter((s) => {
    if (!s.scheduled_date || s.scheduled_date >= today) return false
    const status = getSongStatus(stepsMap.get(s.id) ?? [])
    return status !== 'published' && status !== 'complete'
  })

  const albumMap = new Map(albums.map((a) => [a.id, a]))

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>Vista de hoy</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>{formatDate(today)}</p>
      </div>

      {/* Hoy */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: '#9CA3AF' }}>
          Hoy ({todaySongs.length})
        </h3>

        {todaySongs.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
          >
            <p style={{ color: '#9CA3AF' }}>No hay publicaciones programadas para hoy.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {todaySongs.map((song) => {
              const songSteps = stepsMap.get(song.id) ?? []
              const status = getSongStatus(songSteps)
              const album = albumMap.get(song.album_id)
              const pendingCount = songSteps.filter((s) => !s.completed).length

              return (
                <div
                  key={song.id}
                  className="rounded-2xl p-6"
                  style={{
                    background: 'white',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                    borderLeft: `4px solid ${album?.color ?? '#E5E7EB'}`,
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold" style={{ color: '#1A1A1A' }}>{song.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                        {album?.name} · {formatTime(song.scheduled_time ?? '13:00')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={status} />
                      {pendingCount > 0 && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: '#FFF4EC', color: '#B56A3A' }}
                        >
                          {pendingCount} pendientes
                        </span>
                      )}
                    </div>
                  </div>
                  <ChecklistPanel songId={song.id} steps={songSteps} compact />
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Atrasadas */}
      {atrasadas.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: '#C47A8A' }}>
            ⚠ Atrasadas ({atrasadas.length})
          </h3>
          <div
            className="rounded-2xl divide-y overflow-hidden"
            style={{
              background: 'white',
              boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
              border: '1px solid #F2A7A7',
            }}
          >
            {atrasadas.slice(0, 8).map((song) => {
              const status = getSongStatus(stepsMap.get(song.id) ?? [])
              return (
                <Link
                  key={song.id}
                  href={`/catalogo/${song.id}`}
                  className="flex items-center justify-between px-5 py-3 text-sm hover:bg-rose-50 transition-colors"
                  style={{ color: '#374151' }}
                >
                  <span>{song.name}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={status} />
                    <span style={{ color: '#C47A8A', fontSize: '0.75rem' }}>
                      {formatDate(song.scheduled_date!)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Mañana */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: '#9CA3AF' }}>
          Mañana ({tomorrowSongs.length})
        </h3>
        {tomorrowSongs.length === 0 ? (
          <p className="text-sm" style={{ color: '#9CA3AF' }}>No hay publicaciones programadas para mañana.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {tomorrowSongs.map((song) => {
              const album = albumMap.get(song.album_id)
              return (
                <div
                  key={song.id}
                  className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{ background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: album?.color }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#374151' }}>{song.name}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>{album?.name}</p>
                    </div>
                  </div>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>
                    {formatTime(song.scheduled_time ?? '13:00')}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
