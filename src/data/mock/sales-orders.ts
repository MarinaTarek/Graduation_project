
import { createStore } from './store'
import { customersStore } from './customers'
import { productsStore } from './products'
import { usersStore } from './users'
import { addAuditLog } from './audit'
import { addInvoice, generateInvoiceName, invoicesStore } from './invoices'
import { getSystemNow } from '@/lib/dateUtils'
import {
  batchesStore,
  stockMovementsStore,
  addStockMovement,
  allocateFefo,
  reserveStock,
  releaseReservation,
  dispatchReservedStock,
} from './stockDerived'

export type SalesOrderStatus = 'Pending' | 'Approved' | 'Dispatched' | 'Rejected' | 'Cancelled'

export type SalesOrderDiscountType = 'percentage' | 'fixed'

export interface SalesOrderItem {
  productCode: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

export interface SalesOrder {
  id: string
  customerId: string
  customerName: string
  repId: string
  repName: string
  items: SalesOrderItem[]
  subtotal: number
  // Discount fields are optional so orders created before discounts existed
  // stay valid — treat a missing discount as zero (see discountAmountOf).
  discountType?: SalesOrderDiscountType
  // percentage: 0-100 · fixed: absolute EGP amount
  discountValue?: number
  // Resolved EGP amount actually deducted from the subtotal.
  discountAmount?: number
  total: number
  status: SalesOrderStatus
  createdAt: string
  updatedAt: string
  rejectionReason?: string
}

export function discountAmountOf(order: Pick<SalesOrder, 'subtotal' | 'discountType' | 'discountValue'>): number {
  if (!order.discountType || order.discountValue === undefined) return 0
  if (order.discountType === 'percentage') {
    return Math.round(order.subtotal * (Math.min(Math.max(order.discountValue, 0), 100) / 100) * 100) / 100
  }
  return Math.round(Math.min(Math.max(order.discountValue, 0), order.subtotal) * 100) / 100
}

export const salesOrdersStore = createStore<SalesOrder[]>(
  'sales_orders',
  [],
)

type CreateSalesOrderInput = {
  customerId: string
  repId: string
  repName: string
  items: {
    productCode: string
    quantity: number
  }[]
  discount?: {
    type: SalesOrderDiscountType
    value: number
  }
}

let orderCounter = 0
export function addSalesOrder(input: CreateSalesOrderInput) {
  const customer = customersStore.get().find(
    (item) => item.id === input.customerId,
  )

  if (!customer || customer.deleted_at || customer.active === false) {
    throw new Error('Customer is unavailable.')
  }

  if (!input.repId.trim() || !input.repName.trim()) {
    throw new Error('Select a sales representative.')
  }

  const rep = usersStore.get().find(
    (u) => u.id === input.repId || u.name.toLowerCase() === input.repName.toLowerCase()
  )
  if (rep && (rep.status === 'Inactive' || rep.status === 'Archived' || rep.status === 'inactive')) {
    throw new Error(`Representative ${rep.name} is inactive or archived.`)
  }

  if (!input.items.length) {
    throw new Error('Add at least one product.')
  }

  const items: SalesOrderItem[] = input.items.map((item) => {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('Product quantity must be a positive integer.')
    }

    const product = productsStore.get().find(
      (product) => product.code === item.productCode,
    )

    if (!product) {
      throw new Error(`Product ${item.productCode} was not found.`)
    }

    if (product.status === 'Inactive' || product.status === 'Archived') {
      throw new Error(`Product ${product.name} (${item.productCode}) is inactive or archived.`)
    }

    const unitPrice = Number(product.price)

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error(`Invalid price for ${product.name}.`)
    }

    return {
      productCode: product.code,
      productName: product.name,
      quantity: item.quantity,
      unitPrice,
      total: item.quantity * unitPrice,
    }
  })

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const now = getSystemNow().toISOString()

  // Optional discount: validated against the subtotal so an order can never
  // total below zero. Zero-value discounts are stored as "no discount".
  let discountType: SalesOrderDiscountType | undefined
  let discountValue: number | undefined
  let discountAmount = 0

  if (input.discount) {
    const { type, value } = input.discount
    if (type !== 'percentage' && type !== 'fixed') {
      throw new Error('Invalid discount type.')
    }
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Discount must be zero or positive.')
    }
    if (type === 'percentage' && value > 100) {
      throw new Error('Percentage discount must be between 0 and 100.')
    }
    if (type === 'fixed' && value > subtotal) {
      throw new Error('Fixed discount cannot exceed the order subtotal.')
    }
    if (value > 0) {
      discountType = type
      discountValue = value
      discountAmount =
        type === 'percentage'
          ? Math.round(subtotal * (value / 100) * 100) / 100
          : Math.round(value * 100) / 100
    }
  }

  const total = Math.round((subtotal - discountAmount) * 100) / 100

  const order: SalesOrder = {
    id: `SO-${Date.now()}-${(++orderCounter).toString().padStart(3, '0')}`,
    customerId: customer.id!,
    customerName: customer.name,
    repId: input.repId,
    repName: input.repName,
    items,
    subtotal,
    ...(discountType
      ? { discountType, discountValue, discountAmount }
      : {}),
    total,
    status: 'Pending',
    createdAt: now,
    updatedAt: now,
  }

  salesOrdersStore.update((orders) => [order, ...orders])

  addAuditLog({
    action: 'Sales Order Created',
    actor: input.repName,
    time: 'Just now',
    details: `Created ${order.id} for ${customer.name}. Total: ${order.total}`,
  })

  return order
}

export function approveSalesOrder(orderId: string, actor: string) {
  const order = salesOrdersStore.get().find((item) => item.id === orderId)

  if (!order) {
    throw new Error('Sales order was not found.')
  }

  // Prevent duplicate operations when an approval action is repeated
  if (order.status === 'Approved') {
    return orderId
  }

  if (order.status !== 'Pending') {
    throw new Error('Only pending orders can be approved.')
  }

  // Phase 2 Operational Flow:
  // Reserve stock using FEFO allocation across unexpired batches.
  // Physical stock deduction does NOT happen here; it happens on dispatch.
  // If unexpired stock is insufficient, reserveStock throws and approval aborts.
  reserveStock(
    orderId,
    order.items.map((it) => ({
      productCode: it.productCode,
      productName: it.productName,
      quantity: it.quantity,
    })),
  )

  // One invoice per order; created after stock reservation is secured.
  const existingInvoice = invoicesStore.get().find(
    (invoice) => invoice.order_id === orderId,
  )
  if (!existingInvoice) {
    const issueDate = getSystemNow().toISOString().slice(0, 10)
    const dueObj = new Date()
    dueObj.setDate(dueObj.getDate() + 30)
    const dueDate = dueObj.toISOString().slice(0, 10)

    addInvoice({
      customerId: order.customerId,
      customerName: order.customerName,
      originalAmount: order.total,
      currency: 'EGP',
      issueDate,
      dueDate,
      status: 'Pending',
      source: 'Sales order',
      dateRange: 'Today',
      repName: order.repName,
      repId: order.repId,
      order_id: orderId,
      discountAmount: order.discountAmount,
      items: order.items.map((it) => ({
        productCode: it.productCode,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
      })),
      notes: `Generated from approved sales order ${order.id}`,
    })
  }

  const updatedAt = getSystemNow().toISOString()

  salesOrdersStore.update((orders) =>
    orders.map((item) =>
      item.id === orderId
        ? { ...item, status: 'Approved', updatedAt }
        : item,
    ),
  )

  addAuditLog({
    action: 'Sales Order Approved',
    actor,
    time: 'Just now',
    details: `Approved ${orderId} for ${order.customerName}`,
  })

  return orderId
}

export function dispatchSalesOrder(orderId: string, actor: string) {
  const order = salesOrdersStore.get().find((item) => item.id === orderId)

  if (!order) {
    throw new Error('Sales order was not found.')
  }

  if (order.status === 'Dispatched') {
    return orderId
  }

  if (order.status !== 'Approved') {
    throw new Error('Only approved orders can be dispatched.')
  }

  // Fulfills reservations and records physical sell_in / dispatch movements
  dispatchReservedStock(orderId, actor, {
    customerId: order.customerId,
    customerName: order.customerName,
    repId: order.repId,
    repName: order.repName,
  })

  const updatedAt = getSystemNow().toISOString()

  salesOrdersStore.update((orders) =>
    orders.map((item) =>
      item.id === orderId
        ? { ...item, status: 'Dispatched', updatedAt }
        : item,
    ),
  )

  addAuditLog({
    action: 'Sales Order Dispatched',
    actor,
    time: 'Just now',
    details: `Dispatched ${orderId} for ${order.customerName}`,
  })

  return orderId
}

export function cancelSalesOrder(
  orderId: string,
  reason: string,
  actor: string,
) {
  const order = salesOrdersStore.get().find((item) => item.id === orderId)

  if (!order) {
    throw new Error('Sales order was not found.')
  }

  if (order.status === 'Cancelled') {
    return orderId
  }

  if (order.status !== 'Pending' && order.status !== 'Approved') {
    throw new Error('Only pending or approved orders can be cancelled.')
  }

  if (!reason.trim()) {
    throw new Error('A cancellation reason is required.')
  }

  // If order was approved, release active reservations and void/reject any linked invoice
  if (order.status === 'Approved') {
    releaseReservation(orderId, reason.trim())
    invoicesStore.update((invoices) =>
      invoices.map((inv) =>
        inv.order_id === orderId
          ? {
              ...inv,
              status: 'Rejected',
              notes: `${inv.notes ? inv.notes + ' | ' : ''}Order cancelled: ${reason.trim()}`,
            }
          : inv,
      ),
    )
  }

  const updatedAt = getSystemNow().toISOString()

  salesOrdersStore.update((orders) =>
    orders.map((item) =>
      item.id === orderId
        ? {
            ...item,
            status: 'Cancelled',
            rejectionReason: reason.trim(),
            updatedAt,
          }
        : item,
    ),
  )

  addAuditLog({
    action: 'Sales Order Cancelled',
    actor,
    time: 'Just now',
    details: `Cancelled ${orderId}: ${reason.trim()}`,
  })

  return orderId
}

export function rejectSalesOrder(
  orderId: string,
  reason: string,
  actor: string,
) {
  const order = salesOrdersStore.get().find((item) => item.id === orderId)

  if (!order) {
    throw new Error('Sales order was not found.')
  }

  if (order.status === 'Rejected') {
    return orderId
  }

  if (order.status !== 'Pending') {
    throw new Error('Only pending orders can be rejected.')
  }

  if (!reason.trim()) {
    throw new Error('A rejection reason is required.')
  }

  const updatedAt = getSystemNow().toISOString()

  salesOrdersStore.update((orders) =>
    orders.map((item) =>
      item.id === orderId
        ? {
            ...item,
            status: 'Rejected',
            rejectionReason: reason.trim(),
            updatedAt,
          }
        : item,
    ),
  )

  addAuditLog({
    action: 'Sales Order Rejected',
    actor,
    time: 'Just now',
    details: `Rejected ${orderId}: ${reason.trim()}`,
  })

  return orderId
}
