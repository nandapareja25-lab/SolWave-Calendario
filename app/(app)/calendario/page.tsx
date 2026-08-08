import CalendarClient from './CalendarClient'
import { supabase } from '@/lib/supabase'
import youtubeCalendar from '@/scripts/youtube-calendar.json'

export const dynamic = 'force-dynamic'

export default async function CalendarioPage() {
  const entries = youtubeCalendar.weeks.flatMap((w) =>
    w.entries.map((e) => ({
      ...e,
      week: w.week,
      weekDates: w.dates,
      adaptive: 'adaptive' in e ? Boolean(e.adaptive) : false,
    }))
  )

  // Load which entries are already published
  const { data: published } = await supabase
    .from('yt_published')
    .select('entry_date, title')

  const publishedSet = new Set(
    (published ?? []).map((r) => `${r.entry_date}|${r.title}`)
  )

  return <CalendarClient entries={entries} publishedSet={Array.from(publishedSet)} />
}
