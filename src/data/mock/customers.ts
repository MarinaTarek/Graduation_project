import { clientsMockData, type ClientRecord } from '@/ui/pages/clients/mock-data'
import { addAuditLog } from './audit'
import { createStore } from './store'
import { invoicesStore } from './invoices'
import { salesOrdersStore } from './sales-orders'
import { visitsStore } from './visits'
import { safeArchiveCustomer, canDeleteCustomer } from './referentialIntegrity'
import { getSystemNow } from '@/lib/dateUtils'

export type Customer = ClientRecord & { updated_at?: string; deleted_at?: string | null }

export const customersStore = createStore<Customer[]>('customers', clientsMockData as Customer[])

const now = () => getSystemNow().toISOString()

export function addCustomer(data: Omit<Customer, 'updated_at' | 'deleted_at'> & { id?: string }) {
  const customer: Customer = {
    ...data,
    id: data.id ?? `c-${Date.now()}`,
    status: data.status || 'Active',
    active: data.active ?? true,
    updated_at: now(),
    deleted_at: null,
  }
  customersStore.update((list) => [customer, ...list])
  addAuditLog({
    action: 'Customer Added',
    actor: customer.repName || 'User',
    time: 'Just now',
    details: `Added customer ${customer.name}`,
  })
  return customer
}

export function updateCustomer(id: string, patch: Partial<Customer>, actor?: string) {
  const at = now()
  let targetName = id
  customersStore.update((list) =>
    list.map((c) => {
      if (c.id === id) {
        targetName = c.name
        return { ...c, ...patch, updated_at: at }
      }
      return c
    }),
  )
  addAuditLog({
    action: patch.deleted_at === null ? 'Customer Restored' : 'Customer Updated',
    actor: actor || 'User',
    time: 'Just now',
    details: `Updated customer ${targetName}`,
  })
}

/**
 * Soft-delete / safe archive customer. Preserves all historical invoices,
 * collections, and sales orders while marking the customer inactive.
 * Allows archiving customers with historical invoices or completed orders.
 */
export function deleteCustomer(id: string, actor?: string) {
  return safeArchiveCustomer(id, actor || 'User')
}

export function archiveCustomer(id: string, actor?: string) {
  return safeArchiveCustomer(id, actor || 'User')
}

export function restoreCustomer(id: string, actor?: string) {
  const at = now()
  let targetName = id
  customersStore.update((list) =>
    list.map((c) => {
      if (c.id === id) {
        targetName = c.name
        return {
          ...c,
          status: 'Active',
          active: true,
          deleted_at: null,
          updated_at: at,
        }
      }
      return c
    }),
  )
  addAuditLog({
    action: 'Customer Restored',
    actor: actor || 'User',
    time: 'Just now',
    details: `Restored customer ${targetName} (${id}) to active status.`,
  })
}

/**
 * Hard delete: strictly prohibited if customer has transactional references
 * (invoices, sales orders, visits).
 */
export function hardDeleteCustomer(id: string, actor?: string) {
  const check = canDeleteCustomer(id)
  if (!check.allowed) {
    throw new Error(
      `Cannot hard delete customer ${id}: ${check.reason}. Use archiveCustomer instead.`
    )
  }

  customersStore.update((list) => list.filter((c) => c.id !== id))
  addAuditLog({
    action: 'Customer Permanently Deleted',
    actor: actor || 'User',
    time: 'Just now',
    details: `Permanently removed customer ${id} (0 historical transactions)`,
  })
}
