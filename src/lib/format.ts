export function formatCurrency(amount?: number | null, currency = 'EGP'): string {
  if (amount === undefined || amount === null || amount === 0 || (typeof amount === 'number' && isNaN(amount))) {
    return 'Price not set'
  }
  const hasDecimals = typeof amount === 'number' && amount % 1 !== 0
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(amount)
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
