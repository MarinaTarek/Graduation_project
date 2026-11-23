/**
 * referentialIntegrity.ts
 *
 * Phase 3 — Data Integrity & Cross-Module Consistency
 * Authoritative referential integrity, foreign key validation, and safe archival rules.
 */

import { customersStore, type Customer } from './customers'
import { productsStore } from './products'
import { usersStore, type StoredAdminUser } from './users'
import { storedUsersStore } from '@/lib/auth/mock-users'
import { warehousesStore, type Warehouse } from './warehouses'
import { salesOrdersStore } from './sales-orders'
import { invoicesStore } from './invoices'
import { visitsStore } from './visits'
import { batchesStore, stockMovementsStore, deriveBatches } from './stockDerived'
import { targetsStore } from './targets'
import { addAuditLog } from './audit'

export class ReferentialIntegrityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReferentialIntegrityError'
  }
}

export class EntityDeactivatedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EntityDeactivatedError'
  }
}

export class EntityNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EntityNotFoundError'
  }
}

// ── Validation Helpers for New Transactions ─────────────────────────────────

export function validateCustomerActive(customerId: string): Customer {
  const customer = customersStore.get().find((c) => c.id === customerId)
  if (!customer) {
    throw new EntityNotFoundError(`Customer not found with ID: ${customerId}`)
  }
  if (customer.deleted_at || customer.status === 'Archived' || customer.active === false) {
    throw new EntityDeactivatedError(`Cannot perform operation: Customer ${customer.name} (${customerId}) is inactive or archived.`)
  }
  return customer
}

export function validateUserActive(userIdOrName: string): StoredAdminUser {
  const user = usersStore.get().find(
    (u) => u.id === userIdOrName || u.name.toLowerCase() === userIdOrName.toLowerCase()
  )
  if (!user) {
    throw new EntityNotFoundError(`User/Representative not found: ${userIdOrName}`)
  }
  if (user.status === 'inactive' || user.status === 'archived') {
    throw new EntityDeactivatedError(`Cannot assign transaction: User ${user.name} (${user.id}) is inactive or archived.`)
  }
  return user
}

export function validateProductActive(codeOrName: string) {
  const product = productsStore.get().find(
    (p) => p.code === codeOrName || p.name.toLowerCase() === codeOrName.toLowerCase()
  )
  if (!product) {
    throw new EntityNotFoundError(`Product not found: ${codeOrName}`)
  }
  if (product.status === 'Inactive' || product.status === 'Archived') {
    throw new EntityDeactivatedError(`Cannot use product: ${product.name} (${product.code}) is inactive or archived.`)
  }
  return product
}

export function validateWarehouseActive(warehouseId: string): Warehouse {
  const wh = warehousesStore.get().find((w) => w.id === warehouseId || w.code === warehouseId)
  if (!wh) {
    throw new EntityNotFoundError(`Warehouse not found: ${warehouseId}`)
  }
  if (wh.status === 'Inactive') {
    throw new EntityDeactivatedError(`Cannot dispatch or receive stock: Warehouse ${wh.name} (${wh.id}) is inactive.`)
  }
  return wh
}

// ── Customer Referential Integrity & Safe Archival ──────────────────────────

export function canArchiveCustomer(customerId: string): {
  allowed: boolean
  reason?: string
  openOrdersCount: number
} {
  const customer = customersStore.get().find((c) => c.id === customerId)
  if (!customer) {
    return { allowed: false, reason: `Customer not found: ${customerId}`, openOrdersCount: 0 }
  }

  // Check for open/in-progress orders (Pending or Approved)
  const openOrders = salesOrdersStore.get().filter(
    (o) => o.customerId === customerId && (o.status === 'Pending' || o.status === 'Approved')
  )

  if (openOrders.length > 0) {
    return {
      allowed: false,
      reason: `Cannot archive customer ${customer.name} (${customerId}): Customer has ${openOrders.length} open/in-progress order(s). Fulfill (dispatch) or cancel open orders before archiving.`,
      openOrdersCount: openOrders.length,
    }
  }

  return { allowed: true, openOrdersCount: 0 }
}

export function canDeleteCustomer(customerId: string): {
  allowed: boolean
  reason?: string
  references: { invoices: number; orders: number; visits: number }
} {
  const invoices = invoicesStore.get().filter((inv) => inv.customerId === customerId)
  const orders = salesOrdersStore.get().filter((o) => o.customerId === customerId)
  const visits = visitsStore.get().filter((v) => v.clientId === customerId || v.doctorId === customerId)

  const references = {
    invoices: invoices.length,
    orders: orders.length,
    visits: visits.length,
  }

  const hasReferences = invoices.length > 0 || orders.length > 0 || visits.length > 0

  if (hasReferences) {
    return {
      allowed: false,
      reason: `Customer ${customerId} has active transactional references (${invoices.length} invoices, ${orders.length} orders, ${visits.length} visits). Hard deletion is forbidden to preserve historical integrity. Use safe archival instead.`,
      references,
    }
  }

  return { allowed: true, references }
}

export function safeArchiveCustomer(customerId: string, actor: string = 'Admin'): Customer {
  const current = customersStore.get().find((c) => c.id === customerId)
  if (!current) {
    throw new EntityNotFoundError(`Customer not found: ${customerId}`)
  }

  const check = canArchiveCustomer(customerId)
  if (!check.allowed) {
    throw new ReferentialIntegrityError(check.reason!)
  }

  const now = new Date().toISOString()
  const updated: Customer = {
    ...current,
    status: 'Archived',
    active: false,
    deleted_at: now,
    updated_at: now,
  }

  customersStore.update((list) => list.map((c) => (c.id === customerId ? updated : c)))

  addAuditLog({
    action: 'Customer Archived',
    actor,
    time: 'Just now',
    details: `Safely archived customer ${current.name} (${customerId}). Historical records preserved.`,
  })

  return updated
}

export function safeRestoreCustomer(customerId: string, actor: string = 'Admin'): Customer {
  const current = customersStore.get().find((c) => c.id === customerId)
  if (!current) {
    throw new EntityNotFoundError(`Customer not found: ${customerId}`)
  }

  const now = new Date().toISOString()
  const updated: Customer = {
    ...current,
    status: 'Active',
    active: true,
    deleted_at: null,
    updated_at: now,
  }

  customersStore.update((list) => list.map((c) => (c.id === customerId ? updated : c)))

  addAuditLog({
    action: 'Customer Restored',
    actor,
    time: 'Just now',
    details: `Restored customer ${current.name} (${customerId}) to Active status.`,
  })

  return updated
}

// ── Product Referential Integrity & Safe Archival ───────────────────────────

export function canDeleteProduct(code: string): {
  allowed: boolean
  reason?: string
  references: { batches: number; movements: number; orders: number }
} {
  const product = productsStore.get().find((p) => p.code === code)
  const productName = product?.name.toLowerCase() ?? ''

  const batches = batchesStore.get().filter(
    (b) => b.product_id === code || b.productName.toLowerCase() === productName
  )
  const movements = stockMovementsStore.get().filter(
    (m) => m.product_id === code || m.productName.toLowerCase() === productName
  )
  const orders = salesOrdersStore.get().filter((o) =>
    o.items.some((i) => i.productCode === code || i.productName.toLowerCase() === productName)
  )

  const references = {
    batches: batches.length,
    movements: movements.length,
    orders: orders.length,
  }

  const hasReferences = batches.length > 0 || movements.length > 0 || orders.length > 0

  if (hasReferences) {
    return {
      allowed: false,
      reason: `Product ${code} has active operational references (${batches.length} batches, ${movements.length} movements, ${orders.length} orders). Hard deletion is forbidden to preserve inventory auditability.`,
      references,
    }
  }

  return { allowed: true, references }
}

export function safeArchiveProduct(code: string, actor: string = 'Admin') {
  const product = productsStore.get().find((p) => p.code === code)
  if (!product) {
    throw new EntityNotFoundError(`Product not found with code: ${code}`)
  }

  const now = new Date().toISOString()
  productsStore.update((list) =>
    list.map((p) => (p.code === code ? { ...p, status: 'Archived', updated_at: now } : p))
  )

  addAuditLog({
    action: 'Product Archived',
    actor,
    time: 'Just now',
    details: `Safely archived product ${product.name} (${code}). Future orders/movements blocked.`,
  })
}

// ── User / Representative Referential Integrity & Deactivation ──────────────

export function canDeleteUser(userId: string): {
  allowed: boolean
  reason?: string
  references: {
    customers: number
    orders: number
    targets: number
    repCustody: number
    invoices: number
    visits: number
    stockMovements: number
  }
} {
  const user = usersStore.get().find((u) => u.id === userId)
  const userName = user?.name.toLowerCase() ?? ''

  const customers = customersStore.get().filter(
    (c) => c.rep_id === userId || (c.repName && c.repName.toLowerCase() === userName)
  )
  const orders = salesOrdersStore.get().filter(
    (o) => o.repId === userId || o.repName.toLowerCase() === userName
  )
  const targets = targetsStore.get().filter(
    (t) => t.repId === userId || t.repName.toLowerCase() === userName
  )
  const invoices = invoicesStore.get().filter(
    (inv) => (inv.repName && inv.repName.toLowerCase() === userName) || inv.repId === userId
  )
  const visits = visitsStore.get().filter(
    (v) => v.repId === userId || (v.repName && v.repName.toLowerCase() === userName)
  )
  const allMovements = stockMovementsStore.get().filter(
    (m) => m.rep_id === userId || (m.repName && m.repName.toLowerCase() === userName)
  )

  // Calculate current rep sample custody
  const repMovements = allMovements
  let repCustody = 0
  for (const m of repMovements) {
    if (m.type === 'transfer_rep') {
      if (m.referenceType === 'return') {
        repCustody -= m.quantity
      } else {
        repCustody += m.quantity
      }
    } else if (m.type === 'sample') {
      repCustody -= m.quantity
    }
  }

  const references = {
    customers: customers.length,
    orders: orders.length,
    targets: targets.length,
    repCustody: Math.max(0, repCustody),
    invoices: invoices.length,
    visits: visits.length,
    stockMovements: allMovements.length,
  }

  const hasReferences =
    customers.length > 0 ||
    orders.length > 0 ||
    targets.length > 0 ||
    repCustody > 0 ||
    invoices.length > 0 ||
    visits.length > 0 ||
    allMovements.length > 0

  if (hasReferences) {
    return {
      allowed: false,
      reason: `User ${userId} (${user?.name}) has active dependencies (${customers.length} assigned customers, ${orders.length} orders, ${invoices.length} invoices, ${visits.length} visits, ${targets.length} targets, ${allMovements.length} movements, ${repCustody} units in sample custody). Hard deletion is blocked. Deactivate the user instead.`,
      references,
    }
  }

  return { allowed: true, references }
}

export function safeDeactivateUser(userId: string, actor: string = 'Admin'): StoredAdminUser {
  const user = usersStore.get().find((u) => u.id === userId)
  if (!user) {
    throw new EntityNotFoundError(`User not found: ${userId}`)
  }

  const now = new Date().toISOString()
  const updated: StoredAdminUser = {
    ...user,
    status: 'Inactive',
    updated_at: now,
  }

  // Synchronize both user stores
  usersStore.update((list) => list.map((u) => (u.id === userId ? updated : u)))
  storedUsersStore.update((authList) =>
    authList.map((u) => (u.id === userId ? { ...u, status: 'disabled' } : u))
  )

  addAuditLog({
    action: 'User Deactivated',
    actor,
    time: 'Just now',
    details: `Safely deactivated user ${user.name} (${userId}). Historical attribution preserved.`,
  })

  return updated
}

// ── Warehouse Referential Integrity & Safe Archival ─────────────────────────

export function canDeleteWarehouse(warehouseId: string): {
  allowed: boolean
  reason?: string
  physicalStock: number
  reservedStock: number
} {
  const batches = deriveBatches(batchesStore.get(), stockMovementsStore.get(), undefined, warehouseId)
  const physicalStock = batches.reduce((sum, b) => sum + (b.qty_physical || 0), 0)
  const reservedStock = batches.reduce((sum, b) => sum + (b.qty_reserved || 0), 0)

  if (physicalStock > 0 || reservedStock > 0) {
    return {
      allowed: false,
      reason: `Warehouse ${warehouseId} holds positive stock (${physicalStock} physical units, ${reservedStock} reserved units). It cannot be deleted or archived until inventory is transferred or written off.`,
      physicalStock,
      reservedStock,
    }
  }

  return { allowed: true, physicalStock: 0, reservedStock: 0 }
}

export function safeArchiveWarehouse(warehouseId: string, actor: string = 'Admin'): Warehouse {
  const check = canDeleteWarehouse(warehouseId)
  if (!check.allowed) {
    throw new ReferentialIntegrityError(check.reason!)
  }

  const current = warehousesStore.get().find((w) => w.id === warehouseId)
  if (!current) {
    throw new EntityNotFoundError(`Warehouse not found: ${warehouseId}`)
  }

  const now = new Date().toISOString()
  const updated: Warehouse = {
    ...current,
    status: 'Inactive',
    updated_at: now,
  }

  warehousesStore.update((list) => list.map((w) => (w.id === warehouseId ? updated : w)))

  addAuditLog({
    action: 'Warehouse Archived',
    actor,
    time: 'Just now',
    details: `Safely archived warehouse ${current.name} (${warehouseId}).`,
  })

  return updated
}
