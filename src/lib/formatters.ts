export function formatCurrency(amount: number, currency = 'EGP'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
