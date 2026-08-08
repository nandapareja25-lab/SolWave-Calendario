import { supabase } from '@/lib/supabase'
import calendar from '@/scripts/yt-calendar-2026.json'
import HoyClient from './HoyClient'

export const dynamic = 'force-dynamic'

export default async function HoyPage() {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const todayDay = calendar.days.find((d) => d.date === today) ?? null
  const tomorrowDay = calendar.days.find((d) => d.date === tomorrow) ?? null

  // Next 5 upcoming days after tomorrow with calendar data
  const upcomingDays = calendar.days
    .filter((d) => d.date > tomorrow)
    .slice(0, 5)

  const { data: progress } = await supabase.from('yt_progress').select('entry_date, slot')
  const done = new Set((progress ?? []).map((r) => `${r.entry_date}|${r.slot}`))

  // Total progress
  const totalSlots = calendar.days.length * 3
  const doneCount = progress?.length ?? 0

  return (
    <HoyClient
      today={today}
      todayDay={todayDay}
      tomorrowDay={tomorrowDay}
      upcomingDays={upcomingDays}
      doneSet={Array.from(done)}
      totalSlots={totalSlots}
      doneCount={doneCount}
    />
  )
}
