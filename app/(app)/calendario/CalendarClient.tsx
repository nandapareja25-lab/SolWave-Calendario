'use client'

import { useState } from 'react'
import { Album, Song, SongStatus } from '@/lib/supabase'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatTime, formatDateShort, isToday } from '@/lib/format'
import Link from 'next/link'

type SongWithStatus = Song & { status: SongStatus }

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function CalendarClient({
  albums,
  songs,
}: {
  albums: Album[]
  songs: SongWithStatus[]
}) {
  const [view, setView] = useState<'month' | 'list'>('month')
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())

  const albumMap = new Map(albums.map((a) => [a.id, a]))

  const albumLaunchDates = albums.filter((a) => a.album_launch_date).map((a) => ({
    date: a.album_launch_date!,
    album: a,
  }))

  // Group songs by date
  const songsByDate = new Map<string, SongWithStatus[]>()
  for (const song of songs) {
    if (!song.scheduled_date) continue
    if (!songsByDate.has(song.scheduled_date)) songsByDate.set(song.scheduled_date, [])
    songsByDate.get(song.scheduled_date)!.push(song)
  }

  // Month view helpers
  function getMonthDays(year: number, month: number): (string | null)[] {
    const firstDay = new Date(year, month, 1)
    // Monday=0, Sunday=6
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (string | null)[] = Array(startDow).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push(dateStr)
    }
    return cells
  }

  const cells = getMonthDays(currentYear, currentMonth)

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const dateStr = (d: Date) => d.toISOString().split('T')[0]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>Calendario</h2>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Todas las publicaciones programadas</p>
        </div>
        <div
          className="flex rounded-xl overflow-hidden border"
          style={{ borderColor: '#E5E7EB' }}
        >
          {(['month', 'list'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 py-2 text-sm transition-all"
              style={{
                background: view === v ? '#7AAE8A' : 'white',
                color: view === v ? 'white' : '#6B7280',
              }}
            >
              {v === 'month' ? 'Mes' : 'Lista'}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' ? (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
        >
          {/* Month nav */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: '#F0F0ED' }}
          >
            <button onClick={prevMonth} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: '#6B7280' }}>
              ← Anterior
            </button>
            <h3 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>
              {MONTHS_ES[currentMonth]} {currentYear}
            </h3>
            <button onClick={nextMonth} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: '#6B7280' }}>
              Siguiente →
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: '#F0F0ED' }}>
            {DAYS_SHORT.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium" style={{ color: '#9CA3AF' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((date, i) => {
              if (!date) return <div key={i} className="min-h-24 border-r border-b" style={{ borderColor: '#F0F0ED' }} />
              const daySongs = songsByDate.get(date) ?? []
              const dayLaunches = albumLaunchDates.filter((d) => d.date === date)
              const todayCell = isToday(date)

              return (
                <div
                  key={date}
                  className="min-h-24 p-2 border-r border-b flex flex-col gap-1"
                  style={{
                    borderColor: '#F0F0ED',
                    background: todayCell ? '#EEF7F1' : 'white',
                  }}
                >
                  <span
                    className="text-xs font-medium self-start"
                    style={{ color: todayCell ? '#7AAE8A' : '#9CA3AF' }}
                  >
                    {parseInt(date.split('-')[2])}
                  </span>
                  {dayLaunches.map((dl) => (
                    <Link
                      key={dl.album.id}
                      href={`/albumes/${dl.album.id}`}
                      className="text-xs px-1.5 py-0.5 rounded font-semibold truncate"
                      style={{
                        background: dl.album.color + '40',
                        color: dl.album.color,
                        border: `1px solid ${dl.album.color}60`,
                      }}
                      title={`Álbum: ${dl.album.name}`}
                    >
                      💿 {dl.album.name}
                    </Link>
                  ))}
                  {daySongs.map((song) => {
                    const album = albumMap.get(song.album_id)
                    return (
                      <Link
                        key={song.id}
                        href={`/catalogo/${song.id}`}
                        className="text-xs px-1.5 py-0.5 rounded truncate"
                        style={{
                          background: (album?.color ?? '#E5E7EB') + '30',
                          color: '#374151',
                          borderLeft: `3px solid ${album?.color ?? '#E5E7EB'}`,
                        }}
                        title={`${song.name} · ${formatTime(song.scheduled_time ?? '')}`}
                      >
                        {song.name}
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* List view */
        <div className="flex flex-col gap-2">
          {Array.from(
            new Set([
              ...songs.filter((s) => s.scheduled_date).map((s) => s.scheduled_date!),
              ...albumLaunchDates.map((d) => d.date),
            ]).values()
          )
            .sort()
            .map((date) => {
              const daySongs = (songsByDate.get(date) ?? []).sort((a, b) =>
                (a.scheduled_time ?? '').localeCompare(b.scheduled_time ?? '')
              )
              const dayLaunches = albumLaunchDates.filter((d) => d.date === date)
              const todayRow = isToday(date)

              return (
                <div
                  key={date}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: todayRow ? '#EEF7F1' : 'white',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                    border: todayRow ? '1.5px solid #7AAE8A' : 'none',
                  }}
                >
                  <div
                    className="px-5 py-3 border-b flex items-center gap-2"
                    style={{ borderColor: '#F0F0ED' }}
                  >
                    <span className="text-sm font-semibold" style={{ color: todayRow ? '#7AAE8A' : '#374151' }}>
                      {formatDate(date)}
                    </span>
                    {todayRow && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: '#7AAE8A', color: 'white' }}
                      >
                        Hoy
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {dayLaunches.map((dl) => (
                      <Link
                        key={dl.album.id}
                        href={`/albumes/${dl.album.id}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dl.album.color }} />
                        <span className="text-sm font-semibold" style={{ color: '#374151' }}>
                          💿 Álbum completo: {dl.album.name}
                        </span>
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: dl.album.color + '30', color: dl.album.color }}>
                          {dl.album.genre}
                        </span>
                      </Link>
                    ))}
                    {daySongs.map((song) => {
                      const album = albumMap.get(song.album_id)
                      return (
                        <Link
                          key={song.id}
                          href={`/catalogo/${song.id}`}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: album?.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: '#374151' }}>{song.name}</p>
                            <p className="text-xs" style={{ color: '#9CA3AF' }}>{album?.name}</p>
                          </div>
                          <span className="text-xs flex-shrink-0" style={{ color: '#9CA3AF' }}>
                            {formatTime(song.scheduled_time ?? '')}
                          </span>
                          <StatusBadge status={song.status} />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
