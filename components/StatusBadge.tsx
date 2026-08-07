import { SongStatus, STATUS_LABELS } from '@/lib/supabase'

const STATUS_STYLES: Record<SongStatus, { bg: string; color: string }> = {
  published: { bg: '#EEF5FD', color: '#3B7CBF' },
  in_production: { bg: '#FFF4EC', color: '#B56A3A' },
  not_started: { bg: '#F3F4F6', color: '#9CA3AF' },
}

export default function StatusBadge({ status }: { status: SongStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
