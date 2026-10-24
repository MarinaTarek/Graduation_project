export interface CatalogProduct {
  code: string
  name: string
  name_ar?: string
  category: string
  standardPack: string
  status: string
  price?: number
  updated_at?: string
}

export const adminProductsMockData: CatalogProduct[] = [
  { code: 'PRD-01', name: 'Bevato', name_ar: 'بيفاتو', category: 'Cardiovascular', standardPack: '30 tablets / box', status: 'Active', price: 285, updated_at: '2026-10-24T12:00:00.000Z' },
  { code: 'PRD-02', name: 'Naviro D3 50,000 IU', name_ar: 'نافيرو د3 50,000', category: 'Vitamin D Supplement', standardPack: '20 capsules / box', status: 'Active', updated_at: '2026-10-24T12:00:00.000Z' },
  { code: 'PRD-03', name: 'Naviro D3 10,000 IU', name_ar: 'نافيرو د3 10,000', category: 'Vitamin D Supplement', standardPack: '30 capsules / box', status: 'Active', updated_at: '2026-10-24T12:00:00.000Z' },
  { code: 'PRD-04', name: 'Naviro D3 Drops', name_ar: 'نافيرو د3 نقط', category: 'Pediatrics', standardPack: '15ml oral drops', status: 'Active', updated_at: '2026-10-24T12:00:00.000Z' },
  { code: 'PRD-05', name: 'Navigen Product 5', name_ar: 'نافيجين منتج 5', category: 'General Health', standardPack: '14 sachets', status: 'Active', updated_at: '2026-10-24T12:00:00.000Z' },
]
