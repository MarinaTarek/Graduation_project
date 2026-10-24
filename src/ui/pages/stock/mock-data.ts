export interface StockProductRecord {
  name: string
  name_ar?: string
  meta: string
  status: string
  left: string
  qty: string
  category?: string
  location?: string
  price?: number
  updated_at?: string
}

export const stockProductsMockData: StockProductRecord[] = [
  { name: 'Bevato', name_ar: 'بيفاتو', left: '1,920', qty: '12,840', meta: '1,920 units left', status: 'Low stock', category: 'Cardiovascular', location: 'Warehouse', price: 285, updated_at: '2026-10-24T12:00:00.000Z' },
  { name: 'Naviro D3 50,000 IU', name_ar: 'نافيرو د3 50,000', left: '2,140', qty: '8,620', meta: '2,140 units left', status: 'Low stock', category: 'Vitamin D', location: 'Warehouse', updated_at: '2026-10-24T12:00:00.000Z' },
  { name: 'Naviro D3 10,000 IU', name_ar: 'نافيرو د3 10,000', left: '2,840', qty: '7,290', meta: '2,840 units left', status: 'Healthy', category: 'Vitamin D', location: 'With reps', updated_at: '2026-10-24T12:00:00.000Z' },
  { name: 'Naviro D3 Drops', name_ar: 'نافيرو د3 نقط', left: '4,980', qty: '5,410', meta: '4,980 units left', status: 'Healthy', category: 'Pediatrics', location: 'With reps', updated_at: '2026-10-24T12:00:00.000Z' },
  { name: 'Navigen Product 5', name_ar: 'نافيجين منتج 5', left: '5,920', qty: '4,110', meta: '5,920 units left', status: 'Healthy', category: 'General', location: 'Consigned pharmacies', updated_at: '2026-10-24T12:00:00.000Z' },
]

export const bevatoBatches = [
  ['BV-2401', '1,920 units', '12 days', 'rose'],
  ['BV-2402', '4,820 units', '4 months', 'green'],
  ['BV-2403', '6,100 units', '8 months', 'green'],
] as const

export const cardiwellBatches = bevatoBatches

export const bevatoRepsStock = [
  { rep: 'Olivia Martin', qty: '450 units', territory: 'North territory', status: 'Healthy' },
  { rep: 'Maya Patel', qty: '380 units', territory: 'West territory', status: 'Healthy' },
  { rep: 'Alex Morgan', qty: '620 units', territory: 'Central territory', status: 'Healthy' },
  { rep: 'James Wilson', qty: '210 units', territory: 'South territory', status: 'Low buffer' },
]

export const cardiwellRepsStock = bevatoRepsStock

export const bevatoPharmaciesStock = [
  { pharmacy: 'Green Cross Pharmacy', qty: '820 units', batch: 'Lot BV-2402', status: 'Healthy' },
  { pharmacy: 'St. Jude Clinic Pharmacy', qty: '640 units', batch: 'Lot BV-2403', status: 'Healthy' },
  { pharmacy: 'Wellness First Dispensary', qty: '460 units', batch: 'Lot BV-2401', status: '12 days left' },
]

export const cardiwellPharmaciesStock = bevatoPharmaciesStock
