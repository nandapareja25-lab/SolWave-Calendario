'use client'

import { useEffect } from 'react'

export default function SeedLoader() {
  useEffect(() => {
    fetch('/api/seed', { method: 'POST' }).catch(() => {})
  }, [])

  return null
}
