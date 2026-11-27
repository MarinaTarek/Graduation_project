import { clientsMockData, type ClientRecord } from '@/ui/pages/clients/mock-data'
import { addAuditLog } from './audit'
import { createStore } from './store'
import { invoicesStore } from './invoices'
import { salesOrdersStore } from './sales-orders'
import { visitsStore } from './visits'
import { safeArchiveCustomer, canDeleteCustomer } from './referentialIntegrity'
import { getSystemNow } from '@/lib/dateUtils'
import { findAuthoritativeUser } from '@/lib/approval/approvalEngine'
import { getAuthorizedScope } from './dataScope'

export type Customer = ClientRecord & { updated_at?: string; deleted_at?: string | null }

export function validateCustomerClassification(classification?: string): { valid: boolean; error?: string } {
  if (!classification || !classification.trim()) {
    return { valid: false, error: 'Classification is required' }
  }
  const clean = classification.trim()
  const validClasses = ['Class A', 'Class B', 'Class C', 'A', 'B', 'C']
  if (!validClasses.includes(clean)) {
    return { valid: false, error: `Invalid classification: ${classification}. Must be Class A, B, or C.` }
  }
  return { valid: true }
}

export const customersStore = createStore<Customer[]>('customers', clientsMockData as Customer[])

const now = () => getSystemNow().toISOString()

export function assertCustomerMutationScope(
  actor: string | { id?: string; name?: string; role?: string; email?: string } | undefined,
  customerData: Partial<Customer>,
  operation: 'add' | 'edit' | 'delete' | 'archive' | 'restore'
) {
  if (!actor || actor === 'User') return // allow legacy mock calls without explicit actor
  const authUser = findAuthoritativeUser(actor)
  const actorObj = typeof actor === 'object' && actor ? actor : null
  const actorUser = authUser || {
    id: actorObj?.id || `u-${(actorObj?.name || (typeof actor === 'string' ? actor : 'unknown')).toLowerCase().replace(/\s+/g, '-')}`,
    name: actorObj?.name || (typeof actor === 'string' ? actor : 'Unknown User'),
    role: (actorObj?.role || (typeof actor === 'string' && actor.toLowerCase().includes('admin') ? 'admin' : 'rep')) as any,
    businessUnit: (actorObj as any)?.businessUnit,
  }

  const scope = getAuthorizedScope(actorUser)
  if (scope.isCompanyWide) return

  if (scope.isMarketingOnly) {
    throw new Error(`Unauthorized customer mutation: Marketing Managers are restricted from performing ${operation} operations on customer records.`)
  }

  const custRepId = (customerData.rep_id || (customerData as any).assignedRepId || '').toLowerCase()
  const custRepName = (customerData.repName || (customerData as any).assignedRepName || '').toLowerCase()

  if (actorUser.role === 'rep') {
    const isOwn =
      (custRepId && custRepId === actorUser.id.toLowerCase()) ||
      (custRepName && custRepName === actorUser.name.toLowerCase())
    if (!isOwn) {
      throw new Error(`Unauthorized customer mutation: Medical Representatives can only ${operation} their own assigned customers.`)
    }
    return
  }

  // FLM / BUM scope check
  const idMatch = custRepId && (scope.repIds as string[]).some((id) => id.toLowerCase() === custRepId)
  const nameMatch = custRepName && (scope.repNames as string[]).some((n) => n.toLowerCase() === custRepName)

  if (!idMatch && !nameMatch) {
    throw new Error(`Unauthorized customer mutation: User "${actorUser.name}" (${actorUser.role}) cannot ${operation} customer "${customerData.name || customerData.id}" outside their authorized organizational scope.`)
  }
}

export function addCustomer(
  data: Omit<Customer, 'updated_at' | 'deleted_at'> & { id?: string },
  actor?: string | { id?: string; name?: string; role?: string }
) {
  if (actor) {
    assertCustomerMutationScope(actor, data, 'add')
  }

  const actorName = typeof actor === 'object' && actor ? actor.name || 'User' : (actor || 'User')
  const customer: Customer = {
    ...data,
    id: data.id ?? `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: data.status || 'Active',
    active: data.active ?? true,
    updated_at: now(),
    deleted_at: null,
  }
  customersStore.update((list) => [customer, ...list])
  addAuditLog({
    action: 'Customer Added',
    actor: customer.repName || actorName,
    time: 'Just now',
    details: `Added customer ${customer.name}`,
  })
  return customer
}

export function updateCustomer(
  id: string,
  patch: Partial<Customer>,
  actor?: string | { id?: string; name?: string; role?: string }
) {
  const current = customersStore.get().find((c) => c.id === id)
  if (current && actor) {
    assertCustomerMutationScope(actor, current, 'edit')
  }

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
  const actorName = typeof actor === 'object' && actor ? actor.name || 'User' : (actor || 'User')
  addAuditLog({
    action: patch.deleted_at === null ? 'Customer Restored' : 'Customer Updated',
    actor: actorName,
    time: 'Just now',
    details: `Updated customer ${targetName}`,
  })
}

/**
 * Soft-delete / safe archive customer. Preserves all historical invoices,
 * collections, and sales orders while marking the customer inactive.
 * Allows archiving customers with historical invoices or completed orders.
 */
export function deleteCustomer(
  id: string,
  actor?: string | { id?: string; name?: string; role?: string }
) {
  const current = customersStore.get().find((c) => c.id === id)
  if (current && actor) {
    assertCustomerMutationScope(actor, current, 'delete')
  }
  const actorName = typeof actor === 'object' && actor ? actor.name || 'User' : (actor || 'User')
  return safeArchiveCustomer(id, actorName)
}

export function archiveCustomer(
  id: string,
  actor?: string | { id?: string; name?: string; role?: string }
) {
  const current = customersStore.get().find((c) => c.id === id)
  if (current && actor) {
    assertCustomerMutationScope(actor, current, 'archive')
  }
  const actorName = typeof actor === 'object' && actor ? actor.name || 'User' : (actor || 'User')
  return safeArchiveCustomer(id, actorName)
}

export function restoreCustomer(
  id: string,
  actor?: string | { id?: string; name?: string; role?: string }
) {
  const current = customersStore.get().find((c) => c.id === id)
  if (current && actor) {
    assertCustomerMutationScope(actor, current, 'restore')
  }

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
  const actorName = typeof actor === 'object' && actor ? actor.name || 'User' : (actor || 'User')
  addAuditLog({
    action: 'Customer Restored',
    actor: actorName,
    time: 'Just now',
    details: `Restored customer ${targetName} (${id}) to active status.`,
  })
}

/**
 * Hard delete: strictly prohibited if customer has transactional references
 * (invoices, sales orders, visits).
 */
export function hardDeleteCustomer(
  id: string,
  actor?: string | { id?: string; name?: string; role?: string }
) {
  const current = customersStore.get().find((c) => c.id === id)
  if (current && actor) {
    assertCustomerMutationScope(actor, current, 'delete')
  }

  const check = canDeleteCustomer(id)
  if (!check.allowed) {
    throw new Error(
      `Cannot hard delete customer ${id}: ${check.reason}. Use archiveCustomer instead.`
    )
  }

  const actorName = typeof actor === 'object' && actor ? actor.name || 'User' : (actor || 'User')
  customersStore.update((list) => list.filter((c) => c.id !== id))
  addAuditLog({
    action: 'Customer Permanently Deleted',
    actor: actorName,
    time: 'Just now',
    details: `Permanently removed customer ${id} (0 historical transactions)`,
  })
}
