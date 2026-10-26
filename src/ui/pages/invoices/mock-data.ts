export interface InvoiceRecord {
  name: string
  name_ar?: string
  meta: string
  meta_ar?: string
  status: string
  source: 'Telegram' | 'Web upload'
  dateRange: 'Today' | 'Last 7 days' | 'This month' | 'Last month'
  repName: string
}

export const invoicesMockData: InvoiceRecord[] = [
  { name: 'INV-1048 · Green Cross', name_ar: 'INV-1048 · صيدلية جرين كروس', meta: 'Telegram sourced · EGP 8,420', meta_ar: 'عبر تيليجرام · 8,420 ج.م', status: 'Pending', source: 'Telegram', dateRange: 'Today', repName: 'Alex Morgan' },
  { name: 'INV-1047 · MedPlus', name_ar: 'INV-1047 · صيدلية ميد بلس', meta: 'Web uploaded · EGP 4,840', meta_ar: 'رفع يدوي عبر الويب · 4,840 ج.م', status: 'Approved', source: 'Web upload', dateRange: 'Last 7 days', repName: 'Alex Morgan' },
  { name: 'INV-1046 · Wellcare', name_ar: 'INV-1046 · صيدلية ويل كير', meta: 'Web uploaded · EGP 5,480', meta_ar: 'رفع يدوي عبر الويب · 5,480 ج.م', status: 'Rejected', source: 'Web upload', dateRange: 'Last 7 days', repName: 'Maya Patel' },
  { name: 'INV-1045 · Northstar', name_ar: 'INV-1045 · صيدلية نورث ستار', meta: 'Telegram sourced · EGP 6,120', meta_ar: 'عبر تيليجرام · 6,120 ج.م', status: 'Approved', source: 'Telegram', dateRange: 'This month', repName: 'Alex Morgan' },
  { name: 'INV-1044 · City Clinic', name_ar: 'INV-1044 · عيادة سيتي كلينك', meta: 'Telegram sourced · EGP 3,210', meta_ar: 'عبر تيليجرام · 3,210 ج.م', status: 'Pending', source: 'Telegram', dateRange: 'Last 7 days', repName: 'Olivia Martin' },
  { name: 'INV-1043 · Apex Pharma', name_ar: 'INV-1043 · صيدلية أبيكس فارما', meta: 'Web uploaded · EGP 7,900', meta_ar: 'رفع يدوي عبر الويب · 7,900 ج.م', status: 'Approved', source: 'Web upload', dateRange: 'Last month', repName: 'Alex Morgan' },
]
