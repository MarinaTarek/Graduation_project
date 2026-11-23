import { createStore } from './store'
import { addAuditLog } from './audit'
import { addStockMovement } from './stockDerived'
import { salesOrdersStore } from './sales-orders'
import { productsStore } from './products'
import { getSystemNow } from '@/lib/dateUtils'

export interface CreditNoteRecord {
  id: string
  returnId: string
  orderId?: string
  customerId: string
  customerName: string
  productName: string
  batchNumber: string
  quantity: number
  amount: number
  currency: string
  status: 'Issued' | 'Applied' | 'Voided'
  createdAt: string
  updatedAt: string
}

export const creditNotesStore = createStore<CreditNoteRecord[]>('credit_notes_v1', [])

export interface ReturnRecord {
  id: string
  order_id?: string       // original sales order ref
  invoice_ref?: string    // invoice name ref
  customerId: string
  customerName: string
  repId: string
  repName: string
  productName: string
  batchNumber: string
  expiryDate?: string
  quantity: number
  returnDate: string      // YYYY-MM-DD
  reason: string
  condition: 'sellable' | 'damaged' | 'expired'
  status: 'Pending' | 'Approved' | 'Rejected'
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

const SEED_RETURNS: ReturnRecord[] = [
  {
    id: 'RTN-DEMO-001',
    customerId: 'c-2',
    customerName: 'Green Cross Pharmacy',
    repId: 'rep-maya',
    repName: 'Maya Patel',
    productName: 'Bevato',
    batchNumber: 'BV-2401',
    quantity: 120,
    returnDate: '2026-10-05',
    reason: 'Good condition packaging, customer overstock',
    condition: 'sellable',
    status: 'Approved',
    createdAt: '2026-10-05T08:00:00.000Z',
    updatedAt: '2026-10-05T09:00:00.000Z',
  },
  {
    id: 'RTN-DEMO-002',
    customerId: 'c-7',
    customerName: 'St. Jude Medical',
    repId: 'u-admin-1',
    repName: 'Alex Morgan',
    productName: 'Naviro D3 50,000 IU',
    batchNumber: 'NV-5001',
    quantity: 50,
    returnDate: '2026-10-18',
    reason: 'Damaged during transit — packaging compromised',
    condition: 'damaged',
    status: 'Pending',
    createdAt: '2026-10-18T10:00:00.000Z',
    updatedAt: '2026-10-18T10:00:00.000Z',
  },
  {
    id: 'RTN-DEMO-003',
    customerId: 'c-4',
    customerName: 'Wellness First',
    repId: 'rep-maya',
    repName: 'Maya Patel',
    productName: 'Naviro D3 Drops',
    batchNumber: 'ND-2401',
    quantity: 30,
    returnDate: '2026-10-22',
    reason: 'Batch expired at customer site',
    condition: 'expired',
    status: 'Rejected',
    rejectionReason: 'Expiry was known at time of sell-in; not eligible for return credit.',
    createdAt: '2026-10-22T11:00:00.000Z',
    updatedAt: '2026-10-22T12:00:00.000Z',
  },
]

export const returnsStore = createStore<ReturnRecord[]>('returns_v1', SEED_RETURNS)

const now = () => getSystemNow().toISOString()
let returnCounter = 0

export interface AddReturnInput {
  order_id?: string
  invoice_ref?: string
  customerId: string
  customerName: string
  repId: string
  repName: string
  productName: string
  batchNumber: string
  expiryDate?: string
  quantity: number
  returnDate: string
  reason: string
  condition: 'sellable' | 'damaged' | 'expired'
}

export function addReturn(input: AddReturnInput): ReturnRecord {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error('Quantity must be greater than zero.')
  }
  if (!input.productName.trim()) {
    throw new Error('Product name is required.')
  }
  if (!input.customerName.trim()) {
    throw new Error('Customer is required.')
  }

  if (input.order_id) {
    const order = salesOrdersStore.get().find((o) => o.id === input.order_id)
    if (!order) {
      throw new Error(`Original sales order ${input.order_id} not found.`)
    }
    const orderItem = order.items.find(
      (it) => it.productName.toLowerCase() === input.productName.toLowerCase(),
    )
    if (!orderItem) {
      throw new Error(
        `Product ${input.productName} was not found in sales order ${input.order_id}.`,
      )
    }
    const alreadyReturned = getReturnedQtyForOrder(input.order_id, input.productName)
    if (alreadyReturned + input.quantity > orderItem.quantity) {
      throw new Error(
        `Cannot return ${input.quantity} units. Already returned: ${alreadyReturned}, Ordered: ${orderItem.quantity}.`,
      )
    }
  }

  const at = now()
  const record: ReturnRecord = {
    id: `RTN-${Date.now()}-${(++returnCounter).toString().padStart(3, '0')}`,
    order_id: input.order_id || undefined,
    invoice_ref: input.invoice_ref || undefined,
    customerId: input.customerId,
    customerName: input.customerName,
    repId: input.repId,
    repName: input.repName,
    productName: input.productName,
    batchNumber: input.batchNumber,
    expiryDate: input.expiryDate || undefined,
    quantity: input.quantity,
    returnDate: input.returnDate,
    reason: input.reason,
    condition: input.condition,
    status: 'Pending',
    createdAt: at,
    updatedAt: at,
  }

  returnsStore.update((list) => [record, ...list])

  addAuditLog({
    action: 'Return Request Created',
    actor: input.repName,
    time: 'Just now',
    details: `Return request ${record.id}: ${input.quantity} units of ${input.productName} from ${input.customerName}`,
  })

  return record
}

export function approveReturn(
  id: string,
  actor: string,
  disposition?: 'sellable' | 'damaged' | 'expired',
): CreditNoteRecord {
  const record = returnsStore.get().find((r) => r.id === id)
  if (!record) throw new Error('Return record not found.')
  if (record.status !== 'Pending') throw new Error('Only pending returns can be approved.')

  const at = now()
  const condition = disposition || record.condition

  addStockMovement({
    productName: record.productName,
    batchNumber: record.batchNumber,
    quantity: record.quantity,
    type: 'return',
    return_condition: condition,
    date: record.returnDate,
    customer_id: record.customerId,
    customerName: record.customerName,
    rep_id: record.repId,
    repName: record.repName,
    reason: record.reason,
    notes: `Return ${record.id}`,
  })

  // Look up unit price from order item or product catalog for credit note
  let unitPrice = 0
  if (record.order_id) {
    const order = salesOrdersStore.get().find((o) => o.id === record.order_id)
    const item = order?.items.find(
      (it) => it.productName.toLowerCase() === record.productName.toLowerCase(),
    )
    if (item) unitPrice = item.unitPrice
  }
  if (!unitPrice) {
    const prod = productsStore
      .get()
      .find((p) => p.name.toLowerCase() === record.productName.toLowerCase())
    if (prod) unitPrice = Number(prod.price) || 0
  }

  const creditAmount = Math.round(record.quantity * unitPrice * 100) / 100

  const creditNote: CreditNoteRecord = {
    id: `CRN-${record.id}`,
    returnId: record.id,
    orderId: record.order_id,
    customerId: record.customerId,
    customerName: record.customerName,
    productName: record.productName,
    batchNumber: record.batchNumber,
    quantity: record.quantity,
    amount: creditAmount,
    currency: 'EGP',
    status: 'Issued',
    createdAt: at,
    updatedAt: at,
  }

  creditNotesStore.update((list) => [creditNote, ...list])

  returnsStore.update((list) =>
    list.map((r) =>
      r.id === id ? { ...r, condition, status: 'Approved', updatedAt: at } : r,
    ),
  )

  addAuditLog({
    action: 'Return Approved',
    actor,
    time: 'Just now',
    details: `Approved return ${id}: ${record.quantity} units of ${record.productName} (${condition}). Credit Note ${creditNote.id} issued for ${creditAmount} EGP`,
  })

  return creditNote
}

export function rejectReturn(id: string, reason: string, actor: string): void {
  const record = returnsStore.get().find((r) => r.id === id)
  if (!record) throw new Error('Return record not found.')
  if (record.status !== 'Pending') throw new Error('Only pending returns can be rejected.')
  if (!reason.trim()) throw new Error('A rejection reason is required.')

  const at = now()

  returnsStore.update((list) =>
    list.map((r) =>
      r.id === id ? { ...r, status: 'Rejected', rejectionReason: reason.trim(), updatedAt: at } : r,
    ),
  )

  addAuditLog({
    action: 'Return Rejected',
    actor,
    time: 'Just now',
    details: `Rejected return ${id}: ${reason.trim()}`,
  })
}

/** Sums approved + pending return quantities for a given order + product.
 *  Used to prevent over-returning against the original order quantity. */
export function getReturnedQtyForOrder(orderId: string, productName: string): number {
  return returnsStore
    .get()
    .filter(
      (r) =>
        r.order_id === orderId &&
        r.productName.toLowerCase() === productName.toLowerCase() &&
        (r.status === 'Approved' || r.status === 'Pending'),
    )
    .reduce((sum, r) => sum + r.quantity, 0)
}
