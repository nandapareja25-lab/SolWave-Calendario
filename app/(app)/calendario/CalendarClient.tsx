'use client'

import { useState } from 'react'

type Entry = {
  date: string
  day: string
  type: string
  title: string
  album: string
  genre: string
  status: string
  adaptive: boolean
  week: number
  weekDates: string
  note?: string
}

const GENRE_COLORS: Record<string, string> = {
  'Bachata': '#F2A7A7',
  'Salsa': '#86EFAC',
  'Dancehall': '#93C5FD',
  'Indie Folk': '#A7F3D0',
  'Pop Soul': '#C4B5FD',
  'Pop Soul/Balada': '#DDD6FE',
  'Regional romántico': '#FCA5A5',
  'Cumbia argentina': '#FCD34D',
  'TBD': '#E5E7EB',
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function typeLabel(e: Entry) {
  if (e.adaptive) return '📊 Adaptativo'
  if (e.type === 'Completa') return '▶ Completa'
  return '⚡ Short'
}

function typeBg(e: Entry) {
  if (e.adaptive) return '#FDE68A'
  if (e.type === 'Completa') return '#DBEAFE'
  return '#F3F4F6'
}

function typeColor(e: Entry) {
  if (e.adaptive) return '#92400E'
  if (e.type === 'Completa') return '#1D4ED8'
  return '#374151'
}

function isToday(dateStr: string) {
  return new Date().toISOString().split('T')[0] === dateStr
}

export default function CalendarClient({ entries }: { entries: Entry[] }) {
  const [view, setView] = useState<'list' | 'month'>('list')
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(7) // August = index 7

  const byDate = new Map<string, Entry[]>()
  for (const e of entries) {
    if (!byDate.has(e.date)) byDate.set(e.date, [])
    byDate.get(e.date)!.push(e)
  }

  // Group by week for list view
  const byWeek = new Map<number, { dates: string; entries: Entry[] }>()
  for (const e of entries) {
    if (!byWeek.has(e.week)) byWeek.set(e.week, { dates: e.weekDates, entries: [] })
    byWeek.get(e.week)!.entries.push(e)
  }

  function getMonthDays(year: number, month: number): (string | null)[] {
    const firstDay = new Date(year, month, 1)
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (string | null)[] = Array(startDow).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    }
    return cells
  }

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const cells = getMonthDays(currentYear, currentMonth)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>Calendario YouTube</h2>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
            12 semanas · 8 ago – 31 oct 2026 · 2 completas + 3 Shorts/semana
          </p>
        </div>
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: '#E5E7EB' }}>
          {(['list', 'month'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 py-2 text-sm transition-all"
              style={{
                background: view === v ? '#7AAE8A' : 'white',
                color: view === v ? 'white' : '#6B7280',
              }}
            >
              {v === 'list' ? 'Semanas' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      {view === 'list' ? (
        <div className="flex flex-col gap-3">
          {Array.from(byWeek.entries()).map(([week, { dates, entries: wEntries }]) => (
            <div
              key={week}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
            >
              <div
                className="flex items-center gap-3 px-5 py-3 border-b"
                style={{ borderColor: '#F0F0ED' }}
              >
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-lg"
                  style={{ background: '#1A1A1A', color: 'white' }}
                >
                  Sem {week}
                </span>
                <span className="text-sm font-medium" style={{ color: '#374151' }}>{dates}</span>
              </div>
              <div className="divide-y" style={{ borderColor: '#F9F9F7' }}>
                {wEntries.map((e, i) => {
                  const bg = GENRE_COLORS[e.genre] ?? '#E5E7EB'
                  const today = isToday(e.date)
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-5 py-3"
                      style={{ background: today ? '#EEF7F1' : undefined }}
                    >
                      <span className="text-xs w-20 flex-shrink-0" style={{ color: '#9CA3AF' }}>
                        {e.day} {e.date.slice(8)}
                      </span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: typeBg(e), color: typeColor(e) }}
                      >
                        {typeLabel(e)}
                      </span>
                      <span
                        className="flex-1 text-sm font-medium truncate"
                        style={{ color: e.adaptive ? '#B56A3A' : '#1A1A1A', fontStyle: e.adaptive ? 'italic' : undefined }}
                      >
                        {e.title}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
                        style={{ background: bg, color: '#1A1A1A' }}
                      >
                        {e.genre}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
        >
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

          <div className="grid grid-cols-7 border-b" style={{ borderColor: '#F0F0ED' }}>
            {DAYS_SHORT.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium" style={{ color: '#9CA3AF' }}>
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((date, i) => {
              if (!date) return <div key={i} className="min-h-24 border-r border-b" style={{ borderColor: '#F0F0ED' }} />
              const dayEntries = byDate.get(date) ?? []
              const todayCell = isToday(date)
              return (
                <div
                  key={date}
                  className="min-h-24 p-1.5 border-r border-b flex flex-col gap-1"
                  style={{ borderColor: '#F0F0ED', background: todayCell ? '#EEF7F1' : 'white' }}
                >
                  <span className="text-xs font-medium self-start" style={{ color: todayCell ? '#7AAE8A' : '#9CA3AF' }}>
                    {parseInt(date.split('-')[2])}
                  </span>
                  {dayEntries.map((e, j) => {
                    const bg = GENRE_COLORS[e.genre] ?? '#E5E7EB'
                    return (
                      <div
                        key={j}
                        className="text-xs px-1.5 py-0.5 rounded truncate"
                        style={{
                          background: bg + '50',
                          color: '#374151',
                          borderLeft: `3px solid ${bg}`,
                          fontStyle: e.adaptive ? 'italic' : undefined,
                        }}
                        title={`${e.title} · ${e.genre} · ${typeLabel(e)}`}
                      >
                        {e.title}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
