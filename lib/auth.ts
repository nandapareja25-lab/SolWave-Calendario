'use server'

import { cookies } from 'next/headers'

const SESSION_COOKIE = 'sw_session'
const CORRECT_PASSWORD = process.env.APP_PASSWORD ?? 'solwave2026'

export async function login(password: string): Promise<boolean> {
  if (password !== CORRECT_PASSWORD) return false
  const store = await cookies()
  store.set(SESSION_COOKIE, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return true
}

export async function logout() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value === 'authenticated'
}
