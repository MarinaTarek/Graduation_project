export function getCurrentLang(): 'en' | 'ar' {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('navigen_lang')
      if (saved === 'ar' || saved === 'en') return saved
    } catch {}
  }
  if (typeof document !== 'undefined') {
    return document.documentElement.lang === 'ar' ? 'ar' : 'en'
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

export const REP_NAMES_AR: Record<string, string> = {
  'Alex Morgan': 'أليكس مورجان',
  'Maya Patel': 'مايا باتيل',
  'Olivia Martin': 'أوليفيا مارتن',
  'James Wilson': 'جيمس ويلسون',
  'Sofia Chen': 'صوفيا تشن',
}

export function formatRepName(name: string, lang?: 'en' | 'ar'): string {
  const currentLang = lang || getCurrentLang()
  if (currentLang === 'ar') {
    return REP_NAMES_AR[name] || name
  }
  return name
}

export const PRODUCT_NAMES_AR: Record<string, string> = {
  Bevato: 'بيفاتو',
  'Naviro D3 50,000 IU': 'نافيرو د3 50,000',
  'Naviro D3 10,000 IU': 'نافيرو د3 10,000',
  'Naviro D3 Drops': 'نافيرو د3 نقط',
  'Navigen Product 5': 'نافيجين منتج 5',
}

export const REPORT_TERMS_AR: Record<string, string> = {
  'Total Revenue': 'إجمالي الإيرادات',
  'Quota Achievement': 'نسبة تحقيق المستهدف',
  'Average Rep Velocity': 'متوسط سرعة المندوب',
  'Total Sell-In': 'إجمالي المبيعات المباشرة (Sell-In)',
  'Total Sell-Out': 'إجمالي المبيعات للجمهور (Sell-Out)',
  'Sell-Through Ratio': 'معدل التصريف',
  'Target Coverage': 'تغطية المستهدف',
  'Overdue Doctors': 'أطباء متأخرو الزيارة',
  'Total Visits Logged': 'إجمالي الزيارات المسجلة',
  'Invoices Processed': 'الفواتير المعالجة',
  'Avg Approval Time': 'متوسط وقت الموافقة',
  'Rejection Rate': 'معدل الرفض',
  'Total Stock Value': 'إجمالي قيمة المخزون',
}

export function formatReportTerm(term: string, lang?: 'en' | 'ar'): string {
  const currentLang = lang || getCurrentLang()
  if (currentLang === 'ar') {
    return REPORT_TERMS_AR[term] || term
  }
  return term
}

export function formatMetricValue(val: string, lang?: 'en' | 'ar'): string {
  const currentLang = lang || getCurrentLang()
  if (currentLang === 'ar') {
    return val
      .replace(/EGP\s*([\d,]+(\.\d+)?)/g, '$1 ج.م')
      .replace(/Goal:\s*EGP\s*([\d,]+)/g, 'الهدف: $1 ج.م')
      .replace(/(\d+)\s*active field reps/g, '$1 مندوبين نشطين')
      .replace(/(\d+)\s*of\s*(\d+)\s*doctors reached/g, 'تم الوصول إلى $1 من أصل $2 طبيب')
      .replace(/Exceeding cycle interval/g, 'تجاوز الفاصل الزمني للدورة')
      .replace(/(\+?\d+%?)\s*vs prior month/g, '$1 مقارنة بالشهر السابق')
      .replace(/(\+?\d+(\.\d+)?%?)\s*vs target/g, '$1 مقارنة بالمستهدف')
      .replace(/([\d,]+)\s*packs ordered/g, 'تم طلب $1 عبوة')
      .replace(/([\d,]+)\s*packs dispensed/g, 'تم صرف $1 عبوة')
      .replace(/Optimal threshold:\s*([\d%+]+)/g, 'الحد الأمثل: $1')
      .replace(/([\d,]+)\s*claims/g, '$1 مطالبة')
      .replace(/([\d,]+)\s*units in custody/g, '$1 وحدة في العهدة')
      .replace(/Reduced from\s*([\d.]+h)/g, 'انخفاضاً من $1')
      .replace(/(\d+)\s*total rejected/g, 'إجمالي المرفوض $1')
      .replace(/(\d+)\s*accounts/g, '$1 حسابات')
      .replace(/(\d+)\s*visits/g, '$1 زيارة')
      .replace(/([\d.]+)\s*hours/g, '$1 ساعة')
  }
  return val
}

export function formatProductName(product: string, lang?: 'en' | 'ar'): string {
  const currentLang = lang || getCurrentLang()
  if (currentLang === 'ar') {
    return PRODUCT_NAMES_AR[product] || product
  }
  return product
}

export const MONTH_NAMES_AR: Record<string, string> = {
  Jan: 'يناير',
  January: 'يناير',
  Feb: 'فبراير',
  February: 'فبراير',
  Mar: 'مارس',
  March: 'مارس',
  Apr: 'أبريل',
  April: 'أبريل',
  May: 'مايو',
  Jun: 'يونيو',
  June: 'يونيو',
  Jul: 'يوليو',
  July: 'يوليو',
  Aug: 'أغسطس',
  August: 'أغسطس',
  Sep: 'سبتمبر',
  September: 'سبتمبر',
  Oct: 'أكتوبر',
  October: 'أكتوبر',
  Nov: 'نوفمبر',
  November: 'نوفمبر',
  Dec: 'ديسمبر',
  December: 'ديسمبر',
}

export function formatMonth(month: string, lang?: 'en' | 'ar'): string {
  const currentLang = lang || getCurrentLang()
  if (currentLang === 'ar') {
    return MONTH_NAMES_AR[month] || month
  }
  return month
}

