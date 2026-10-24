import type { ElementType } from 'react'

export interface AttentionItem {
  icon?: ElementType
  label: string
  count: string
  tone: 'amber' | 'rose' | 'blue'
  detail: string
}

export interface Product {
  name: string
  sold: string
  qty: string
  left: string
  color: 'ocean' | 'sky' | 'rose'
  height: string
  status?: string
}

export interface Rep {
  name: string
  region: string
  sales: string
  goal: string
}

export interface Client {
  name: string
  meta: string
  status: 'Active' | 'Overdue' | 'Healthy' | 'Pending' | string
  region?: string
  phone?: string
  assignedRep?: string
  specialty?: string
}

export interface Invoice {
  id: string
  client: string
  amount: string
  meta: string
  status: 'Pending' | 'Approved' | 'Rejected' | string
  source?: string
  date?: string
}

export interface Batch {
  batchNumber: string
  units: string
  expiryText: string
  tone: 'rose' | 'green' | 'amber' | 'blue'
}

export interface Visit {
  id: string
  clientName: string
  date: string
  repName: string
  status: 'Completed' | 'Scheduled' | 'Cancelled'
  details: string
}

export interface Territory {
  id: string
  name: string
  leadRep: string
  targetSales: string
  currentSales: string
}

export interface UserAccount {
  id: string
  name: string
  role: string
  email: string
  region: string
  status: 'Active' | 'Inactive'
}

export interface AuditLogEntry {
  id: string
  action: string
  actor: string
  timestamp: string
  target: string
}
