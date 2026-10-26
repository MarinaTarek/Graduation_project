'use client'

import { useState, useEffect } from 'react'
import { getCurrentLang } from './format'

function getGreeting(hour: number, lang: 'en' | 'ar'): string {
  if (lang === 'ar') {
    if (hour >= 5 && hour < 12) return 'صباح الخير'
    return 'مساء الخير'
  }
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Working late'
}

function getDateLabel(now: Date, lang: 'en' | 'ar'): string {
  return now.toLocaleDateString(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export interface GreetingResult {
  greeting: string
  dateLabel: string
}

export function useGreeting(forcedLang?: 'en' | 'ar'): GreetingResult {
  const currentLang = forcedLang || getCurrentLang()
  const [result, setResult] = useState<GreetingResult>({
    greeting: getGreeting(new Date().getHours(), currentLang),
    dateLabel: getDateLabel(new Date(), currentLang),
  })

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const l = forcedLang || getCurrentLang()
      setResult({ greeting: getGreeting(now.getHours(), l), dateLabel: getDateLabel(now, l) })
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [forcedLang])

  return result
}
