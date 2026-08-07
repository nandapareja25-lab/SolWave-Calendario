'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Contraseña incorrecta')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF8' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1
            className="text-5xl mb-2"
            style={{ fontFamily: 'var(--font-satisfy), cursive', color: '#1A1A1A' }}
          >
            SolWave
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Panel Editorial</p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: 'white', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="password"
                className="block mb-1 text-sm font-medium"
                style={{ color: '#374151' }}
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                style={{
                  border: error ? '1.5px solid #F87171' : '1.5px solid #E5E7EB',
                  background: '#FAFAF8',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1.5px solid #7AAE8A'
                }}
                onBlur={(e) => {
                  e.target.style.border = error ? '1.5px solid #F87171' : '1.5px solid #E5E7EB'
                }}
              />
              {error && (
                <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-medium transition-opacity"
              style={{
                background: '#7AAE8A',
                color: 'white',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
