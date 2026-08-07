'use client'

import { useState } from 'react'
import { ChecklistStep, STEP_ORDER, STEP_LABELS, StepKey } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

export default function ChecklistPanel({
  songId,
  steps,
  compact = false,
  onUpdate,
}: {
  songId: string
  steps: ChecklistStep[]
  compact?: boolean
  onUpdate?: (steps: ChecklistStep[]) => void
}) {
  const [localSteps, setLocalSteps] = useState(steps)
  const [saving, setSaving] = useState<string | null>(null)

  const stepsMap = new Map(localSteps.map((s) => [s.step_key, s]))

  async function toggle(stepKey: StepKey) {
    const current = stepsMap.get(stepKey)
    if (!current) return

    setSaving(stepKey)
    const newCompleted = !current.completed
    const newCompletedAt = newCompleted ? new Date().toISOString() : null

    const { error } = await supabase
      .from('checklist_steps')
      .update({ completed: newCompleted, completed_at: newCompletedAt })
      .eq('song_id', songId)
      .eq('step_key', stepKey)

    if (!error) {
      const updated = localSteps.map((s) =>
        s.step_key === stepKey
          ? { ...s, completed: newCompleted, completed_at: newCompletedAt }
          : s
      )
      setLocalSteps(updated)
      onUpdate?.(updated)
    }
    setSaving(null)
  }

  return (
    <div className={compact ? 'flex flex-col gap-1' : 'flex flex-col gap-2'}>
      {STEP_ORDER.map((key, i) => {
        const step = stepsMap.get(key)
        const done = step?.completed ?? false
        const isSaving = saving === key

        return (
          <label
            key={key}
            className="flex items-center gap-3 cursor-pointer group"
            style={{ opacity: isSaving ? 0.6 : 1 }}
          >
            <button
              onClick={() => toggle(key)}
              disabled={isSaving}
              className="flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all"
              style={{
                width: compact ? 18 : 20,
                height: compact ? 18 : 20,
                background: done ? '#7AAE8A' : 'white',
                borderColor: done ? '#7AAE8A' : '#D1D5DB',
              }}
            >
              {done && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span
              className={compact ? 'text-xs' : 'text-sm'}
              style={{
                color: done ? '#9CA3AF' : '#374151',
                textDecoration: done ? 'line-through' : 'none',
              }}
            >
              <span className="mr-1.5" style={{ color: '#D1D5DB', fontSize: '0.7em' }}>
                {i + 1}.
              </span>
              {STEP_LABELS[key]}
            </span>
          </label>
        )
      })}
    </div>
  )
}
