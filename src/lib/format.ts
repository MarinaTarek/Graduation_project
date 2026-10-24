export function getCurrentLang(): 'en' | 'ar' {
  if (typeof document !== 'undefined') {
    return document.documentElement.lang === 'ar' ? 'ar' : 'en'
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('navigen_lang')
      if (saved === 'ar') return 'ar'
    } catch {}
  }
  return 'en'
}

export function formatCurrency(amount?: number | null, currency = 'EGP', lang?: 'en' | 'ar'): string {
  const currentLang = lang || getCurrentLang()
  if (amount === undefined || amount === null || (typeof amount === 'number' && isNaN(amount))) {
    return currentLang === 'ar' ? 'السعر غير محدد' : 'Price not set'
  }
  const hasDecimals = typeof amount === 'number' && amount % 1 !== 0
  const formatted = new Intl.NumberFormat(currentLang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', {
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(amount)

  if (currentLang === 'ar') {
    return `${formatted} ج.م`
  }
  return `${currency} ${formatted}`
}

export function formatCurrencyCompact(amount?: number | null, currency = 'EGP', lang?: 'en' | 'ar'): string {
  const currentLang = lang || getCurrentLang()
  if (amount === undefined || amount === null || (typeof amount === 'number' && isNaN(amount))) {
    return currentLang === 'ar' ? '0 ج.م' : `${currency} 0`
  }
  const abs = Math.abs(amount)
  let formatted: string
  if (abs >= 1_000_000) {
    const val = amount / 1_000_000
    formatted = `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`
  } else if (abs >= 1_000) {
    const val = amount / 1_000
    formatted = `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K`
  } else {
    formatted = String(amount)
  }

  if (currentLang === 'ar') {
    return `${formatted} ج.م`
  }
  return `${currency} ${formatted}`
}

export function formatDate(date: string | Date, lang?: 'en' | 'ar'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return String(date)
  const currentLang = lang || getCurrentLang()
  return d.toLocaleDateString(currentLang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatRelative(date: string | Date, lang?: 'en' | 'ar'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return String(date)
  const currentLang = lang || getCurrentLang()
  const diffDays = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return currentLang === 'ar' ? 'اليوم' : 'Today'
  if (diffDays === 1) return currentLang === 'ar' ? 'أمس' : 'Yesterday'
  if (diffDays > 0) return currentLang === 'ar' ? `منذ ${diffDays} أيام` : `${diffDays} days ago`
  return currentLang === 'ar' ? `خلال ${Math.abs(diffDays)} أيام` : `In ${Math.abs(diffDays)} days`
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}
