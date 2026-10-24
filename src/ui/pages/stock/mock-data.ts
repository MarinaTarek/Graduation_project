export interface StockProductRecord {
  name: string
  meta: string
  status: string
  left: string
  qty: string
}

export const stockProductsMockData: StockProductRecord[] = [
  { name: 'Cardiwell 20mg', left: '1,920', qty: '12,840', meta: '1,920 units left', status: 'Low stock' },
  { name: 'Neurofen Plus', left: '2,140', qty: '8,620', meta: '2,140 units left', status: 'Low stock' },
  { name: 'Immunex Kids', left: '2,840', qty: '7,290', meta: '2,840 units left', status: 'Healthy' },
  { name: 'Gastrocalm', left: '4,980', qty: '5,410', meta: '4,980 units left', status: 'Healthy' },
  { name: 'Respira 10mg', left: '5,920', qty: '4,110', meta: '5,920 units left', status: 'Healthy' },
]

export const cardiwellBatches = [
  ['CW-2401', '1,920 units', '12 days', 'rose'],
  ['CW-2402', '4,820 units', '4 months', 'green'],
  ['CW-2403', '6,100 units', '8 months', 'green'],
] as const
