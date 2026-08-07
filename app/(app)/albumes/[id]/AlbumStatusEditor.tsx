'use client'

import { useState } from 'react'
import { Album } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

export default function AlbumStatusEditor({ album }: { album: Album }) {
  const [scheduled, setScheduled] = useState(album.album_scheduled)
  const [published, setPublished] = useState(album.album_published)
  const [url, setUrl] = useState(album.youtube_url ?? '')
  const [notes, setNotes] = useState(album.launch_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await supabase
      .from('albums')
      .update({
        album_scheduled: scheduled,
        album_published: published,
        youtube_url: url || null,
        launch_notes: notes || null,
      })
      .eq('id', album.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: '#374151' }}>Estado del álbum completo</h3>
        {saved && <span className="text-xs" style={{ color: '#7AAE8A' }}>✓ Guardado</span>}
      </div>

      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={scheduled}
            onChange={(e) => { setScheduled(e.target.checked); setSaved(false) }}
            className="w-4 h-4 rounded accent-green-400"
          />
          <span className="text-sm" style={{ color: '#374151' }}>Álbum programado en YouTube</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => { setPublished(e.target.checked); setSaved(false) }}
            className="w-4 h-4 rounded accent-green-400"
          />
          <span className="text-sm" style={{ color: '#374151' }}>Álbum publicado en YouTube</span>
        </label>

        <div>
          <label className="block text-xs mb-1" style={{ color: '#9CA3AF' }}>URL de YouTube (opcional)</label>
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setSaved(false) }}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
            style={{ border: '1.5px solid #E5E7EB', background: '#FAFAF8' }}
          />
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ color: '#9CA3AF' }}>Notas del lanzamiento</label>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setSaved(false) }}
            placeholder="Notas sobre el lanzamiento del álbum completo..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
            style={{ border: '1.5px solid #E5E7EB', background: '#FAFAF8' }}
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="self-start px-4 py-2 rounded-xl text-sm font-medium"
          style={{
            background: '#7AAE8A',
            color: 'white',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
