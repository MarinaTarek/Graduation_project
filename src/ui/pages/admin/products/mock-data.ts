export interface CatalogProduct {
  code: string
  name: string
  category: string
  standardPack: string
  status: string
  price: number
  updated_at?: string
}

export const adminProductsMockData: CatalogProduct[] = [
  { code: 'PRD-01', name: 'Cardiwell 20mg', category: 'Cardiovascular', standardPack: '30 tablets / box', status: 'Active', price: 240, updated_at: '2026-10-24T12:00:00.000Z' },
  { code: 'PRD-02', name: 'Neurofen Plus', category: 'Neurology', standardPack: '20 capsules / box', status: 'Active', price: 185, updated_at: '2026-10-24T12:00:00.000Z' },
  { code: 'PRD-03', name: 'Immunex Kids', category: 'Pediatrics', standardPack: '120ml syrup', status: 'Active', price: 95, updated_at: '2026-10-24T12:00:00.000Z' },
  { code: 'PRD-04', name: 'Gastrocalm', category: 'Gastroenterology', standardPack: '24 chewable tablets', status: 'Active', price: 120, updated_at: '2026-10-24T12:00:00.000Z' },
  { code: 'PRD-05', name: 'Respira 10mg', category: 'Pulmonology', standardPack: '14 sachets', status: 'Active', price: 310, updated_at: '2026-10-24T12:00:00.000Z' },
]
