'use client'

import { useState, useOptimistic, useTransition } from 'react'

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
  'Banda':      '#FB923C',
  'Gospel':     '#E879F9',
}

function doneKey(date: string, slot: SlotKey) { return `${date}|${slot}` }

const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function formatDateLong(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${DAYS_ES[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`
}

function SlotCard({
  date,
  slotKey,
  slot,
  checked,
  onToggle,
  disabled,
}: {
  date: string
  slotKey: SlotKey
  slot: Slot
  checked: boolean
  onToggle: (date: string, slot: SlotKey, val: boolean) => void
  disabled: boolean
}) {
  const meta = SLOT_META[slotKey]
  const color = GENRE_COLORS[slot.genre] ?? '#E5E7EB'

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{
        background: 'white',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        borderLeft: `4px solid ${color}`,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <button
        onClick={() => onToggle(date, slotKey, !checked)}
        disabled={disabled}
        className="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: checked ? '#6BAF8A' : '#D1D5DB',
          background: checked ? '#6BAF8A' : 'white',
        }}
      >
        {checked && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>
          {meta.icon} {meta.time} · {meta.label}
        </p>
        <p
          className="font-semibold text-sm truncate"
          style={{ color: '#1A1A1A', textDecoration: checked ? 'line-through' : 'none' }}
        >
          {slot.title}
        </p>
      </div>

      <span
        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
        style={{ background: color, color: '#374151' }}
      >
        {slot.genre}
      </span>
    </div>
  )
}

export default function HoyClient({
  today,
  todayDay,
  tomorrowDay,
  upcomingDays,
  doneSet,
  totalSlots,
  doneCount,
}: {
  today: string
  todayDay: Day | null
  tomorrowDay: Day | null
  upcomingDays: Day[]
  doneSet: string[]
  totalSlots: number
  doneCount: number
}) {
  const [done, setDone] = useState<Set<string>>(new Set(doneSet))
  const [saving, setSaving] = useState<Set<string>>(new Set())

  async function toggle(date: string, slot: SlotKey, val: boolean) {
    const key = doneKey(date, slot)
    setSaving(prev => new Set(prev).add(key))

    const next = new Set(done)
    if (val) next.add(key)
    else next.delete(key)
    setDone(next)

    await fetch('/api/yt-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, slot, completed: val }),
    })

    setSaving(prev => { const s = new Set(prev); s.delete(key); return s })
  }

  const completedToday = todayDay
    ? SLOT_KEYS.filter(sk => done.has(doneKey(today, sk))).length
    : 0

  const totalDone = done.size

  return (
    <div className="max-w-xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>Vista de hoy</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>{formatDateLong(today)}</p>
      </div>

      {/* Progress bar */}
      <div
        className="rounded-2xl p-4 mb-6"
        style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm" style={{ color: '#6B7280' }}>Publicaciones completadas</span>
          <span className="text-sm font-semibold" style={{ color: '#6BAF8A' }}>
            {totalDone} / {totalSlots}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${(totalDone / totalSlots) * 100}%`, background: '#6BAF8A' }}
          />
        </div>
      </div>

      {/* Hoy */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
            📅 Hoy
          </h3>
          {todayDay && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: completedToday === 3 ? '#D1FAE5' : '#F3F4F6',
                color: completedToday === 3 ? '#065F46' : '#6B7280',
              }}
            >
              {completedToday}/3 {completedToday === 3 ? '✓' : ''}
            </span>
          )}
        </div>

        {!todayDay ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
          >
            <p style={{ color: '#9CA3AF' }}>No hay publicaciones programadas para hoy.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {SLOT_KEYS.map(sk => (
              <SlotCard
                key={sk}
                date={today}
                slotKey={sk}
                slot={todayDay.slots[sk]}
                checked={done.has(doneKey(today, sk))}
                onToggle={toggle}
                disabled={saving.has(doneKey(today, sk))}
              />
            ))}
          </div>
        )}
      </section>

      {/* Mañana */}
      {tomorrowDay && (
        <section className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>
            Mañana · {tomorrowDay.label}
          </h3>
          <div className="flex flex-col gap-3">
            {SLOT_KEYS.map(sk => (
              <SlotCard
                key={sk}
                date={tomorrowDay.date}
                slotKey={sk}
                slot={tomorrowDay.slots[sk]}
                checked={done.has(doneKey(tomorrowDay.date, sk))}
                onToggle={toggle}
                disabled={saving.has(doneKey(tomorrowDay.date, sk))}
              />
            ))}
          </div>
        </section>
      )}

      {/* Próximos días */}
      {upcomingDays.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>
            Próximos días
          </h3>
          <div
            className="rounded-2xl overflow-hidden divide-y"
            style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
          >
            {upcomingDays.map(day => {
              const dayDone = SLOT_KEYS.filter(sk => done.has(doneKey(day.date, sk))).length
              return (
                <div key={day.date} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#374151' }}>{day.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                      {day.slots['10am'].title} · {day.slots['3pm'].title} · {day.slots['8pm'].title}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold ml-4 flex-shrink-0"
                    style={{ color: dayDone === 3 ? '#6BAF8A' : '#9CA3AF' }}
                  >
                    {dayDone}/3 {dayDone === 3 ? '✓' : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
