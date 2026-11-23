/**
 * dateUtils.ts
 *
 * Authoritative date and time utility engine for Navigen Distribution Suite.
 *
 * Guarantees:
 * - Dynamic system current date resolution (eliminating stale hardcoded dates)
 * - Safe test-clock injection (via setMockSystemDate or NAVIGEN_TEST_DATE env)
 * - Dynamic reporting period and month list generation (handling Dec -> Jan roll-overs)
 * - Complete Arabic and English localized month names
 * - Timezone-safe date string manipulation (YYYY-MM-DD)
 */

export const MONTH_NAMES_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export const MONTH_NAMES_AR: Record<string, string> = {
  January: 'يناير',
  February: 'فبراير',
  March: 'مارس',
  April: 'أبريل',
  May: 'مايو',
  June: 'يونيو',
  July: 'يوليو',
  August: 'أغسطس',
  September: 'سبتمبر',
  October: 'أكتوبر',
  November: 'نوفمبر',
  December: 'ديسمبر',
}

let mockSystemDate: string | null = null

/**
 * Injects a fixed reference date for deterministic testing.
 * Pass `null` to restore the live system wall clock.
 */
export function setMockSystemDate(isoDate: string | null): void {
  mockSystemDate = isoDate
}

/**
 * Resolves the authoritative current date object.
 */
export function getSystemNow(): Date {
  if (mockSystemDate) {
    const d = new Date(mockSystemDate)
    if (!isNaN(d.getTime())) return d
  }
  if (typeof process !== 'undefined' && process.env?.NAVIGEN_TEST_DATE) {
    const d = new Date(process.env.NAVIGEN_TEST_DATE)
    if (!isNaN(d.getTime())) return d
  }
  return new Date()
}

/**
 * Returns current date formatted as YYYY-MM-DD.
 */
export function getSystemCurrentDate(): string {
  if (mockSystemDate) return mockSystemDate.slice(0, 10)
  const now = getSystemNow()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns current year-month formatted as YYYY-MM (e.g. '2026-11').
 */
export function getSystemCurrentYearMonth(): string {
  const cd = getSystemCurrentDate()
  return cd.slice(0, 7)
}

/**
 * Returns the month name of current date in English or Arabic.
 */
export function getSystemCurrentMonthName(lang: 'en' | 'ar' = 'en'): string {
  const now = getSystemNow()
  const nameEn = MONTH_NAMES_EN[now.getMonth()]
  return lang === 'ar' ? (MONTH_NAMES_AR[nameEn] || nameEn) : nameEn
}

/**
 * Returns the formatted Month Year label (e.g. 'November 2026' or 'نوفمبر 2026').
 */
export function getCurrentMonthYearLabel(lang: 'en' | 'ar' = 'en'): string {
  const now = getSystemNow()
  const nameEn = MONTH_NAMES_EN[now.getMonth()]
  const year = now.getFullYear()
  if (lang === 'ar') {
    return `${MONTH_NAMES_AR[nameEn] || nameEn} ${year}`
  }
  return `${nameEn} ${year}`
}

export interface MonthOption {
  key: string       // '2026-11'
  labelEn: string   // 'November 2026'
  labelAr: string   // 'نوفمبر 2026'
  monthEn: string   // 'November'
  monthAr: string   // 'نوفمبر'
  year: number      // 2026
}

/**
 * Generates a dynamic rolling list of months starting from current month going back `count` months.
 * Correctly handles year boundaries (e.g., January 2027 -> December 2026).
 */
export function getRecentMonthOptions(count: number = 6): MonthOption[] {
  const options: MonthOption[] = []
  const now = getSystemNow()
  let curYear = now.getFullYear()
  let curMonth = now.getMonth() // 0-11

  for (let i = 0; i < count; i++) {
    const monthEn = MONTH_NAMES_EN[curMonth]
    const monthAr = MONTH_NAMES_AR[monthEn] || monthEn
    const key = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`

    options.push({
      key,
      labelEn: `${monthEn} ${curYear}`,
      labelAr: `${monthAr} ${curYear}`,
      monthEn,
      monthAr,
      year: curYear,
    })

    curMonth--
    if (curMonth < 0) {
      curMonth = 11
      curYear--
    }
  }

  return options
}

/**
 * Translates an arbitrary 'Month Year' string (e.g. 'October 2026') to Arabic.
 */
export function translateMonthYear(label: string, lang: 'en' | 'ar' = 'en'): string {
  if (lang !== 'ar') return label
  const parts = label.trim().split(/\s+/)
  if (parts.length >= 2) {
    const monthName = parts[0]
    const year = parts[1]
    const arMonth = MONTH_NAMES_AR[monthName]
    if (arMonth) return `${arMonth} ${year}`
  }
  return MONTH_NAMES_AR[label] || label
}

/**
 * Converts a 'Month Year' string (e.g. 'November 2026') into 'YYYY-MM' format ('2026-11').
 */
export function monthLabelToYearMonth(label: string): string {
  const parts = label.trim().split(/\s+/)
  if (parts.length >= 2) {
    const monthName = parts[0]
    const year = parts[1]
    const idx = MONTH_NAMES_EN.indexOf(monthName as any)
    if (idx !== -1) {
      return `${year}-${String(idx + 1).padStart(2, '0')}`
    }
  }
  return label
}

