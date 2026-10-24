export interface StockProductRecord {
  name: string
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
  { name: 'Cardiwell 20mg', left: '1,920', qty: '12,840', meta: '1,920 units left', status: 'Low stock', category: 'Cardiovascular', location: 'Warehouse', price: 240, updated_at: '2026-10-24T12:00:00.000Z' },
  { name: 'Neurofen Plus', left: '2,140', qty: '8,620', meta: '2,140 units left', status: 'Low stock', category: 'Neurology', location: 'Warehouse', price: 185, updated_at: '2026-10-24T12:00:00.000Z' },
  { name: 'Immunex Kids', left: '2,840', qty: '7,290', meta: '2,840 units left', status: 'Healthy', category: 'Pediatrics', location: 'With reps', price: 95, updated_at: '2026-10-24T12:00:00.000Z' },
  { name: 'Gastrocalm', left: '4,980', qty: '5,410', meta: '4,980 units left', status: 'Healthy', category: 'Gastroenterology', location: 'With reps', price: 120, updated_at: '2026-10-24T12:00:00.000Z' },
  { name: 'Respira 10mg', left: '5,920', qty: '4,110', meta: '5,920 units left', status: 'Healthy', category: 'Respiratory', location: 'Consigned pharmacies', price: 310, updated_at: '2026-10-24T12:00:00.000Z' },
]

export const cardiwellBatches = [
  ['CW-2401', '1,920 units', '12 days', 'rose'],
  ['CW-2402', '4,820 units', '4 months', 'green'],
  ['CW-2403', '6,100 units', '8 months', 'green'],
] as const

export const cardiwellRepsStock = [
  { rep: 'Olivia Martin', qty: '450 units', territory: 'North territory', status: 'Healthy' },
  { rep: 'Maya Patel', qty: '380 units', territory: 'West territory', status: 'Healthy' },
  { rep: 'Alex Morgan', qty: '620 units', territory: 'Central territory', status: 'Healthy' },
  { rep: 'James Wilson', qty: '210 units', territory: 'South territory', status: 'Low buffer' },
]

export const cardiwellPharmaciesStock = [
  { pharmacy: 'Green Cross Pharmacy', qty: '820 units', batch: 'Lot CW-2402', status: 'Healthy' },
  { pharmacy: 'St. Jude Clinic Pharmacy', qty: '640 units', batch: 'Lot CW-2403', status: 'Healthy' },
  { pharmacy: 'Wellness First Dispensary', qty: '460 units', batch: 'Lot CW-2401', status: '12 days left' },
]
