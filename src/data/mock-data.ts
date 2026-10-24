import type { AttentionItem, Product, Rep, Client, Invoice, Batch } from './types'

export const sharedAttentionItems: AttentionItem[] = [
  { label: 'Invoices to review', count: '5', tone: 'amber', detail: 'A few are waiting on you' },
  { label: 'Doctors to reconnect', count: '3', tone: 'rose', detail: 'No visit in 30+ days' },
  { label: 'Batch nearing expiry', count: '1', tone: 'blue', detail: 'Cardiwell 20mg · 12 days' },
]

export const sharedProducts: Product[] = [
  { name: 'Cardiwell 20mg', sold: '86%', qty: '12,840', left: '1,920', color: 'ocean', height: '86%' },
  { name: 'Neurofen Plus', sold: '72%', qty: '8,620', left: '2,140', color: 'sky', height: '72%' },
  { name: 'Immunex Kids', sold: '64%', qty: '7,290', left: '2,840', color: 'sky', height: '64%' },
  { name: 'Gastrocalm', sold: '48%', qty: '5,410', left: '4,980', color: 'rose', height: '48%' },
  { name: 'Respira 10mg', sold: '39%', qty: '4,110', left: '5,920', color: 'rose', height: '39%' },
]

export const sharedReps: Rep[] = [
  { name: 'Olivia Martin', region: 'North region', sales: '$42.8k', goal: '98%' },
  { name: 'Maya Patel', region: 'West region', sales: '$39.4k', goal: '91%' },
  { name: 'James Wilson', region: 'Central region', sales: '$35.9k', goal: '84%' },
  { name: 'Sofia Chen', region: 'East region', sales: '$32.6k', goal: '79%' },
]

export const sharedClients: Client[] = [
  { name: 'Dr. Sarah Kim', meta: 'Cardiology · North region', status: 'Active', region: 'North', assignedRep: 'Olivia Martin' },
  { name: 'Green Cross Pharmacy', meta: 'Pharmacy · West region', status: 'Active', region: 'West', assignedRep: 'Maya Patel' },
  { name: 'Dr. Marcus Lee', meta: 'Cardiology · North region', status: 'Overdue', region: 'North', assignedRep: 'Olivia Martin' },
  { name: 'Wellness First', meta: 'Pharmacy · West region', status: 'Active', region: 'West', assignedRep: 'Maya Patel' },
]

export const sharedInvoices: Invoice[] = [
  { id: 'INV-1048', client: 'Green Cross Pharmacy', amount: '$8,420.00', meta: 'Telegram sourced · $8,420', status: 'Pending', source: 'Telegram sourced', date: 'Oct 24, 2026' },
  { id: 'INV-1047', client: 'MedPlus', amount: '$4,840.00', meta: 'Uploaded yesterday · $4,840', status: 'Approved', source: 'Direct intake', date: 'Oct 23, 2026' },
  { id: 'INV-1046', client: 'Wellcare', amount: '$5,480.00', meta: 'Uploaded yesterday · $5,480', status: 'Rejected', source: 'Field upload', date: 'Oct 23, 2026' },
  { id: 'INV-1045', client: 'Northstar', amount: '$6,120.00', meta: 'Uploaded yesterday · $6,120', status: 'Approved', source: 'Direct intake', date: 'Oct 22, 2026' },
]

export const sharedBatches: Batch[] = [
  { batchNumber: 'CW-2401', units: '1,920 units', expiryText: '12 days', tone: 'rose' },
  { batchNumber: 'CW-2402', units: '4,820 units', expiryText: '4 months', tone: 'green' },
  { batchNumber: 'CW-2403', units: '6,100 units', expiryText: '8 months', tone: 'green' },
]
