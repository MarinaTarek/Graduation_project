export function formatCurrency(amount?: number | null, currency = 'EGP'): string {
  if (amount === undefined || amount === null || (typeof amount === 'number' && isNaN(amount))) {
    return 'Price not set'
  }
  const hasDecimals = typeof amount === 'number' && amount % 1 !== 0
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(amount)
  return `${currency} ${formatted}`
}

export function formatCurrencyCompact(amount?: number | null, currency = 'EGP'): string {
  if (amount === undefined || amount === null || (typeof amount === 'number' && isNaN(amount))) {
    return `${currency} 0`
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
  return `${currency} ${formatted}`
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return String(date)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return String(date)
  const diffDays = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays > 0) return `${diffDays} days ago`
  return `In ${Math.abs(diffDays)} days`
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}
