import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const ok = await login(password)
  if (ok) return NextResponse.json({ ok: true })
  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}
