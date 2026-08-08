import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  let body: { date?: string; slot?: string; completed?: boolean }
  try {
    body = await req.json()
  } catch (e) {
    console.error('[yt-progress] JSON parse error:', e)
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const { date, slot, completed } = body

  if (!date || !slot) {
    return NextResponse.json({ error: 'date and slot required' }, { status: 400 })
  }

  if (completed) {
    const { error } = await supabase
      .from('yt_progress')
      .upsert({ entry_date: date, slot }, { onConflict: 'entry_date,slot' })
    if (error) {
      console.error('[yt-progress] upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    const { error } = await supabase
      .from('yt_progress')
      .delete()
      .eq('entry_date', date)
      .eq('slot', slot)
    if (error) {
      console.error('[yt-progress] delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
