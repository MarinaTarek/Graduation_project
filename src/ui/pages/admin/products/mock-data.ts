export interface CatalogProduct {
  code: string
  name: string
  category: string
  standardPack: string
  status: string
}

export const adminProductsMockData: CatalogProduct[] = [
  { code: 'PRD-01', name: 'Cardiwell 20mg', category: 'Cardiovascular', standardPack: '30 tablets / box', status: 'Active' },
  { code: 'PRD-02', name: 'Neurofen Plus', category: 'Neurology', standardPack: '20 capsules / box', status: 'Active' },
  { code: 'PRD-03', name: 'Immunex Kids', category: 'Pediatrics', standardPack: '120ml syrup', status: 'Active' },
  { code: 'PRD-04', name: 'Gastrocalm', category: 'Gastroenterology', standardPack: '24 chewable tablets', status: 'Active' },
  { code: 'PRD-05', name: 'Respira 10mg', category: 'Pulmonology', standardPack: '14 sachets', status: 'Active' },
]
