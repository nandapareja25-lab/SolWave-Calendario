import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import NuevaCancionClient from './NuevaCancionClient'

export const dynamic = 'force-dynamic'

export default async function NuevaCancionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [{ data: album }, { data: albums }, { data: songs }] = await Promise.all([
    supabase.from('albums').select('*').eq('id', id).single(),
    supabase.from('albums').select('*'),
    supabase.from('songs').select('*'),
  ])

  if (!album) notFound()

  return <NuevaCancionClient album={album} albums={albums ?? []} songs={songs ?? []} />
}
