export interface InvoiceRecord {
  name: string
  meta: string
  status: string
  source: 'Telegram' | 'Web upload'
  dateRange: 'Today' | 'Last 7 days' | 'This month' | 'Last month'
  repName: string
}

export const invoicesMockData: InvoiceRecord[] = [
  { name: 'INV-1048 · Green Cross', meta: 'Telegram sourced · $8,420', status: 'Pending', source: 'Telegram', dateRange: 'Today', repName: 'Alex Morgan' },
  { name: 'INV-1047 · MedPlus', meta: 'Web uploaded · $4,840', status: 'Approved', source: 'Web upload', dateRange: 'Last 7 days', repName: 'Alex Morgan' },
  { name: 'INV-1046 · Wellcare', meta: 'Web uploaded · $5,480', status: 'Rejected', source: 'Web upload', dateRange: 'Last 7 days', repName: 'Maya Patel' },
  { name: 'INV-1045 · Northstar', meta: 'Telegram sourced · $6,120', status: 'Approved', source: 'Telegram', dateRange: 'This month', repName: 'Alex Morgan' },
  { name: 'INV-1044 · City Clinic', meta: 'Telegram sourced · $3,210', status: 'Pending', source: 'Telegram', dateRange: 'Last 7 days', repName: 'Olivia Martin' },
  { name: 'INV-1043 · Apex Pharma', meta: 'Web uploaded · $7,900', status: 'Approved', source: 'Web upload', dateRange: 'Last month', repName: 'Alex Morgan' },
]
