import { NextResponse } from 'next/server'
import { seedIfEmpty } from '@/lib/seed'

export async function POST() {
  await seedIfEmpty()
  return NextResponse.json({ ok: true })
}
