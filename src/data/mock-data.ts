import type { AttentionItem, Product, Rep, Client, Invoice, Batch } from './types'

export const sharedAttentionItems: AttentionItem[] = [
  { label: 'Invoices to review', count: '5', tone: 'amber', detail: 'A few are waiting on you' },
  { label: 'Doctors to reconnect', count: '3', tone: 'rose', detail: 'No visit in 30+ days' },
  { label: 'Batch nearing expiry', count: '1', tone: 'blue', detail: 'Bevato · 12 days' },
]

export const sharedProducts: Product[] = [
  { name: 'Bevato', name_ar: 'بيفاتو', sold: '86%', qty: '12,840', left: '1,920', color: 'ocean', height: '86%', price: 285 },
  { name: 'Naviro D3 50,000 IU', name_ar: 'نافيرو د3 50,000', sold: '72%', qty: '8,620', left: '2,140', color: 'sky', height: '72%' },
  { name: 'Naviro D3 10,000 IU', name_ar: 'نافيرو د3 10,000', sold: '64%', qty: '7,290', left: '2,840', color: 'sky', height: '64%' },
  { name: 'Naviro D3 Drops', name_ar: 'نافيرو د3 نقط', sold: '48%', qty: '5,410', left: '4,980', color: 'rose', height: '48%' },
  { name: 'Navigen Product 5', name_ar: 'نافيجين منتج 5', sold: '39%', qty: '4,110', left: '5,920', color: 'rose', height: '39%' },
]

export const sharedReps: Rep[] = [
  { name: 'Olivia Martin', name_ar: 'أوليفيا مارتن', region: 'North region', sales: 'EGP 42.8k', goal: '98%' },
  { name: 'Maya Patel', name_ar: 'مايا باتيل', region: 'West region', sales: 'EGP 39.4k', goal: '91%' },
  { name: 'James Wilson', name_ar: 'جيمس ويلسون', region: 'Central region', sales: 'EGP 35.9k', goal: '84%' },
  { name: 'Sofia Chen', name_ar: 'صوفيا تشين', region: 'East region', sales: 'EGP 32.6k', goal: '79%' },
]

export const sharedClients: Client[] = [
  { name: 'Dr. Sarah Kim', name_ar: 'د. سارة كيم', meta: 'Cardiology · North region', status: 'Active', region: 'North', assignedRep: 'Olivia Martin' },
  { name: 'Green Cross Pharmacy', name_ar: 'صيدلية جرين كروس', meta: 'Pharmacy · West region', status: 'Active', region: 'West', assignedRep: 'Maya Patel' },
  { name: 'Dr. Marcus Lee', name_ar: 'د. ماركوس لي', meta: 'Cardiology · North region', status: 'Overdue', region: 'North', assignedRep: 'Olivia Martin' },
  { name: 'Wellness First', name_ar: 'ويلنس فيرست', meta: 'Pharmacy · West region', status: 'Active', region: 'West', assignedRep: 'Maya Patel' },
]

export const sharedInvoices: Invoice[] = [
  { id: 'INV-1048', client: 'Green Cross Pharmacy', amount: 'EGP 8,420.00', meta: 'Telegram sourced · EGP 8,420', status: 'Pending', source: 'Telegram sourced', date: 'Oct 24, 2026' },
  { id: 'INV-1047', client: 'MedPlus', amount: 'EGP 4,840.00', meta: 'Uploaded yesterday · EGP 4,840', status: 'Approved', source: 'Direct intake', date: 'Oct 23, 2026' },
  { id: 'INV-1046', client: 'Wellcare', amount: 'EGP 5,480.00', meta: 'Uploaded yesterday · EGP 5,480', status: 'Rejected', source: 'Field upload', date: 'Oct 23, 2026' },
  { id: 'INV-1045', client: 'Northstar', amount: 'EGP 6,120.00', meta: 'Uploaded yesterday · EGP 6,120', status: 'Approved', source: 'Direct intake', date: 'Oct 22, 2026' },
]

export const sharedBatches: Batch[] = [
  { batchNumber: 'BV-2401', units: '1,920 units', expiryText: '12 days', tone: 'rose' },
  { batchNumber: 'BV-2402', units: '4,820 units', expiryText: '4 months', tone: 'green' },
  { batchNumber: 'BV-2403', units: '6,100 units', expiryText: '8 months', tone: 'green' },
]
