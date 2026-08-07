'use client'

import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

const SUGERENCIAS = [
  'Tengo listas estas canciones de Llegaste muy tarde: "Mi nueva canción", "Otra canción"',
  '¿Qué fechas quedan disponibles esta semana?',
  '¿Cuáles son mis álbumes?',
  'Marca el audio terminado de "Ahora me buscas"',
]

export default function AgentePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text?: string) {
    const userText = text ?? input.trim()
    if (!userText || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/agente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Hubo un error. Intenta de nuevo.' }])
    }

    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-4 flex-shrink-0">
        <h2 className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>Asistente</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
          Dime qué canciones tienes listas y las agrego al calendario automáticamente.
        </p>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
            <div className="text-center">
              <p className="text-4xl mb-3">🎵</p>
              <p className="text-sm font-medium" style={{ color: '#374151' }}>
                ¿Qué tienes listo hoy?
              </p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                Cuéntame y lo programo en el calendario
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm px-4 py-3 rounded-xl border transition-all"
                  style={{
                    border: '1.5px solid #E5E7EB',
                    color: '#6B7280',
                    background: '#FAFAF8',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#7AAE8A'
                    ;(e.currentTarget as HTMLElement).style.color = '#374151'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'
                    ;(e.currentTarget as HTMLElement).style.color = '#6B7280'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[85%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap"
              style={{
                background: m.role === 'user' ? '#7AAE8A' : '#F3F4F6',
                color: m.role === 'user' ? 'white' : '#374151',
                borderBottomRightRadius: m.role === 'user' ? 4 : undefined,
                borderBottomLeftRadius: m.role === 'assistant' ? 4 : undefined,
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="px-4 py-3 rounded-2xl text-sm"
              style={{ background: '#F3F4F6', color: '#9CA3AF', borderBottomLeftRadius: 4 }}
            >
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex-shrink-0 mt-3 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Tengo listas estas canciones de..."
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl border text-sm outline-none"
          style={{
            border: '1.5px solid #E5E7EB',
            background: 'white',
            color: '#374151',
          }}
          onFocus={(e) => { e.target.style.border = '1.5px solid #7AAE8A' }}
          onBlur={(e) => { e.target.style.border = '1.5px solid #E5E7EB' }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="px-5 py-3 rounded-xl text-sm font-medium transition-opacity"
          style={{
            background: '#7AAE8A',
            color: 'white',
            opacity: !input.trim() || loading ? 0.5 : 1,
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  )
}
