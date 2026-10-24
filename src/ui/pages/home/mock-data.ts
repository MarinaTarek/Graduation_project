import { Clock3, FileText, Stethoscope } from 'lucide-react'
import type { ElementType } from 'react'

export interface HomeAttentionItem {
  icon: ElementType
  label: string
  count: string
  tone: 'amber' | 'rose' | 'blue'
  detail: string
}

export const homeAttentionItems: HomeAttentionItem[] = [
  { icon: FileText, label: 'Invoices to review', count: '5', tone: 'amber', detail: 'A few are waiting on you' },
  { icon: Stethoscope, label: 'Doctors to reconnect', count: '3', tone: 'rose', detail: 'No visit in 30+ days' },
  { icon: Clock3, label: 'Batch nearing expiry', count: '1', tone: 'blue', detail: 'Cardiwell 20mg · 12 days' },
]

export const homeProducts = [
  { name: 'Cardiwell 20mg', sold: '86%', qty: '12,840', left: '1,920', color: 'ocean' as const, height: '86%' },
  { name: 'Neurofen Plus', sold: '72%', qty: '8,620', left: '2,140', color: 'sky' as const, height: '72%' },
  { name: 'Immunex Kids', sold: '64%', qty: '7,290', left: '2,840', color: 'sky' as const, height: '64%' },
  { name: 'Gastrocalm', sold: '48%', qty: '5,410', left: '4,980', color: 'rose' as const, height: '48%' },
  { name: 'Respira 10mg', sold: '39%', qty: '4,110', left: '5,920', color: 'rose' as const, height: '39%' },
]

export const homeReps = [
  ['Olivia Martin', 'North region', '$42.8k', '98%'],
  ['Maya Patel', 'West region', '$39.4k', '91%'],
  ['James Wilson', 'Central region', '$35.9k', '84%'],
  ['Sofia Chen', 'East region', '$32.6k', '79%'],
] as const

export const homeQuote = {
  quote: "The best territory is not the one with the most doctors. It's the one where every relationship is remembered.",
  attribution: '— Your field team, this morning',
}

// ── Pharma Dashboard Additions ──────────────────────────────────────────────

/** Visit interval targets per customer classification (days) */
export const VISIT_INTERVAL_DAYS = { A: 14, B: 30, C: 60 } as const

export interface HomeCustomer {
  customer_id: string
  name: string
  classification: 'A' | 'B' | 'C'
  rep_id: string
  rep_name: string
  region: string
  last_visit_date: string   // ISO date string
  status: string
}

export const homeCustomers: HomeCustomer[] = [
  { customer_id: 'c-1', name: 'Dr. Sarah Kim',       classification: 'A', rep_id: 'rep-olivia', rep_name: 'Olivia Martin', region: 'North region',   last_visit_date: '2026-10-18', status: 'Active' },
  { customer_id: 'c-2', name: 'Green Cross Pharmacy',classification: 'A', rep_id: 'rep-maya',   rep_name: 'Maya Patel',    region: 'West region',    last_visit_date: '2026-10-15', status: 'Active' },
  { customer_id: 'c-3', name: 'Dr. Marcus Lee',      classification: 'B', rep_id: 'rep-olivia', rep_name: 'Olivia Martin', region: 'North region',   last_visit_date: '2026-09-20', status: 'Overdue' },
  { customer_id: 'c-4', name: 'Wellness First',      classification: 'B', rep_id: 'rep-maya',   rep_name: 'Maya Patel',    region: 'West region',    last_visit_date: '2026-10-12', status: 'Active' },
  { customer_id: 'c-5', name: 'Dr. Emily Watson',    classification: 'A', rep_id: 'u-admin-1',  rep_name: 'Alex Morgan',   region: 'Central region', last_visit_date: '2026-10-22', status: 'Active' },
  { customer_id: 'c-6', name: 'Metro Health Center', classification: 'C', rep_id: 'rep-olivia', rep_name: 'Olivia Martin', region: 'East region',    last_visit_date: '2026-08-10', status: 'Overdue' },
  { customer_id: 'c-7', name: 'St. Jude Medical',   classification: 'B', rep_id: 'u-admin-1',  rep_name: 'Alex Morgan',   region: 'Central region', last_visit_date: '2026-10-21', status: 'Active' },
  { customer_id: 'c-8', name: 'NovaMed Clinic',     classification: 'A', rep_id: 'rep-james',  rep_name: 'James Wilson',  region: 'Central region', last_visit_date: '2026-10-10', status: 'Active' },
  { customer_id: 'c-9', name: 'Riverside Pharmacy', classification: 'C', rep_id: 'rep-sofia',  rep_name: 'Sofia Chen',    region: 'East region',    last_visit_date: '2026-09-01', status: 'Active' },
]

export interface HomeSampleEntry {
  rep_id: string
  rep_name: string
  product_name: string
  samples_this_month: number
}

export const homeSamples: HomeSampleEntry[] = [
  { rep_id: 'u-admin-1',  rep_name: 'Alex Morgan',   product_name: 'Cardiwell 20mg', samples_this_month: 35 },
  { rep_id: 'rep-olivia', rep_name: 'Olivia Martin', product_name: 'Cardiwell 20mg', samples_this_month: 25 },
  { rep_id: 'rep-olivia', rep_name: 'Olivia Martin', product_name: 'Neurofen Plus',  samples_this_month: 20 },
  { rep_id: 'rep-maya',   rep_name: 'Maya Patel',    product_name: 'Cardiwell 20mg', samples_this_month: 18 },
  { rep_id: 'rep-maya',   rep_name: 'Maya Patel',    product_name: 'Immunex Kids',   samples_this_month: 14 },
  { rep_id: 'rep-james',  rep_name: 'James Wilson',  product_name: 'Neurofen Plus',  samples_this_month: 12 },
  { rep_id: 'rep-james',  rep_name: 'James Wilson',  product_name: 'Gastrocalm',     samples_this_month: 8  },
  { rep_id: 'rep-sofia',  rep_name: 'Sofia Chen',    product_name: 'Respira 10mg',   samples_this_month: 10 },
  { rep_id: 'u-admin-1',  rep_name: 'Alex Morgan',   product_name: 'Neurofen Plus',  samples_this_month: 22 },
]

export interface HomeExpiringBatch {
  batch_id: string
  product_name: string
  batch_no: string
  expiry_date: string   // ISO date
  qty: string
  rep_id?: string       // custody rep for stock-with-reps
}

export const homeExpiringBatches: HomeExpiringBatch[] = [
  { batch_id: 'b-1', product_name: 'Cardiwell 20mg', batch_no: 'CW-2401', expiry_date: '2026-11-05', qty: '1,920 units' },
  { batch_id: 'b-2', product_name: 'Neurofen Plus',  batch_no: 'NP-0312', expiry_date: '2027-01-15', qty: '840 units' },
  { batch_id: 'b-3', product_name: 'Immunex Kids',   batch_no: 'IK-0519', expiry_date: '2027-03-20', qty: '320 units' },
  { batch_id: 'b-4', product_name: 'Gastrocalm',     batch_no: 'GC-1104', expiry_date: '2026-12-10', qty: '560 units' },
]

export interface HomeRegionPerformance {
  region: string
  lead_rep: string
  sales_amount: number   // EGP thousands
  target_amount: number  // EGP thousands
}

export const homeRegions: HomeRegionPerformance[] = [
  { region: 'North region',   lead_rep: 'Olivia Martin', sales_amount: 42800, target_amount: 45000 },
  { region: 'West region',    lead_rep: 'Maya Patel',    sales_amount: 39400, target_amount: 43000 },
  { region: 'Central region', lead_rep: 'James Wilson',  sales_amount: 35900, target_amount: 40000 },
  { region: 'East region',    lead_rep: 'Sofia Chen',    sales_amount: 32600, target_amount: 42000 },
]

export interface HomeReceivable {
  customer_id: string
  customer_name: string
  outstanding_amount: number  // EGP
  overdue_amount: number
  days_overdue: number
  rep_name: string
}

export const homeReceivables: HomeReceivable[] = [
  { customer_id: 'c-2', customer_name: 'Green Cross Pharmacy', outstanding_amount: 24800, overdue_amount: 18600, days_overdue: 45, rep_name: 'Maya Patel' },
  { customer_id: 'c-6', customer_name: 'Metro Health Center',  outstanding_amount: 15200, overdue_amount: 15200, days_overdue: 72, rep_name: 'Olivia Martin' },
  { customer_id: 'c-9', customer_name: 'Riverside Pharmacy',   outstanding_amount: 9400,  overdue_amount: 6800,  days_overdue: 30, rep_name: 'Sofia Chen' },
  { customer_id: 'c-4', customer_name: 'Wellness First',       outstanding_amount: 7100,  overdue_amount: 0,     days_overdue: 0,  rep_name: 'Maya Patel' },
]

export interface HomeReturnEntry {
  product_name: string
  units_returned: number
  reason: string
  rep_id: string
  rep_name: string
}

export const homeReturns: HomeReturnEntry[] = [
  { product_name: 'Cardiwell 20mg', units_returned: 48,  reason: 'Near expiry',       rep_id: 'rep-olivia', rep_name: 'Olivia Martin' },
  { product_name: 'Neurofen Plus',  units_returned: 32,  reason: 'Customer rejected',  rep_id: 'rep-maya',   rep_name: 'Maya Patel' },
  { product_name: 'Immunex Kids',   units_returned: 12,  reason: 'Damaged packaging',  rep_id: 'rep-james',  rep_name: 'James Wilson' },
  { product_name: 'Gastrocalm',     units_returned: 8,   reason: 'Near expiry',        rep_id: 'rep-sofia',  rep_name: 'Sofia Chen' },
]

// KPI strip helper — invoices
export const homeKpiStrip = {
  invoices_pending: 5,
  avg_approval_hours: 14,
  batches_near_expiry: 2,
  sell_through_pct: 72,
}
