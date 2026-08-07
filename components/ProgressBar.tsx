export default function ProgressBar({
  value,
  color,
  label,
}: {
  value: number
  color: string
  label?: string
}) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1 text-xs" style={{ color: '#6B7280' }}>
          <span>{label}</span>
          <span>{Math.round(value)}%</span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 8, background: '#F3F4F6' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%`, background: color }}
        />
      </div>
    </div>
  )
}
