import { supabase } from './supabase'
import { ALBUMS_SEED, SONGS_SEED } from './seed-data'
import { STEP_ORDER } from './supabase'

export async function seedIfEmpty() {
  const { count } = await supabase
    .from('albums')
    .select('*', { count: 'exact', head: true })

  if ((count ?? 0) > 0) return

  // Insert albums
  const { data: albums, error: albumErr } = await supabase
    .from('albums')
    .insert(ALBUMS_SEED)
    .select()

  if (albumErr || !albums) {
    console.error('Seed albums error:', albumErr)
    return
  }

  const albumMap = new Map(albums.map((a) => [a.name, a.id]))

  // Insert songs
  const songsToInsert = SONGS_SEED.map((s) => ({
    album_id: albumMap.get(s.album_name)!,
    name: s.name,
    track_number: s.track_number,
    genre: ALBUMS_SEED.find((a) => a.name === s.album_name)!.genre,
    scheduled_date: s.scheduled_date,
    scheduled_time: s.scheduled_time,
    priority: 'normal',
    notes: null,
    approximate_duration: null,
  }))

  const { data: songs, error: songErr } = await supabase
    .from('songs')
    .insert(songsToInsert)
    .select()

  if (songErr || !songs) {
    console.error('Seed songs error:', songErr)
    return
  }

  // Insert checklist steps for each song (3 steps)
  const stepsToInsert = songs.flatMap((song) =>
    STEP_ORDER.map((step_key) => ({
      song_id: song.id,
      step_key,
      completed: false,
      completed_at: null,
    }))
  )

  const { error: stepsErr } = await supabase
    .from('checklist_steps')
    .insert(stepsToInsert)

  if (stepsErr) {
    console.error('Seed steps error:', stepsErr)
  }
}
