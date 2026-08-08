import CalendarClient from './CalendarClient'
import youtubeCalendar from '@/scripts/youtube-calendar.json'

export const dynamic = 'force-dynamic'

export default function CalendarioPage() {
  const entries = youtubeCalendar.weeks.flatMap((w) =>
    w.entries.map((e) => ({
      ...e,
      week: w.week,
      weekDates: w.dates,
      adaptive: 'adaptive' in e ? Boolean(e.adaptive) : false,
    }))
  )
  return <CalendarClient entries={entries} />
}
