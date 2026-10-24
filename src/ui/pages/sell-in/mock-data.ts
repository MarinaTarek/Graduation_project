export interface SellInOrder {
  orderId: string
  distributor: string
  volume: string
  amount: string
  status: string
  date: string
}

export const sellInMockOrders: SellInOrder[] = [
  { orderId: 'SO-9021', distributor: 'Apex Pharma Distribution', volume: '14,200 units', amount: '$118,500', status: 'Delivered', date: 'Oct 22, 2026' },
  { orderId: 'SO-9020', distributor: 'Metro Care Wholesalers', volume: '8,400 units', amount: '$74,200', status: 'In transit', date: 'Oct 21, 2026' },
  { orderId: 'SO-9019', distributor: 'Unified Health Depot', volume: '5,600 units', amount: '$48,120', status: 'Delivered', date: 'Oct 19, 2026' },
]

export const sellInSummary = {
  totalMonthlyRevenue: '$240,820',
  growthPercent: '+8.4%',
  comparedPeriod: 'vs last month',
  totalUnitsMoved: '28,200 units',
}
