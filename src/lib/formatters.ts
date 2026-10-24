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

export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value
  if (isNaN(num)) return String(value)
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatPercent(value: number): string {
  return `${value}%`
}
