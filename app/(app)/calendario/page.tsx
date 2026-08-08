import CalendarClient from './CalendarClient'
import { supabase } from '@/lib/supabase'
import calendar from '@/scripts/yt-calendar-2026.json'

export const dynamic = 'force-dynamic'

export default async function CalendarioPage() {
  const { data: progress } = await supabase
    .from('yt_progress')
    .select('entry_date, slot')

  // Build set of "date|slot" keys that are done
  const done = new Set(
    (progress ?? []).map((r) => `${r.entry_date}|${r.slot}`)
  )

  return <CalendarClient days={calendar.days} doneSet={Array.from(done)} />
}
