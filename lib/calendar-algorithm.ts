import { Song, Album } from './supabase'

const DEFAULT_TIMES = ['13:00', '19:00']
const CATCHUP_TIMES = ['13:00', '17:00', '20:30']
const MIN_SEPARATION_MINUTES = 210 // 3.5 hours

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function isSunday(dateStr: string): boolean {
  return new Date(dateStr + 'T12:00:00').getDay() === 0
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

type PublicationSlot = { date: string; time: string; album_id: string }

export function suggestPublicationDate(params: {
  songs: Song[]
  albums: Album[]
  albumId: string
  minDate?: string
  allowCatchup?: boolean
}): { date: string; time: string } | null {
  const { songs, albums, albumId, minDate, allowCatchup = false } = params

  const albumLaunchDates = new Set(
    albums
      .filter((a) => a.album_launch_date)
      .map((a) => a.album_launch_date!)
  )

  // Build existing slots (only non-published/scheduled songs count as fixed)
  const existingSlots: PublicationSlot[] = songs
    .filter((s) => s.scheduled_date && s.scheduled_time)
    .map((s) => ({
      date: s.scheduled_date!,
      time: s.scheduled_time!,
      album_id: s.album_id,
    }))

  let candidate = minDate ?? todayStr()

  for (let attempt = 0; attempt < 365; attempt++) {
    if (isSunday(candidate)) {
      candidate = addDays(candidate, 1)
      continue
    }

    if (albumLaunchDates.has(candidate)) {
      candidate = addDays(candidate, 1)
      continue
    }

    const daySlots = existingSlots.filter((s) => s.date === candidate)
    const sameAlbumToday = daySlots.some((s) => s.album_id === albumId)

    if (sameAlbumToday) {
      candidate = addDays(candidate, 1)
      continue
    }

    const usedTimes = daySlots.map((s) => s.time)

    if (usedTimes.length === 0) {
      return { date: candidate, time: '13:00' }
    }

    if (usedTimes.length === 1) {
      const other = timeToMinutes(usedTimes[0])
      for (const t of DEFAULT_TIMES) {
        const tm = timeToMinutes(t)
        if (!usedTimes.includes(t) && Math.abs(tm - other) >= MIN_SEPARATION_MINUTES) {
          return { date: candidate, time: t }
        }
      }
    }

    if (usedTimes.length === 2 && allowCatchup) {
      for (const t of CATCHUP_TIMES) {
        if (!usedTimes.includes(t)) {
          const mins = timeToMinutes(t)
          const conflicts = usedTimes.some(
            (u) => Math.abs(timeToMinutes(u) - mins) < MIN_SEPARATION_MINUTES
          )
          if (!conflicts) {
            return { date: candidate, time: t }
          }
        }
      }
    }

    candidate = addDays(candidate, 1)
  }

  return null
}

export function suggestMultipleDates(params: {
  count: number
  songs: Song[]
  albums: Album[]
  albumId: string
  minDate?: string
  allowCatchup?: boolean
}): Array<{ date: string; time: string }> {
  const { count, songs, albums, albumId, minDate, allowCatchup } = params
  const results: Array<{ date: string; time: string }> = []
  const simulatedSongs: Song[] = [...songs]

  for (let i = 0; i < count; i++) {
    const suggestion = suggestPublicationDate({
      songs: simulatedSongs,
      albums,
      albumId,
      minDate: results[i - 1]?.date ?? minDate,
      allowCatchup,
    })

    if (!suggestion) break
    results.push(suggestion)

    // Add to simulated songs so next iteration respects this slot
    simulatedSongs.push({
      id: `temp-${i}`,
      album_id: albumId,
      name: '',
      track_number: null,
      genre: '',
      approximate_duration: null,
      priority: null,
      notes: null,
      scheduled_date: suggestion.date,
      scheduled_time: suggestion.time,
      created_at: '',
    })
  }

  return results
}
