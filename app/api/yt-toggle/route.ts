import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { date, title, published } = await req.json()

  if (!date || !title) {
    return NextResponse.json({ error: 'date and title required' }, { status: 400 })
  }

  if (published) {
    const { error } = await supabase
      .from('yt_published')
      .upsert({ entry_date: date, title }, { onConflict: 'entry_date,title' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase
      .from('yt_published')
      .delete()
      .eq('entry_date', date)
      .eq('title', title)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
