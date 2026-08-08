import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import { suggestPublicationDate } from '@/lib/calendar-algorithm'
import { STEP_ORDER } from '@/lib/supabase'
import youtubeCalendar from '@/scripts/youtube-calendar.json'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Valid catalog for title validation ─────────────────────────────────────

const VALID_CATALOG: Record<string, string[]> = {
  'Llegaste muy tarde': [
    'Llegaste Muy Tarde', 'Ahora Me Buscas', 'Esta Es la Última Llamada',
    'Tu Arrepentamiento', 'Qué Te Vaya Bonito', 'Me Aprendí Sin Ti',
    'Lo Nuestro No Fue Real', 'Cada Vez que Te Veo', 'No Eras para Mí',
    'Sin Decirte Adiós', 'Sigo Aquí Parada',
  ],
  'Ya no vuelvo atrás': [
    'Ya No Vuelvo Atrás', 'Me Elegí Primero', 'Sola Me Queda Bien',
    'Sin Pedir Permiso', 'Libre de Ti', 'Esta Soy Yo', 'No Me Apagues',
    'Más Fuerte que Ayer', 'Tú Ya No Decides', 'El Día que Me Fui',
    'No Necesito tu Permiso',
  ],
  'Las pequeñas cosas': [
    'Las Pequeñas Cosas', 'El Café de las Ocho', 'Un Día Cualquiera',
    'La Luz de la Ventana', 'Despacio', 'Después de la Lluvia',
    'La Calma También Canta', 'Todo Estaba Aquí', 'Gracias por Este Instante',
    'Hogar en Mí', 'Todavía Hay Estrellas',
  ],
  'Volví a escucharme': [
    'Volví a Escucharme', 'Me Debía Esta Canción', 'Siempre Vuelvo a Mí',
    'No Era Mi Culpa', 'Ahora Sí Soy Yo', 'Nunca Fue Demasiado Tarde',
    'Después del Miedo', 'Sigo Siendo Yo', 'El Día que Me Escuché',
    'Lo que Necesitaba', 'Gracias por Esperar',
  ],
  'Desde que llegaste': [
    'Desde Que Llegaste', 'Qué Suerte Encontrarte', 'Eres Mi Calma',
    'Contigo Entendí', 'Mi Lugar Favorito', 'Después de Ti',
    'Toda la Vida', 'Con Todo y Mis Miedos', 'El Primero en Creer',
    'Sin Buscarlo', 'Ya No Me Falta Nada',
  ],
  'Vuelvo a sentir la vida': [
    'Vuelvo a Sentir la Vida', 'Hoy Me Despertó la Alegría', 'Baila Conmigo la Vida',
    'Cada Paso Cuenta', 'La Vida Me Encontró', 'Sin Miedo a Sonreír',
    'Ya Salió el Sol', '¡Que Nadie Me Pare!', 'El Ritmo que Me Salva',
    'Que Sea Hoy',
  ],
  'Hoy Empieza Algo Bueno': [
    'Hoy Empieza Algo Bueno', 'Volvió a Gustarme la Vida', 'Esta Vez Me Hago Caso',
    'Dejé la Puerta Abierta', 'Aunque Tenga Miedo', 'Siempre Sale el Sol',
    'Ya No Tengo Prisa', 'Me Escuché Reír', 'Ya No Pido Perdón',
    'La Vida También Sabe', 'Qué Bonito Es Volver a Mí',
  ],
  'Pop Soul/Balada': [
    'Esto Es Todo Lo Que Soy', 'Lo que Quedó de Nosotros', 'No Fue Amor',
    'Después de Todo', 'El Último Intento', 'Me Fui Quedando',
    'Pensé que Era Para Siempre', 'Nada fue Mentira', 'Donde Estás Ahora',
    'Sin Rencor', 'Ya No Duele',
  ],
}

function validateTitle(title: string, albumName: string): boolean {
  const albumSongs = VALID_CATALOG[albumName]
  if (!albumSongs) return true // álbum no validado aún
  return albumSongs.some(s => s.toLowerCase() === title.toLowerCase())
}

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
    name: 'get_youtube_calendar',
    description: 'Devuelve el calendario de publicaciones de YouTube de 12 semanas (8 ago – 31 oct 2026) con todos los slots fijos y adaptativos.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'evaluate_new_music',
    description: `Evalúa música nueva siguiendo el protocolo de estrategia YouTube de SolWave.
Aplica las reglas: incorporar al inventario, probar via Shorts primero, reservar la mayoría para Solwave,
usar slots adaptativos antes de desplazar publicaciones fijas, nunca publicar un álbum completo.
Devuelve una recomendación clara: qué probar en Shorts, qué candidato a completa, qué queda reservado.`,
    input_schema: {
      type: 'object',
      properties: {
        album_name: { type: 'string', description: 'Nombre del álbum nuevo.' },
        genre: { type: 'string', description: 'Género musical.' },
        songs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de canciones del álbum o álbumes nuevos.',
        },
        notes: { type: 'string', description: 'Contexto adicional (mood, territorio emocional, etc.).' },
      },
      required: ['album_name', 'genre', 'songs'],
    },
  },
  {
    name: 'add_songs',
    description: `Agrega una o varias canciones nuevas al catálogo y las programa en el calendario automáticamente.
Valida el título contra el catálogo conocido antes de insertar.
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

  if (name === 'get_youtube_calendar') {
    const summary = {
      strategy: youtubeCalendar.strategy,
      albums: youtubeCalendar.albums,
      adaptive_slots: youtubeCalendar.weeks
        .flatMap(w => w.entries)
        .filter((e): e is typeof e & { adaptive: boolean } => 'adaptive' in e && e.adaptive === true)
        .map(e => ({ date: e.date, criteria: 'criteria' in e ? e.criteria : undefined })),
      upcoming_fixed: youtubeCalendar.weeks
        .flatMap(w => w.entries.map(e => ({ ...e, week: w.week })))
        .filter(e => !('adaptive' in e && e.adaptive))
        .slice(0, 15),
    }
    return JSON.stringify(summary)
  }

  if (name === 'evaluate_new_music') {
    const { album_name, genre, songs, notes } = input as {
      album_name: string
      genre: string
      songs: string[]
      notes?: string
    }

    // Check what's already in calendar for this genre
    const genreInCalendar = youtubeCalendar.weeks
      .flatMap(w => w.entries)
      .filter(e => e.genre === genre && !('adaptive' in e && e.adaptive))
      .map(e => e.title)

    const adaptiveSlots = youtubeCalendar.weeks
      .flatMap(w => w.entries)
      .filter((e): e is typeof e & { adaptive: boolean } => 'adaptive' in e && e.adaptive === true)

    // Find adaptive slots available (after today)
    const today = new Date().toISOString().split('T')[0]
    const availableAdaptive = adaptiveSlots.filter(e => e.date >= today)

    // Strategy: 1-2 for Shorts, 1 candidate for complete, rest reserved
    const shortsCount = Math.min(2, Math.ceil(songs.length * 0.18))
    const completeCount = Math.min(1, Math.floor(songs.length * 0.1))
    const reservedCount = songs.length - shortsCount - completeCount

    const recommendation = {
      album: album_name,
      genre,
      total_songs: songs.length,
      strategy: 'nueva música — aplicar protocolo SolWave YouTube',
      step_1_inventory: `Agregar las ${songs.length} canciones al catálogo Supabase`,
      step_2_shorts: {
        action: 'probando_shorts',
        candidates: songs.slice(0, shortsCount),
        reason: 'Probar primero en Shorts para medir respuesta antes de comprometer slot completo',
        suggested_placement: availableAdaptive.length > 0
          ? `Usar slot adaptativo disponible en ${availableAdaptive[0].date}`
          : 'Programar en próxima semana con slot libre',
      },
      step_3_complete_candidate: {
        action: 'candidata_youtube',
        candidate: songs[Math.floor(songs.length / 2)] ?? songs[0],
        reason: 'Solo si el Short correspondiente muestra buen CTR/retención',
        placement: 'No desplazar publicaciones fijas — usar slot adaptativo semanas 8-12',
      },
      step_4_reserved: {
        action: 'reservada_solwave',
        count: reservedCount,
        songs: songs.slice(shortsCount + completeCount),
        reason: 'Mantener exclusivas para Solwave — el catálogo premium es la propuesta de valor',
      },
      genre_already_in_calendar: genreInCalendar,
      notes: notes ?? null,
      warning: genreInCalendar.length > 3
        ? `Este género ya tiene ${genreInCalendar.length} apariciones en el calendario fijo. Considerar variedad.`
        : null,
    }

    return JSON.stringify(recommendation)
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

      // Validate title against known catalog
      if (!validateTitle(s.name, album.name)) {
        results.push({ name: s.name, warning: `Título no encontrado en el catálogo validado de "${album.name}". Verifica el nombre exacto.` })
        // Still proceed but flag it
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

      await supabase.from('checklist_steps').insert(
        STEP_ORDER.map((step_key) => ({
          song_id: newSong.id,
          step_key,
          completed: step_key === 'audio_done',
          completed_at: step_key === 'audio_done' ? new Date().toISOString() : null,
        }))
      )

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

const SYSTEM = `Eres el asistente editorial de SolWave, un sello discográfico independiente.
Tu trabajo es gestionar el catálogo de 87 canciones / 8 álbumes y el calendario de publicaciones de YouTube.

## Estrategia YouTube activa (12 semanas: 8 ago – 31 oct 2026)
- Estructura: 2 canciones completas/semana + 3 Shorts/semana
- Días: Martes y Domingo = canciones completas; Jueves, Viernes, Sábado = Shorts
- 19 publicaciones completas fijas + 5 slots adaptativos (semanas 8–12 según Analytics)
- NO publicar otro álbum completo (el bachata "Llegaste muy tarde" ya está en YouTube)
- Rotación de géneros: nunca 2-3 semanas seguidas del mismo álbum

## Álbumes activos (87 canciones)
- Llegaste muy tarde (Bachata, 11) — álbum completo ya en YouTube
- Ya no vuelvo atrás (Dancehall, 11)
- Las pequeñas cosas (Indie Folk, 11)
- Volví a escucharme (Pop Soul, 11)
- Desde que llegaste (Regional romántico, 11)
- Vuelvo a sentir la vida (Salsa, 10)
- Hoy Empieza Algo Bueno (Cumbia argentina, 11)
- Pop Soul/Balada (11)
- Donde Florece el Alma (Folk/Flamenco) — pendiente de cargar

## Protocolo obligatorio para MÚSICA NUEVA
Cuando el usuario informe canciones o álbumes nuevos, SIEMPRE:
1. Usa evaluate_new_music para analizar qué hacer con la música nueva
2. Añade al catálogo (add_songs) solo las que el usuario confirme
3. NUNCA asumir que todo lo nuevo se publica en YouTube
4. Shorts primero, canciones completas solo si el Short funciona
5. La mayoría queda reservada para Solwave
6. Usar slots adaptativos (semanas 8-12) ANTES de desplazar publicaciones fijas
7. Validar que el título exista en el catálogo antes de programarlo

## Reglas generales
- Responde siempre en español, de forma breve y amigable
- Si el usuario menciona un álbum que no reconoces, usa get_albums primero
- Cuando agregues canciones, muéstralas en lista clara con fecha asignada
- Agregar álbum nuevo ≠ publicar ese álbum completo en YouTube
- Si hay slots adaptativos disponibles, úsalos antes de reorganizar el calendario`

// ── Handler ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: SYSTEM,
    tools,
    messages,
  })

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
      max_tokens: 1500,
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
