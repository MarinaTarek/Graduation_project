import { clientsMockData, type ClientRecord } from '@/ui/pages/clients/mock-data'
import { addAuditLog } from './audit'
import { createStore } from './store'

export type Customer = ClientRecord & { updated_at?: string; deleted_at?: string | null }

export const customersStore = createStore<Customer[]>('customers', clientsMockData as Customer[])

const now = () => new Date().toISOString()

export function addCustomer(data: Omit<Customer, 'updated_at' | 'deleted_at'> & { id?: string }) {
  const customer: Customer = {
    ...data,
    id: data.id ?? `c-${Date.now()}`,
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

export function deleteCustomer(id: string, actor?: string) {
  const at = now()
  let targetName = id
  customersStore.update((list) =>
    list.map((c) => {
      if (c.id === id) {
        targetName = c.name
        return { ...c, deleted_at: at, updated_at: at }
      }
      return c
    }),
  )
  addAuditLog({
    action: 'Customer Deleted',
    actor: actor || 'User',
    time: 'Just now',
    details: `Deleted customer ${targetName}`,
  })
}
