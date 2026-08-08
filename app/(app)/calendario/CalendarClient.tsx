'use client'

import { useState, useEffect } from 'react'

type Slot = { title: string; genre: string }
type Day = {
  date: string
  label: string
  slots: { '10am': Slot; '3pm': Slot; '8pm': Slot }
}

const SLOT_KEYS = ['10am', '3pm', '8pm'] as const
type SlotKey = typeof SLOT_KEYS[number]

const SLOT_META: Record<SlotKey, { time: string; label: string; icon: string }> = {
  '10am': { time: '10:00 AM', label: 'Video completo', icon: '🎵' },
  '3pm':  { time: '3:00 PM',  label: 'Short #1',       icon: '⚡' },
  '8pm':  { time: '8:00 PM',  label: 'Short #2',       icon: '⚡' },
}

const GENRE_COLORS: Record<string, string> = {
  'Bachata':    '#F2A7A7',
  'Salsa':      '#86EFAC',
  'Dancehall':  '#93C5FD',
  'Indie Folk': '#A7F3D0',
  'Pop Soul':   '#C4B5FD',
  'Balada':     '#DDD6FE',
  'Regional':   '#FCA5A5',
  'Cumbia':     '#FCD34D',
}

const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]
const DAYS_SHORT = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

function doneKey(date: string, slot: SlotKey) { return `${date}|${slot}` }
function todayStr() { return new Date().toISOString().split('T')[0] }

function getMonthDays(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1)
  let dow = firstDay.getDay() - 1
  if (dow < 0) dow = 6
  const n = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = Array(dow).fill(null)
  for (let d = 1; d <= n; d++)
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  return cells
}

export default function CalendarClient({
  days,
  doneSet: initial,
}: {
  days: Day[]
  doneSet: string[]
}) {
  const [done, setDone] = useState<Set<string>>(new Set(initial))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [pending, setPending] = useState<Set<string>>(new Set())  // local edits not yet saved
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'month' | 'list'>('month')
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(7) // Aug = 7

  const today = todayStr()
  const dayMap = new Map(days.map(d => [d.date, d]))
  const cells = getMonthDays(currentYear, currentMonth)

  // Stats
  const totalSlots = days.length * 3
  const doneSlots = done.size
  const pct = Math.round((doneSlots / totalSlots) * 100)

  // Slot count per day
  function dayDone(date: string) {
    return SLOT_KEYS.filter(s => done.has(doneKey(date, s))).length
  }

  // Selected day data
  const selDay = selectedDate ? dayMap.get(selectedDate) : null

  // Local state for modal (copy of done + pending edits)
  const [modalState, setModalState] = useState<Record<SlotKey, boolean>>({ '10am': false, '3pm': false, '8pm': false })

  useEffect(() => {
    if (selectedDate) {
      setModalState({
        '10am': done.has(doneKey(selectedDate, '10am')),
        '3pm':  done.has(doneKey(selectedDate, '3pm')),
        '8pm':  done.has(doneKey(selectedDate, '8pm')),
      })
    }
  }, [selectedDate, done])

  function openDay(date: string) {
    if (!dayMap.has(date)) return
    setSelectedDate(date)
  }

  function toggleSlot(slot: SlotKey) {
    setModalState(prev => ({ ...prev, [slot]: !prev[slot] }))
  }

  async function saveProgress() {
    if (!selectedDate || !selDay) return
    setSaving(true)

    const updates = SLOT_KEYS.map(slot => ({
      slot,
      completed: modalState[slot],
      wasCompleted: done.has(doneKey(selectedDate, slot)),
    })).filter(u => u.completed !== u.wasCompleted)

    await Promise.all(updates.map(u =>
      fetch('/api/yt-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, slot: u.slot, completed: u.completed }),
      })
    ))

    // Apply locally
    setDone(prev => {
      const next = new Set(prev)
      SLOT_KEYS.forEach(slot => {
        const key = doneKey(selectedDate, slot)
        if (modalState[slot]) next.add(key)
        else next.delete(key)
      })
      return next
    })

    setSaving(false)
    setSelectedDate(null)
  }

  function DayCell({ date }: { date: string }) {
    const d = dayMap.get(date)
    const n = d ? dayDone(date) : 0
    const isToday = date === today
    const allDone = d && n === 3
    const hasSome = n > 0 && n < 3
    const inCalendar = !!d

    return (
      <div
        onClick={() => inCalendar && openDay(date)}
        className={`min-h-[72px] sm:min-h-24 p-1.5 border-r border-b flex flex-col gap-1 ${inCalendar ? 'cursor-pointer' : ''}`}
        style={{
          borderColor: '#F0F0ED',
          background: isToday ? '#EEF7F1' : allDone ? '#F0FDF4' : 'white',
          transition: 'background 0.15s',
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-semibold"
            style={{
              color: isToday ? '#7AAE8A' : '#9CA3AF',
              background: isToday ? '#D1FAE5' : undefined,
              borderRadius: 4,
              padding: isToday ? '0 4px' : undefined,
            }}
          >
            {parseInt(date.split('-')[2])}
          </span>
          {inCalendar && (
            <span
              className="text-xs font-bold"
              style={{
                color: allDone ? '#059669' : hasSome ? '#F59E0B' : '#9CA3AF',
                fontSize: '0.6rem',
              }}
            >
              {allDone ? '✓' : `${n}/3`}
            </span>
          )}
        </div>
        {inCalendar && (
          <div className="flex gap-0.5 mt-auto">
            {SLOT_KEYS.map(s => (
              <div
                key={s}
                className="flex-1 h-1 rounded-full"
                style={{
                  background: done.has(doneKey(date, s)) ? '#7AAE8A' : '#E5E7EB',
                }}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  function ListRow({ day }: { day: Day }) {
    const n = dayDone(day.date)
    const allDone = n === 3
    const isToday = day.date === today
    return (
      <div
        onClick={() => openDay(day.date)}
        className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer active:opacity-70"
        style={{
          background: isToday ? '#EEF7F1' : allDone ? '#F0FDF4' : 'white',
          border: isToday ? '1.5px solid #7AAE8A' : '1px solid #F0F0ED',
          marginBottom: 6,
        }}
      >
        <div className="w-16 flex-shrink-0">
          <p className="text-xs font-semibold" style={{ color: isToday ? '#7AAE8A' : '#374151' }}>{day.label}</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs truncate" style={{ color: '#6B7280' }}>{day.slots['10am'].title}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {SLOT_KEYS.map(s => (
            <div
              key={s}
              className="w-2 h-2 rounded-full"
              style={{ background: done.has(doneKey(day.date, s)) ? '#7AAE8A' : '#E5E7EB' }}
            />
          ))}
        </div>
        <span
          className="text-xs font-bold flex-shrink-0 w-8 text-right"
          style={{ color: allDone ? '#059669' : '#9CA3AF' }}
        >
          {allDone ? '✓' : `${n}/3`}
        </span>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold" style={{ color: '#1A1A1A' }}>Calendario YouTube</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            Ago–Sep 2026 · 3 publicaciones/día · 10AM · 3PM · 8PM
          </p>
        </div>
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: '#E5E7EB' }}>
          {(['month', 'list'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 py-2 text-sm transition-all"
              style={{ background: view === v ? '#7AAE8A' : 'white', color: view === v ? 'white' : '#6B7280' }}
            >
              {v === 'month' ? 'Mes' : 'Lista'}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-4"
        style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1" style={{ color: '#6B7280' }}>
            <span>Publicaciones completadas</span>
            <span style={{ color: '#1A1A1A', fontWeight: 600 }}>{doneSlots} / {totalSlots}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F0F0ED' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: '#7AAE8A' }}
            />
          </div>
        </div>
        <span className="text-base font-bold flex-shrink-0" style={{ color: '#7AAE8A' }}>{pct}%</span>
      </div>

      {/* Month view */}
      {view === 'month' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#F0F0ED' }}>
            <button
              onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y-1) } else setCurrentMonth(m => m-1) }}
              className="px-3 py-1.5 rounded-lg text-sm" style={{ color: '#6B7280' }}
            >← Anterior</button>
            <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
              {MONTHS_ES[currentMonth]} {currentYear}
            </h3>
            <button
              onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y+1) } else setCurrentMonth(m => m+1) }}
              className="px-3 py-1.5 rounded-lg text-sm" style={{ color: '#6B7280' }}
            >Siguiente →</button>
          </div>
          <div className="grid grid-cols-7 border-b" style={{ borderColor: '#F0F0ED' }}>
            {DAYS_SHORT.map(d => (
              <div key={d} className="py-2 text-center text-xs font-medium" style={{ color: '#9CA3AF' }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((date, i) =>
              date
                ? <DayCell key={date} date={date} />
                : <div key={i} className="min-h-[72px] sm:min-h-24 border-r border-b" style={{ borderColor: '#F0F0ED' }} />
            )}
          </div>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div>
          {['2026-08', '2026-09'].map(month => {
            const monthDays = days.filter(d => d.date.startsWith(month))
            if (!monthDays.length) return null
            const [y, m] = month.split('-')
            return (
              <div key={month} className="mb-6">
                <h3 className="text-sm font-semibold mb-3 px-1" style={{ color: '#374151' }}>
                  {MONTHS_ES[parseInt(m)-1]} {y}
                </h3>
                {monthDays.map(day => <ListRow key={day.date} day={day} />)}
              </div>
            )
          })}
        </div>
      )}

      {/* Day modal / bottom sheet */}
      {selectedDate && selDay && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setSelectedDate(null)}
          />
          {/* Sheet — bottom on mobile, centered on desktop */}
          <div
            className="fixed z-50 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl"
            style={{
              bottom: 0,
              left: 0,
              right: 0,
              maxWidth: 480,
              margin: '0 auto',
              padding: '24px 20px 32px',
            }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: '#E5E7EB' }} />

            {/* Date title */}
            <div className="mb-5">
              <p className="text-xs font-medium mb-0.5" style={{ color: '#9CA3AF' }}>
                {selDay.date === today ? '📍 Hoy' : ''}
              </p>
              <h3 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>{selDay.label}</h3>
            </div>

            {/* Slots */}
            <div className="flex flex-col gap-3 mb-6">
              {SLOT_KEYS.map(slot => {
                const meta = SLOT_META[slot]
                const s = selDay.slots[slot]
                const checked = modalState[slot]
                const bg = GENRE_COLORS[s.genre] ?? '#E5E7EB'
                return (
                  <button
                    key={slot}
                    onClick={() => toggleSlot(slot)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all"
                    style={{
                      background: checked ? '#EEF7F1' : '#F9F9F7',
                      border: checked ? '1.5px solid #7AAE8A' : '1.5px solid #F0F0ED',
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: checked ? '#7AAE8A' : '#D1D5DB',
                        background: checked ? '#7AAE8A' : 'white',
                      }}
                    >
                      {checked && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium mb-0.5" style={{ color: '#9CA3AF' }}>
                        {meta.icon} {meta.time} — {meta.label}
                      </p>
                      <p
                        className="text-sm font-semibold truncate"
                        style={{
                          color: checked ? '#6B7280' : '#1A1A1A',
                          textDecoration: checked ? 'line-through' : undefined,
                        }}
                      >
                        {s.title}
                      </p>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
                      style={{ background: bg, color: '#1A1A1A' }}
                    >
                      {s.genre}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Save button */}
            <button
              onClick={saveProgress}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all"
              style={{
                background: saving ? '#9CA3AF' : '#7AAE8A',
                color: 'white',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Guardando...' : 'Guardar progreso'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
