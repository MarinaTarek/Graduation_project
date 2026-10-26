export interface SellInOrder {
  orderId: string
  distributor: string
  distributor_ar?: string
  volume: string
  volume_ar?: string
  amount: string
  amount_ar?: string
  status: string
  date: string
}

export const sellInMockOrders: SellInOrder[] = [
  { orderId: 'SO-9021', distributor: 'Apex Pharma Distribution', distributor_ar: 'توزيع أبيكس فارما', volume: '14,200 units', volume_ar: '14,200 وحدة', amount: 'EGP 118,500', amount_ar: '118,500 ج.م', status: 'Delivered', date: 'Oct 22, 2026' },
  { orderId: 'SO-9020', distributor: 'Metro Care Wholesalers', distributor_ar: 'مترو كير لتجارة الأدوية', volume: '8,400 units', volume_ar: '8,400 وحدة', amount: 'EGP 74,200', amount_ar: '74,200 ج.م', status: 'In transit', date: 'Oct 21, 2026' },
  { orderId: 'SO-9019', distributor: 'Unified Health Depot', distributor_ar: 'المستودع الصحي الموحد', volume: '5,600 units', volume_ar: '5,600 وحدة', amount: 'EGP 48,120', amount_ar: '48,120 ج.م', status: 'Delivered', date: 'Oct 19, 2026' },
]

export const sellInSummary = {
  totalMonthlyRevenue: 'EGP 240,820',
  totalMonthlyRevenue_ar: '240,820 ج.م',
  growthPercent: '+8.4%',
  comparedPeriod: 'vs last month',
  comparedPeriod_ar: 'مقارنة بالشهر الماضي',
  totalUnitsMoved: '28,200 units',
  totalUnitsMoved_ar: '28,200 وحدة',
}
