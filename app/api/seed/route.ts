import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ALBUMS_SEED, SONGS_SEED } from '@/lib/seed-data'
import { STEP_ORDER } from '@/lib/supabase'

export async function POST() {
  try {
    const { count, error: countErr } = await supabase
      .from('albums')
      .select('*', { count: 'exact', head: true })

    if (countErr) return NextResponse.json({ error: 'count', detail: countErr }, { status: 500 })
    if ((count ?? 0) > 0) return NextResponse.json({ ok: true, skipped: true, count })

    const { data: albums, error: albumErr } = await supabase
      .from('albums')
      .insert(ALBUMS_SEED)
      .select()

    if (albumErr || !albums) return NextResponse.json({ error: 'albums', detail: albumErr }, { status: 500 })

    const albumMap = new Map(albums.map((a: any) => [a.name, a.id]))

    const songsToInsert = SONGS_SEED.map((s: any) => ({
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

    if (songErr || !songs) return NextResponse.json({ error: 'songs', detail: songErr }, { status: 500 })

    const steps = songs.flatMap((song: any) =>
      STEP_ORDER.map((key) => ({ song_id: song.id, step_key: key, completed: false }))
    )

    const { error: stepsErr } = await supabase.from('checklist_steps').insert(steps)
    if (stepsErr) return NextResponse.json({ error: 'steps', detail: stepsErr }, { status: 500 })

    return NextResponse.json({ ok: true, albums: albums.length, songs: songs.length })
  } catch (e: any) {
    return NextResponse.json({ error: 'exception', detail: e?.message }, { status: 500 })
  }
}
