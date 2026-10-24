export interface InvoiceRecord {
  name: string
  meta: string
  status: string
}

export const invoicesMockData: InvoiceRecord[] = [
  { name: 'INV-1048 · Green Cross', meta: 'Telegram sourced · $8,420', status: 'Pending' },
  { name: 'INV-1047 · MedPlus', meta: 'Uploaded yesterday · $4,840', status: 'Approved' },
  { name: 'INV-1046 · Wellcare', meta: 'Uploaded yesterday · $5,480', status: 'Rejected' },
  { name: 'INV-1045 · Northstar', meta: 'Uploaded yesterday · $6,120', status: 'Approved' },
]
