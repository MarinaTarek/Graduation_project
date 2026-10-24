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

export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value
  if (isNaN(num)) return String(value)
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatPercent(value: number): string {
  return `${value}%`
}
