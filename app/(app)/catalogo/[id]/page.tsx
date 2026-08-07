import { supabase } from '@/lib/supabase'
import { getSongStatus } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import SongDetailClient from './SongDetailClient'

export const dynamic = 'force-dynamic'

export default async function SongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [{ data: song }, { data: steps }] = await Promise.all([
    supabase.from('songs').select('*').eq('id', id).single(),
    supabase.from('checklist_steps').select('*').eq('song_id', id),
  ])

  if (!song) notFound()

  const { data: album } = await supabase.from('albums').select('*').eq('id', song.album_id).single()

  const status = getSongStatus(steps ?? [])

  return <SongDetailClient song={song} album={album} steps={steps ?? []} initialStatus={status} />
}
