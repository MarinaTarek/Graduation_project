import { invoicesMockData, type InvoiceRecord } from '@/ui/pages/invoices/mock-data'
import { addAuditLog } from './audit'
import { createStore } from './store'

export type StoredInvoice = InvoiceRecord & { updated_at?: string }

export const invoicesStore = createStore<StoredInvoice[]>('invoices', invoicesMockData as StoredInvoice[])

const now = () => new Date().toISOString()

export function addInvoice(data: Omit<StoredInvoice, 'updated_at'>) {
  const invoice: StoredInvoice = { ...data, updated_at: now() }
  invoicesStore.update((list) => [invoice, ...list])
  addAuditLog({
    action: 'Invoice Added',
    actor: invoice.repName || 'User',
    time: 'Just now',
    details: `Added ${invoice.name}`,
  })
  return invoice
}

export function updateInvoice(name: string, patch: Partial<StoredInvoice>) {
  invoicesStore.update((list) =>
    list.map((inv) => (inv.name === name ? { ...inv, ...patch, updated_at: now() } : inv)),
  )
}
