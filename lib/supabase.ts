import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Missing Supabase env vars')
    _supabase = createClient(url, key)
  }
  return _supabase
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop]
  },
})

export type Album = {
  id: string
  name: string
  genre: string
  concept: string
  main_emotion: string
  target_audience: string
  color: string
  total_songs: number
  album_launch_date: string | null
  album_scheduled: boolean
  album_published: boolean
  youtube_url: string | null
  launch_notes: string | null
  created_at: string
}

export type Song = {
  id: string
  album_id: string
  name: string
  track_number: number | null
  genre: string
  approximate_duration: string | null
  priority: 'normal' | 'high' | null
  notes: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  created_at: string
}

export type ChecklistStep = {
  id: string
  song_id: string
  step_key: StepKey
  completed: boolean
  completed_at: string | null
}

export type StepKey =
  | 'audio_done'
  | 'video_ready'
  | 'uploaded_to_youtube'

export const STEP_LABELS: Record<StepKey, string> = {
  audio_done: 'Audio creado',
  video_ready: 'Video listo',
  uploaded_to_youtube: 'Subido a YouTube',
}

export const STEP_ORDER: StepKey[] = [
  'audio_done',
  'video_ready',
  'uploaded_to_youtube',
]

export type SongStatus =
  | 'published'
  | 'in_production'
  | 'not_started'

export const STATUS_LABELS: Record<SongStatus, string> = {
  published: 'Publicada',
  in_production: 'En producción',
  not_started: 'Sin empezar',
}

export function getSongStatus(steps: ChecklistStep[]): SongStatus {
  const completed = new Set(
    steps.filter((s) => s.completed).map((s) => s.step_key)
  )
  if (completed.has('uploaded_to_youtube')) return 'published'
  if (completed.size > 0) return 'in_production'
  return 'not_started'
}

export type AlbumStatus = 'published' | 'scheduled' | 'pending'

export function getAlbumStatus(album: Album): AlbumStatus {
  if (album.album_published) return 'published'
  if (album.album_scheduled) return 'scheduled'
  return 'pending'
}

export const ALBUM_STATUS_LABELS: Record<AlbumStatus, string> = {
  published: 'Publicado',
  scheduled: 'Programado',
  pending: 'Pendiente',
}
