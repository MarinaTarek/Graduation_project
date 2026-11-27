/**
 * reportCatalog.ts
 *
 * Central Report Catalog defining metadata, categories, authorized roles,
 * available filters, and export configuration.
 */

import type { UserRole } from '@/lib/auth/types'

export type ReportCategory = 'Commercial' | 'Field & Visits' | 'Inventory' | 'Operations'

export interface ReportMeta {
  id: string
  title: string
  title_ar: string
  description: string
  description_ar: string
  category: ReportCategory
  category_ar: string
  authorizedRoles: UserRole[]
  availableFilters: Array<'month' | 'region' | 'rep' | 'product'>
  canExport: boolean
  iconName: 'sales' | 'sellinout' | 'coverage' | 'stock' | 'invoices' | 'scorecard'
  sparkline: number[]
  sparklineColor: string
}

export const REPORT_CATALOG: ReportMeta[] = [
  {
    id: 'sales-performance',
    title: 'Sales Performance',
    title_ar: 'أداء المبيعات والهدف المالي',
    description: 'Revenue vs quota benchmarks by territory, representative, and product line.',
    description_ar: 'مقارنة المبيعات المحققة مقابل الأهداف بحسب المنطقة والمندوب ومحفظة المنتجات.',
    category: 'Commercial',
    category_ar: 'المبيعات والتجارة',
    authorizedRoles: ['admin', 'business_unit_manager', 'first_line_manager'],
    availableFilters: ['month', 'region', 'rep', 'product'],
    canExport: true,
    iconName: 'sales',
    sparkline: [42, 58, 65, 78, 72, 88, 94, 104],
    sparklineColor: 'var(--ocean)',
  },
  {
    id: 'sell-in-vs-sell-out',
    title: 'Sell-in vs Sell-out',
    title_ar: 'المبيعات الداخلية مقابل مبيعات الصيدليات',
    description: 'Wholesale distributor intake compared to pharmacy dispense velocity and inventory runout.',
    description_ar: 'توريدات الموزعين ومستودعات الأدوية مقابل معدلات سحب وصرف الصيدليات.',
    category: 'Commercial',
    category_ar: 'المبيعات والتجارة',
    authorizedRoles: ['admin', 'business_unit_manager', 'marketing_manager'],
    availableFilters: ['month', 'region', 'rep', 'product'],
    canExport: true,
    iconName: 'sellinout',
    sparkline: [60, 64, 70, 75, 71, 79, 82, 85],
    sparklineColor: 'var(--story-em, #3e9a78)',
  },
  {
    id: 'visit-coverage',
    title: 'Visit Coverage',
    title_ar: 'تغطية الزيارات الطبية والميدانية',
    description: 'Target medical practitioner visit frequency, territory gaps, and overdue doctor accounts.',
    description_ar: 'معدلات زيارة الأطباء المستهدفين، الفئات (أ/ب)، وتغطية المناطق الجغرافية.',
    category: 'Field & Visits',
    category_ar: 'العمليات الميدانية',
    authorizedRoles: ['admin', 'business_unit_manager', 'first_line_manager'],
    availableFilters: ['month', 'region', 'rep'],
    canExport: true,
    iconName: 'coverage',
    sparkline: [82, 85, 80, 88, 86, 91, 89, 93],
    sparklineColor: 'var(--sky)',
  },
  {
    id: 'stock-expiry',
    title: 'Stock & Expiry',
    title_ar: 'المخزون وصلاحية التشغيلات',
    description: 'Warehouse balance, consignment shelf life, and critical expiry risk categorizations.',
    description_ar: 'أرصدة المستودعات، فترات الصلاحية، ومراقبة التشغيلات القريبة من الانتهاء (FEFO).',
    category: 'Inventory',
    category_ar: 'المخزون والمستودعات',
    authorizedRoles: ['admin', 'business_unit_manager', 'marketing_manager'],
    availableFilters: ['month', 'product'],
    canExport: true,
    iconName: 'stock',
    sparkline: [95, 92, 90, 88, 85, 82, 84, 81],
    sparklineColor: 'var(--amber)',
  },
  {
    id: 'invoices-approvals',
    title: 'Invoices & Approvals',
    title_ar: 'الفواتير والاعتمادات',
    description: 'Claim validation velocity, telegram intake volumes, rejection reasons, and turnaround times.',
    description_ar: 'مراجعة الفواتير واعتمادها، أسباب الرفض، ومطابقة الأرصدة المالية.',
    category: 'Operations',
    category_ar: 'العمليات والمالية',
    authorizedRoles: ['admin', 'business_unit_manager'],
    availableFilters: ['month', 'region', 'rep'],
    canExport: true,
    iconName: 'invoices',
    sparkline: [30, 45, 60, 72, 85, 90, 94, 98],
    sparklineColor: 'var(--ocean)',
  },
  {
    id: 'rep-scorecard',
    title: 'Rep Scorecard',
    title_ar: 'بطاقة أداء المندوب',
    description: 'Individual KPI attainment, physician coverage, sample distribution, and commission pacing.',
    description_ar: 'الإنجاز الفردي، تغطية الأطباء، العينات الموزعة، ومتابعة تحقيق الأهداف.',
    category: 'Field & Visits',
    category_ar: 'العمليات الميدانية',
    authorizedRoles: ['admin', 'business_unit_manager', 'first_line_manager', 'rep'],
    availableFilters: ['month', 'rep'],
    canExport: false, // Default false; checked dynamically per role
    iconName: 'scorecard',
    sparkline: [70, 75, 82, 89, 92, 98, 102, 108],
    sparklineColor: 'var(--navy)',
  },
]

export function getAuthorizedReportsForRole(role: UserRole | string): ReportMeta[] {
  const normRole = (role || 'rep') as UserRole
  return REPORT_CATALOG.filter((report) => report.authorizedRoles.includes(normRole))
}

export function isReportAuthorizedForRole(reportId: string, role: UserRole | string): boolean {
  const report = REPORT_CATALOG.find((r) => r.id === reportId)
  if (!report) return false
  return report.authorizedRoles.includes((role || 'rep') as UserRole)
}
