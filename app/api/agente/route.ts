import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { suggestPublicationDate } from '@/lib/calendar-algorithm'
import { STEP_ORDER } from '@/lib/supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Tools ──────────────────────────────────────────────────────────────────

const tools: Anthropic.Tool[] = [
  {
    name: 'get_albums',
    description: 'Obtiene la lista de álbumes disponibles con su id, nombre y género.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_calendar_status',
    description: 'Muestra las próximas fechas ocupadas en el calendario y cuántos huecos quedan disponibles esta semana.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'add_songs',
    description: `Agrega una o varias canciones nuevas al catálogo y las programa en el calendario automáticamente.
Marca el paso "audio_done" como completado por defecto.
Nunca agrega canciones a álbumes que no existen — si el álbum no se encuentra, pide confirmación antes.`,
    input_schema: {
      type: 'object',
      properties: {
        songs: {
          type: 'array',
          description: 'Lista de canciones a agregar.',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Nombre de la canción.' },
              album_id: { type: 'string', description: 'ID del álbum al que pertenece.' },
              track_number: { type: 'number', description: 'Número de pista (opcional).' },
              priority: { type: 'string', enum: ['normal', 'high'], description: 'Prioridad (opcional, por defecto normal).' },
              min_date: { type: 'string', description: 'Fecha mínima de publicación en formato YYYY-MM-DD (opcional).' },
            },
            required: ['name', 'album_id'],
          },
        },
      },
      required: ['songs'],
    },
  },
  {
    name: 'mark_audio_done',
    description: 'Marca el paso "audio terminado" de una o varias canciones existentes (por nombre o id).',
    input_schema: {
      type: 'object',
      properties: {
        song_names: {
          type: 'array',
          items: { type: 'string' },
          description: 'Nombres de las canciones.',
        },
      },
      required: ['song_names'],
    },
  },
]

// ── Tool execution ─────────────────────────────────────────────────────────

async function runTool(name: string, input: Record<string, unknown>): Promise<string> {
  if (name === 'get_albums') {
    const { data } = await supabase.from('albums').select('id, name, genre, total_songs').order('name')
    return JSON.stringify(data ?? [])
  }

  if (name === 'get_calendar_status') {
    const today = new Date().toISOString().split('T')[0]
    const { data: upcoming } = await supabase
      .from('songs')
      .select('name, scheduled_date, scheduled_time, album_id')
      .gte('scheduled_date', today)
      .order('scheduled_date')
      .order('scheduled_time')
      .limit(10)
    return JSON.stringify(upcoming ?? [])
  }

  if (name === 'add_songs') {
    const { songs: songsInput } = input as {
      songs: Array<{
        name: string
        album_id: string
        track_number?: number
        priority?: 'normal' | 'high'
        min_date?: string
      }>
    }

    const { data: allSongs } = await supabase.from('songs').select('*')
    const { data: allAlbums } = await supabase.from('albums').select('*')

    const results = []

    for (const s of songsInput) {
      const album = allAlbums?.find((a) => a.id === s.album_id)
      if (!album) {
        results.push({ name: s.name, error: 'Álbum no encontrado' })
        continue
      }

      const suggestion = suggestPublicationDate({
        songs: allSongs ?? [],
        albums: allAlbums ?? [],
        albumId: s.album_id,
        minDate: s.min_date,
        allowCatchup: false,
      })

      const { data: newSong, error } = await supabase
        .from('songs')
        .insert({
          album_id: s.album_id,
          name: s.name,
          track_number: s.track_number ?? null,
          genre: album.genre,
          priority: s.priority ?? 'normal',
          scheduled_date: suggestion?.date ?? null,
          scheduled_time: suggestion?.time ?? null,
          notes: null,
          approximate_duration: null,
        })
        .select()
        .single()

      if (error || !newSong) {
        results.push({ name: s.name, error: error?.message ?? 'Error al insertar' })
        continue
      }

      // Create checklist steps
      await supabase.from('checklist_steps').insert(
        STEP_ORDER.map((step_key) => ({
          song_id: newSong.id,
          step_key,
          completed: step_key === 'audio_done',
          completed_at: step_key === 'audio_done' ? new Date().toISOString() : null,
        }))
      )

      // Add to allSongs so next iteration respects this slot
      ;(allSongs ?? []).push(newSong)

      results.push({
        name: s.name,
        album: album.name,
        scheduled_date: suggestion?.date ?? 'sin fecha',
        scheduled_time: suggestion?.time ?? '',
      })
    }

    return JSON.stringify(results)
  }

  if (name === 'mark_audio_done') {
    const { song_names } = input as { song_names: string[] }
    const results = []

    for (const songName of song_names) {
      const { data: song } = await supabase
        .from('songs')
        .select('id, name')
        .ilike('name', songName)
        .single()

      if (!song) {
        results.push({ name: songName, error: 'Canción no encontrada' })
        continue
      }

      await supabase
        .from('checklist_steps')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('song_id', song.id)
        .eq('step_key', 'audio_done')

      results.push({ name: song.name, updated: true })
    }

    return JSON.stringify(results)
  }

  return JSON.stringify({ error: 'Tool desconocida' })
}

// ── System prompt ──────────────────────────────────────────────────────────

const SYSTEM = `Eres el asistente editorial de SolWave, un sello discográfico independiente de música.
Tu trabajo es ayudar a gestionar el catálogo de canciones y el calendario de publicaciones de YouTube.

Puedes:
- Agregar canciones nuevas al catálogo y programarlas automáticamente en el calendario
- Marcar el audio como terminado en canciones existentes
- Consultar el estado del calendario y los álbumes disponibles

Reglas importantes:
- Cuando alguien menciona canciones nuevas que ya tiene listas (audio terminado), úsalas tool add_songs y marca audio_done en true.
- Siempre confirma qué canciones agregaste y en qué fechas quedaron programadas.
- Si el usuario menciona un álbum que no reconoces, usa get_albums primero para verificar.
- Responde siempre en español, de forma breve y amigable.
- Cuando agregues varias canciones, muéstralas en una lista clara con su fecha asignada.`

// ── Handler ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM,
    tools,
    messages,
  })

  // Agentic loop
  while (response.stop_reason === 'tool_use') {
    const toolUses = response.content.filter((b) => b.type === 'tool_use')
    const toolResults = await Promise.all(
      toolUses.map(async (block) => {
        if (block.type !== 'tool_use') return null
        const result = await runTool(block.name, block.input as Record<string, unknown>)
        return {
          type: 'tool_result' as const,
          tool_use_id: block.id,
          content: result,
        }
      })
    )

    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM,
      tools,
      messages: [
        ...messages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults.filter(Boolean) },
      ],
    })
  }

  const text = response.content.find((b) => b.type === 'text')
  return NextResponse.json({ reply: text?.type === 'text' ? text.text : '' })
}
