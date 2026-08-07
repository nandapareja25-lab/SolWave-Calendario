import { supabase } from '@/lib/supabase'
import { getSongStatus, ChecklistStep } from '@/lib/supabase'
import CatalogoClient from './CatalogoClient'

export const dynamic = 'force-dynamic'

async function getData() {
  const [{ data: albums }, { data: songs }, { data: steps }] = await Promise.all([
    supabase.from('albums').select('*').order('created_at'),
    supabase.from('songs').select('*').order('track_number'),
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
    hasNotes: !!s.notes,
  }))

  return { albums: albums ?? [], songs: songsWithStatus }
}

export default async function CatalogoPage() {
  const { albums, songs } = await getData()
  return <CatalogoClient albums={albums} songs={songs} />
}
