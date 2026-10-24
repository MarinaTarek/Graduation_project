'use client'

import { useState, useEffect } from 'react'

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Working late'
}

function getDateLabel(now: Date): string {
  return now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }) // e.g. "Saturday, 24 October"
}

export interface GreetingResult {
  greeting: string // e.g. "Good evening"
  dateLabel: string // e.g. "Saturday, 24 October"
}

export function useGreeting(): GreetingResult {
  // Start with a neutral value to avoid Next.js hydration mismatch
  const [result, setResult] = useState<GreetingResult>({ greeting: 'Hello', dateLabel: '' })

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setResult({ greeting: getGreeting(now.getHours()), dateLabel: getDateLabel(now) })
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  return result
}
