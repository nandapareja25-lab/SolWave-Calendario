import { supabase } from '@/lib/supabase'
import { getSongStatus, ChecklistStep, Album, Song } from '@/lib/supabase'
import CalendarClient from './CalendarClient'

export const dynamic = 'force-dynamic'

async function getData() {
  const [{ data: albums }, { data: songs }, { data: steps }] = await Promise.all([
    supabase.from('albums').select('*'),
    supabase.from('songs').select('*').order('scheduled_date').order('scheduled_time'),
    supabase.from('checklist_steps').select('*'),
  ])

  const stepsMap = new Map<string, ChecklistStep[]>()
  for (const step of steps ?? []) {
    if (!stepsMap.has(step.song_id)) stepsMap.set(step.song_id, [])
    stepsMap.get(step.song_id)!.push(step)
  }

  const songsWithStatus = (songs ?? []).map((s) => ({
    ...s,
    status: getSongStatus(stepsMap.get(s.id) ?? []),
  }))

  return { albums: albums ?? [], songs: songsWithStatus }
}

export default async function CalendarioPage() {
  const { albums, songs } = await getData()
  return <CalendarClient albums={albums} songs={songs} />
}
