import { createStore, useStore } from './store'
import { addAuditLog } from './audit'

export type MovementType =
  | 'receipt'
  | 'sell_in'
  | 'sell_out'
  | 'sample'
  | 'return'
  | 'adjustment'
  | 'transfer_rep'
  | 'transfer_warehouse'
  | 'reservation'
  | 'reservation_release'
  | 'dispatch'

export interface StockMovement {
  id: string
  order_id?: string
  product_id?: string
  productName: string
  batch_id?: string
  batchNumber?: string
  quantity: number // positive for flow, signed for adjustment
  type: MovementType
  date: string // YYYY-MM-DD
  customer_id?: string
  customerName?: string
  rep_id?: string
  repName?: string
  warehouseId?: string
  warehouseName?: string
  targetWarehouseId?: string
  targetWarehouseName?: string
  referenceId?: string
  referenceType?: string
  reason?: string
  notes?: string
  return_condition?: 'sellable' | 'damaged' | 'expired'
  updated_at?: string
}

export interface BatchRecord {
  id: string
  batch_no: string
  product_id?: string
  productName: string
  expiry_date: string // YYYY-MM-DD
  initial_qty: number
  warehouseId?: string
  warehouseName?: string
  status?: 'Healthy' | 'Quarantine' | 'Damaged' | 'Expired'
  updated_at?: string
}

export interface StockReservation {
  id: string
  orderId: string
  productCode?: string
  productName: string
  batchId: string
  batchNumber: string
  warehouseId?: string
  quantity: number
  status: 'active' | 'fulfilled' | 'cancelled'
  createdAt: string
  updatedAt: string
}

// ── Seed Batches ─────────────────────────────────────────────────────────────
export const SEED_BATCHES: BatchRecord[] = [
  // Bevato (PRD-01)
  { id: 'b-bv-01', batch_no: 'BV-2401', product_id: 'PRD-01', productName: 'Bevato', expiry_date: '2026-11-06', initial_qty: 3000 },
  { id: 'b-bv-02', batch_no: 'BV-2402', product_id: 'PRD-01', productName: 'Bevato', expiry_date: '2027-02-28', initial_qty: 6000 },
  { id: 'b-bv-03', batch_no: 'BV-2403', product_id: 'PRD-01', productName: 'Bevato', expiry_date: '2027-06-30', initial_qty: 8000 },

  // Naviro D3 50,000 IU (PRD-02)
  { id: 'b-nv50-01', batch_no: 'NV-5001', product_id: 'PRD-02', productName: 'Naviro D3 50,000 IU', expiry_date: '2027-01-18', initial_qty: 5000 },
  { id: 'b-nv50-02', batch_no: 'NV-5002', product_id: 'PRD-02', productName: 'Naviro D3 50,000 IU', expiry_date: '2027-08-20', initial_qty: 7000 },

  // Naviro D3 10,000 IU (PRD-03)
  { id: 'b-nv10-01', batch_no: 'NV-1001', product_id: 'PRD-03', productName: 'Naviro D3 10,000 IU', expiry_date: '2027-05-15', initial_qty: 6000 },
  { id: 'b-nv10-02', batch_no: 'NV-1002', product_id: 'PRD-03', productName: 'Naviro D3 10,000 IU', expiry_date: '2027-10-15', initial_qty: 5000 },

  // Naviro D3 Drops (PRD-04)
  { id: 'b-nd-01', batch_no: 'ND-2401', product_id: 'PRD-04', productName: 'Naviro D3 Drops', expiry_date: '2026-10-10', initial_qty: 1500 }, // Expired
  { id: 'b-nd-02', batch_no: 'ND-2402', product_id: 'PRD-04', productName: 'Naviro D3 Drops', expiry_date: '2027-04-12', initial_qty: 8000 },

  // Navigen Product 5 (PRD-05)
  { id: 'b-np5-01', batch_no: 'NP-2401', product_id: 'PRD-05', productName: 'Navigen Product 5', expiry_date: '2027-09-30', initial_qty: 8000 },
]

// ── Seed Movements ───────────────────────────────────────────────────────────
export const SEED_MOVEMENTS: StockMovement[] = [
  // 1. Receipts into warehouse
  { id: 'sm-rec-01', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2401', quantity: 3000, type: 'receipt', date: '2026-08-01' },
  { id: 'sm-rec-02', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2402', quantity: 6000, type: 'receipt', date: '2026-08-15' },
  { id: 'sm-rec-03', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2403', quantity: 8000, type: 'receipt', date: '2026-09-01' },
  { id: 'sm-rec-04', product_id: 'PRD-02', productName: 'Naviro D3 50,000 IU', batchNumber: 'NV-5001', quantity: 5000, type: 'receipt', date: '2026-08-05' },
  { id: 'sm-rec-05', product_id: 'PRD-02', productName: 'Naviro D3 50,000 IU', batchNumber: 'NV-5002', quantity: 7000, type: 'receipt', date: '2026-09-10' },
  { id: 'sm-rec-06', product_id: 'PRD-03', productName: 'Naviro D3 10,000 IU', batchNumber: 'NV-1001', quantity: 6000, type: 'receipt', date: '2026-08-20' },
  { id: 'sm-rec-07', product_id: 'PRD-03', productName: 'Naviro D3 10,000 IU', batchNumber: 'NV-1002', quantity: 5000, type: 'receipt', date: '2026-09-25' },
  { id: 'sm-rec-08', product_id: 'PRD-04', productName: 'Naviro D3 Drops', batchNumber: 'ND-2401', quantity: 1500, type: 'receipt', date: '2026-06-01' },
  { id: 'sm-rec-09', product_id: 'PRD-04', productName: 'Naviro D3 Drops', batchNumber: 'ND-2402', quantity: 8000, type: 'receipt', date: '2026-09-01' },
  { id: 'sm-rec-10', product_id: 'PRD-05', productName: 'Navigen Product 5', batchNumber: 'NP-2401', quantity: 8000, type: 'receipt', date: '2026-09-05' },

  // 2. Sell-in (Warehouse to customers / pharmacies)
  { id: 'sm-si-01', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2401', quantity: 1920, type: 'sell_in', date: '2026-09-10', customer_id: 'c-2', customerName: 'Green Cross Pharmacy', rep_id: 'u-rep-maya', repName: 'Maya Patel' },
  { id: 'sm-si-02', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2402', quantity: 4800, type: 'sell_in', date: '2026-09-15', customer_id: 'c-7', customerName: 'St. Jude Medical', rep_id: 'u-admin-1', repName: 'Alex Morgan' },
  { id: 'sm-si-03', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2402', quantity: 3120, type: 'sell_in', date: '2026-09-20', customer_id: 'c-4', customerName: 'Wellness First', rep_id: 'u-rep-maya', repName: 'Maya Patel' },
  { id: 'sm-si-04', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2403', quantity: 3000, type: 'sell_in', date: '2026-10-02', customer_id: 'c-2', customerName: 'Green Cross Pharmacy', rep_id: 'u-rep-maya', repName: 'Maya Patel' },
  
  { id: 'sm-si-05', product_id: 'PRD-02', productName: 'Naviro D3 50,000 IU', batchNumber: 'NV-5001', quantity: 4620, type: 'sell_in', date: '2026-09-12', customer_id: 'c-2', customerName: 'Green Cross Pharmacy', rep_id: 'u-rep-maya', repName: 'Maya Patel' },
  { id: 'sm-si-06', product_id: 'PRD-02', productName: 'Naviro D3 50,000 IU', batchNumber: 'NV-5002', quantity: 4000, type: 'sell_in', date: '2026-09-28', customer_id: 'c-4', customerName: 'Wellness First', rep_id: 'u-rep-maya', repName: 'Maya Patel' },
  
  { id: 'sm-si-07', product_id: 'PRD-03', productName: 'Naviro D3 10,000 IU', batchNumber: 'NV-1001', quantity: 4290, type: 'sell_in', date: '2026-09-14', customer_id: 'c-7', customerName: 'St. Jude Medical', rep_id: 'u-admin-1', repName: 'Alex Morgan' },
  { id: 'sm-si-08', product_id: 'PRD-03', productName: 'Naviro D3 10,000 IU', batchNumber: 'NV-1002', quantity: 3000, type: 'sell_in', date: '2026-10-05', customer_id: 'c-2', customerName: 'Green Cross Pharmacy', rep_id: 'u-rep-maya', repName: 'Maya Patel' },

  { id: 'sm-si-09', product_id: 'PRD-04', productName: 'Naviro D3 Drops', batchNumber: 'ND-2401', quantity: 1080, type: 'sell_in', date: '2026-08-10', customer_id: 'c-4', customerName: 'Wellness First', rep_id: 'u-rep-maya', repName: 'Maya Patel' },
  { id: 'sm-si-10', product_id: 'PRD-04', productName: 'Naviro D3 Drops', batchNumber: 'ND-2402', quantity: 4330, type: 'sell_in', date: '2026-09-22', customer_id: 'c-2', customerName: 'Green Cross Pharmacy', rep_id: 'u-rep-maya', repName: 'Maya Patel' },

  { id: 'sm-si-11', product_id: 'PRD-05', productName: 'Navigen Product 5', batchNumber: 'NP-2401', quantity: 4110, type: 'sell_in', date: '2026-09-18', customer_id: 'c-4', customerName: 'Wellness First', rep_id: 'u-rep-maya', repName: 'Maya Patel' },

  // 3. Sell-out (Pharmacies to patients)
  { id: 'sm-so-01', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2401', quantity: 1650, type: 'sell_out', date: '2026-09-25', customer_id: 'c-2', customerName: 'Green Cross Pharmacy' },
  { id: 'sm-so-02', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2402', quantity: 4120, type: 'sell_out', date: '2026-10-01', customer_id: 'c-7', customerName: 'St. Jude Medical' },
  { id: 'sm-so-03', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2402', quantity: 2680, type: 'sell_out', date: '2026-10-10', customer_id: 'c-4', customerName: 'Wellness First' },
  { id: 'sm-so-04', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2403', quantity: 2730, type: 'sell_out', date: '2026-10-18', customer_id: 'c-2', customerName: 'Green Cross Pharmacy' },

  { id: 'sm-so-05', product_id: 'PRD-02', productName: 'Naviro D3 50,000 IU', batchNumber: 'NV-5001', quantity: 3326, type: 'sell_out', date: '2026-09-25', customer_id: 'c-2', customerName: 'Green Cross Pharmacy' },
  { id: 'sm-so-06', product_id: 'PRD-02', productName: 'Naviro D3 50,000 IU', batchNumber: 'NV-5002', quantity: 2880, type: 'sell_out', date: '2026-10-12', customer_id: 'c-4', customerName: 'Wellness First' },

  { id: 'sm-so-07', product_id: 'PRD-03', productName: 'Naviro D3 10,000 IU', batchNumber: 'NV-1001', quantity: 2745, type: 'sell_out', date: '2026-09-30', customer_id: 'c-7', customerName: 'St. Jude Medical' },
  { id: 'sm-so-08', product_id: 'PRD-03', productName: 'Naviro D3 10,000 IU', batchNumber: 'NV-1002', quantity: 1920, type: 'sell_out', date: '2026-10-14', customer_id: 'c-2', customerName: 'Green Cross Pharmacy' },

  { id: 'sm-so-09', product_id: 'PRD-04', productName: 'Naviro D3 Drops', batchNumber: 'ND-2401', quantity: 518, type: 'sell_out', date: '2026-09-15', customer_id: 'c-4', customerName: 'Wellness First' },
  { id: 'sm-so-10', product_id: 'PRD-04', productName: 'Naviro D3 Drops', batchNumber: 'ND-2402', quantity: 2078, type: 'sell_out', date: '2026-10-15', customer_id: 'c-2', customerName: 'Green Cross Pharmacy' },

  { id: 'sm-so-11', product_id: 'PRD-05', productName: 'Navigen Product 5', batchNumber: 'NP-2401', quantity: 1602, type: 'sell_out', date: '2026-10-12', customer_id: 'c-4', customerName: 'Wellness First' },

  // 4. Transfers to Reps
  { id: 'sm-tr-01', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2403', quantity: 620, type: 'transfer_rep', date: '2026-10-01', rep_id: 'u-admin-1', repName: 'Alex Morgan' },
  { id: 'sm-tr-02', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2403', quantity: 450, type: 'transfer_rep', date: '2026-10-02', rep_id: 'u-rep-olivia', repName: 'Olivia Martin' },
  { id: 'sm-tr-03', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2402', quantity: 380, type: 'transfer_rep', date: '2026-10-03', rep_id: 'u-rep-maya', repName: 'Maya Patel' },
  { id: 'sm-tr-04', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2403', quantity: 210, type: 'transfer_rep', date: '2026-10-04', rep_id: 'u-rep-james', repName: 'James Wilson' },

  // 5. Samples given by reps during visits
  { id: 'sm-smp-01', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2401', quantity: 35, type: 'sample', date: '2026-10-18', customer_id: 'c-1', customerName: 'Dr. Sarah Kim', rep_id: 'u-admin-1', repName: 'Alex Morgan' },
  { id: 'sm-smp-02', product_id: 'PRD-01', productName: 'Bevato', batchNumber: 'BV-2402', quantity: 20, type: 'sample', date: '2026-10-21', customer_id: 'c-7', customerName: 'St. Jude Medical Clinic', rep_id: 'u-admin-1', repName: 'Alex Morgan' },
  { id: 'sm-smp-03', product_id: 'PRD-02', productName: 'Naviro D3 50,000 IU', batchNumber: 'NV-5001', quantity: 15, type: 'sample', date: '2026-10-22', customer_id: 'c-5', customerName: 'Dr. Emily Watson', rep_id: 'u-admin-1', repName: 'Alex Morgan' },
]

// ── Stores ───────────────────────────────────────────────────────────────────
export const batchesStore = createStore<BatchRecord[]>('batches_v2', SEED_BATCHES)
export const stockMovementsStore = createStore<StockMovement[]>('stock_movements_v2', SEED_MOVEMENTS)
export const stockReservationsStore = createStore<StockReservation[]>('stock_reservations_v2', [])

const now = () => new Date().toISOString()

export function addBatch(data: Omit<BatchRecord, 'id' | 'updated_at'> & { id?: string }) {
  const batch: BatchRecord = {
    ...data,
    id: data.id ?? `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    updated_at: now(),
  }
  batchesStore.update((list) => [batch, ...list])
  return batch
}

export function getReturnCondition(
  movement: StockMovement,
  batchExpiryDate?: string,
): 'sellable' | 'damaged' | 'expired' {
  if (movement.return_condition) {
    return movement.return_condition
  }
  const reasonLower = `${movement.reason || ''} ${movement.notes || ''}`.toLowerCase()
  if (
    reasonLower.includes('damage') ||
    reasonLower.includes('defect') ||
    reasonLower.includes('broken') ||
    reasonLower.includes('tore') ||
    reasonLower.includes('compromised')
  ) {
    return 'damaged'
  }
  if (reasonLower.includes('expired')) {
    return 'expired'
  }
  if (batchExpiryDate && computeDaysToExpiry(batchExpiryDate) <= 0) {
    return 'expired'
  }
  return 'sellable'
}

export function addStockMovement(data: Omit<StockMovement, 'id' | 'updated_at' | 'date'> & { id?: string; date?: string }) {
  if (!Number.isFinite(data.quantity)) {
    throw new Error('Stock movement quantity must be a valid number.')
  }
  if (data.type !== 'adjustment' && (!Number.isInteger(data.quantity) || data.quantity <= 0)) {
    throw new Error('Stock movement quantity must be a positive integer.')
  }
  if (data.type === 'adjustment' && (!Number.isInteger(data.quantity) || data.quantity === 0)) {
    throw new Error('Stock adjustment quantity must be a non-zero integer.')
  }

  // Phase 2 - 3.3: Pre-transaction validation to prevent new negative stock transactions.
  // Outbound operations (dispatch, sell_in, transfer_rep, sample without return)
  // must verify available physical stock before committing.
  const isOutbound =
    data.type === 'dispatch' ||
    data.type === 'sell_in' ||
    (data.type === 'transfer_rep' && data.referenceType !== 'return') ||
    (data.type === 'sample' && !data.repName && !data.rep_id)

  if (isOutbound || (data.type === 'adjustment' && data.quantity < 0)) {
    const deductQty = data.type === 'adjustment' ? Math.abs(data.quantity) : data.quantity
    const currentBatches = batchesStore.get()
    const currentMovements = stockMovementsStore.get()

    // Match batch
    const targetBatch = currentBatches.find(
      (b) =>
        (data.batch_id && b.id === data.batch_id) ||
        (data.batchNumber && b.batch_no === data.batchNumber)
    )

    if (targetBatch) {
      const derived = deriveBatches([targetBatch], currentMovements, undefined, data.warehouseId)[0]
      if (derived && derived.qty_physical < deductQty) {
        throw new Error(
          `Insufficient physical stock in batch ${targetBatch.batch_no}. Available physical: ${derived.qty_physical}, Requested deduction: ${deductQty}. Transaction aborted to prevent negative stock.`
        )
      }
    }
  }

  const at = now()
  const movement: StockMovement = {
    ...data,
    id: data.id ?? `SM-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: data.date ?? at.split('T')[0],
    updated_at: at,
  }
  stockMovementsStore.update((list) => [movement, ...list])
  return movement
}

// ── Expiry calculations ──────────────────────────────────────────────────────
export type BatchExpiryStatus = 'expired' | 'critical' | 'warning' | 'healthy'

export function computeDaysToExpiry(expiryDateStr: string): number {
  if (!expiryDateStr) return 0
  const parts = expiryDateStr.split('-').map(Number)
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const target = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0).getTime()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Math.round((target - today.getTime()) / (1000 * 60 * 60 * 24))
  }
  const target = new Date(expiryDateStr).getTime()
  const today = new Date().setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

export function getBatchStatus(days: number): {
  status: BatchExpiryStatus
  label: string
  color: 'grey' | 'rose' | 'amber' | 'green'
} {
  if (days <= 0) {
    return { status: 'expired', label: 'Expired', color: 'grey' }
  }
  if (days <= 90) {
    return { status: 'critical', label: `< 3 months (${days}d)`, color: 'rose' }
  }
  if (days <= 180) {
    const mo = Math.ceil(days / 30)
    return { status: 'warning', label: `3-6 months (${mo}mo)`, color: 'amber' }
  }
  const mo = Math.ceil(days / 30)
  return { status: 'healthy', label: `> 6 months (${mo}mo)`, color: 'green' }
}

// ── Derived Batch ────────────────────────────────────────────────────────────
export interface DerivedBatch {
  id: string
  batch_no: string
  productName: string
  expiry_date: string
  initial_qty: number
  qty_physical: number // Real physical balance in warehouse, never masked or clamped to 0
  qty_reserved: number // Sum of active reservations
  qty_available: number // unreserved unexpired physical stock
  qty_remaining: number // alias to qty_available for backward compatibility with UI
  days_to_expiry: number
  status: BatchExpiryStatus
  status_label: string
  status_color: 'grey' | 'rose' | 'amber' | 'green'
  is_fefo_first: boolean
  is_expired: boolean
  warehouseId?: string
  warehouseName?: string
  has_inconsistent_quantity?: boolean
  inconsistency_reason?: string
}

export function deriveBatches(
  batches: BatchRecord[],
  movements: StockMovement[],
  productNameFilter?: string,
  warehouseIdFilter?: string,
  reservations: StockReservation[] = stockReservationsStore.get(),
): DerivedBatch[] {
  let filteredBatches = productNameFilter
    ? batches.filter(
        (b) =>
          b.productName.toLowerCase() === productNameFilter.toLowerCase() ||
          (b.product_id && b.product_id.toLowerCase() === productNameFilter.toLowerCase())
      )
    : batches

  if (warehouseIdFilter) {
    filteredBatches = filteredBatches.filter((b) => {
      if (b.warehouseId === warehouseIdFilter) return true
      if (!b.warehouseId) return true
      return movements.some(
        (m) =>
          (m.batchNumber === b.batch_no || m.batch_id === b.id) &&
          (m.warehouseId === warehouseIdFilter || m.targetWarehouseId === warehouseIdFilter),
      )
    })
  }

  const activeReservations = reservations.filter((r) => r.status === 'active')

  const results: DerivedBatch[] = filteredBatches.map((b) => {
    // Receipts for this batch
    const batchMovements = movements.filter(
      (m) => m.batchNumber === b.batch_no || m.batch_id === b.id,
    )

    // Apply warehouse filter to movements if warehouseIdFilter is set
    const relevantMovements = warehouseIdFilter
      ? batchMovements.filter((m) => {
          if (m.type === 'transfer_warehouse') {
            return m.warehouseId === warehouseIdFilter
          }
          return !m.warehouseId || m.warehouseId === warehouseIdFilter
        })
      : batchMovements

    const receipts = relevantMovements
      .filter((m) => m.type === 'receipt')
      .reduce((sum, m) => sum + m.quantity, 0)

    const initial =
      receipts > 0
        ? receipts
        : warehouseIdFilter
          ? b.warehouseId === warehouseIdFilter
            ? b.initial_qty
            : 0
          : b.initial_qty

    // Outbound physical deductions:
    // sell_in, dispatch, direct warehouse samples (without rep), transfer_rep
    const outboundDispatches = relevantMovements
      .filter(
        (m) =>
          (m.type === 'sell_in' ||
            m.type === 'dispatch' ||
            (m.type === 'sample' && !m.repName && !m.rep_id) ||
            (m.type === 'transfer_rep' && m.referenceType !== 'return')),
      )
      .reduce((sum, m) => sum + m.quantity, 0)

    // Rep sample returns to warehouse
    const repSampleReturnsToWarehouse = relevantMovements
      .filter((m) => m.type === 'transfer_rep' && m.referenceType === 'return')
      .reduce((sum, m) => sum + m.quantity, 0)

    // Adjustments for this batch (signed integer)
    const adjustments = relevantMovements
      .filter((m) => m.type === 'adjustment')
      .reduce((sum, m) => sum + m.quantity, 0)

    // Sellable returns: damaged and expired returned products do not return to sellable inventory
    const sellableReturns = relevantMovements
      .filter(
        (m) =>
          m.type === 'return' &&
          getReturnCondition(m, b.expiry_date) === 'sellable',
      )
      .reduce((sum, m) => sum + m.quantity, 0)

    // Linked warehouse transfers:
    let transferWarehouseDelta = 0
    if (warehouseIdFilter) {
      for (const m of relevantMovements) {
        if (m.type === 'transfer_warehouse') {
          if (m.referenceType === 'inbound') {
            transferWarehouseDelta += m.quantity
          } else if (m.referenceType === 'outbound') {
            transferWarehouseDelta -= m.quantity
          }
        }
      }
    }

    // Physical balance without fake clamping
    const rawPhysical =
      initial -
      outboundDispatches +
      repSampleReturnsToWarehouse +
      adjustments +
      sellableReturns +
      transferWarehouseDelta

    let has_inconsistent_quantity = false
    let inconsistency_reason: string | undefined

    if (rawPhysical < 0) {
      has_inconsistent_quantity = true
      inconsistency_reason = `Physical quantity is negative (${rawPhysical})`
    }

    // Active reservations for this batch
    const batchReservations = activeReservations.filter((r) => {
      const matchBatch = r.batchNumber === b.batch_no || r.batchId === b.id
      if (!matchBatch) return false
      if (warehouseIdFilter) {
        return !r.warehouseId || r.warehouseId === warehouseIdFilter
      }
      return true
    })

    const reservedQty = batchReservations.reduce((sum, r) => sum + r.quantity, 0)

    if (reservedQty > rawPhysical && rawPhysical >= 0) {
      has_inconsistent_quantity = true
      inconsistency_reason = `Reserved quantity (${reservedQty}) exceeds physical quantity (${rawPhysical})`
    }

    const availableQty = Math.max(0, rawPhysical - reservedQty)
    const days = computeDaysToExpiry(b.expiry_date)
    const statusInfo = getBatchStatus(days)

    return {
      id: b.id,
      batch_no: b.batch_no,
      productName: b.productName,
      expiry_date: b.expiry_date,
      initial_qty: initial,
      qty_physical: rawPhysical,
      qty_reserved: reservedQty,
      qty_available: availableQty,
      qty_remaining: availableQty,
      days_to_expiry: days,
      status: statusInfo.status,
      status_label: statusInfo.label,
      status_color: statusInfo.color,
      is_fefo_first: false,
      is_expired: days <= 0,
      warehouseId: b.warehouseId,
      warehouseName: b.warehouseName,
      has_inconsistent_quantity,
      inconsistency_reason,
    }
  })

  // Sort by earliest expiry (FEFO)
  results.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())

  // Mark "Sell this batch first" on earliest non-expired batch with available > 0
  const firstEligible = results.find((b) => !b.is_expired && b.qty_available > 0)
  if (firstEligible) {
    firstEligible.is_fefo_first = true
  }

  return results
}

// ── FEFO Allocation (shared by order approval & warehouse fulfillment) ─────────
export interface FefoAllocation {
  productName: string
  batchId: string
  batchNumber: string
  quantity: number
  warehouseId?: string
}

// Greedily allocates `quantity` of a product across its non-expired batches,
// earliest expiry first. Throws when the quantity cannot be covered, so
// callers never persist movements for an unallocatable amount.
export function allocateFefo(
  productName: string,
  quantity: number,
  batches: BatchRecord[],
  movements: StockMovement[],
  reservations: StockReservation[] = stockReservationsStore.get(),
  warehouseId?: string,
): FefoAllocation[] {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error(`Invalid quantity for ${productName}.`)
  }

  const allocations: FefoAllocation[] = []
  let needed = quantity

  const availableBatches = deriveBatches(batches, movements, productName, warehouseId, reservations)
    .filter((b) => !b.is_expired && b.qty_available > 0)

  for (const batch of availableBatches) {
    const take = Math.min(needed, batch.qty_available)
    if (take <= 0) continue

    allocations.push({
      productName,
      batchId: batch.id,
      batchNumber: batch.batch_no,
      quantity: take,
      warehouseId: batch.warehouseId,
    })

    needed -= take
    if (needed === 0) break
  }

  if (needed > 0) {
    throw new Error(`Insufficient unexpired stock for ${productName}.`)
  }

  return allocations
}

// ── Rep Sample Custody & Allocation ──────────────────────────────────────────
export interface RepSampleBatch {
  productName: string
  batchId: string
  batchNumber: string
  expiryDate: string
  isExpired: boolean
  remainingQty: number
}

export function getRepSampleBatches(
  repName: string,
  productName: string,
  batches: BatchRecord[],
  movements: StockMovement[]
): RepSampleBatch[] {
  const normRep = repName.trim().toLowerCase()
  const normProd = productName.trim().toLowerCase()

  const repTransfers = movements.filter(
    (m) =>
      m.type === 'transfer_rep' &&
      m.repName?.trim().toLowerCase() === normRep &&
      m.productName.trim().toLowerCase() === normProd
  )

  const repSamples = movements.filter(
    (m) =>
      m.type === 'sample' &&
      m.repName?.trim().toLowerCase() === normRep &&
      m.productName.trim().toLowerCase() === normProd
  )

  const transferredByBatch = new Map<string, number>()
  for (const t of repTransfers) {
    const key = t.batchNumber || t.batch_id || 'UNKNOWN'
    if (t.referenceType === 'return') {
      transferredByBatch.set(key, (transferredByBatch.get(key) ?? 0) - t.quantity)
    } else {
      transferredByBatch.set(key, (transferredByBatch.get(key) ?? 0) + t.quantity)
    }
  }

  const sampledByBatch = new Map<string, number>()
  for (const s of repSamples) {
    const key = s.batchNumber || s.batch_id || 'UNKNOWN'
    sampledByBatch.set(key, (sampledByBatch.get(key) ?? 0) + s.quantity)
  }

  const list: RepSampleBatch[] = []
  for (const [batchNo, transferred] of transferredByBatch.entries()) {
    const sampled = sampledByBatch.get(batchNo) ?? 0
    const remaining = Math.max(0, transferred - sampled)
    if (remaining <= 0) continue

    const batchRecord = batches.find(
      (b) => b.batch_no === batchNo && b.productName.trim().toLowerCase() === normProd
    )
    const expiryDate = batchRecord?.expiry_date || '2099-12-31'
    const days = computeDaysToExpiry(expiryDate)

    list.push({
      productName,
      batchId: batchRecord?.id || batchNo,
      batchNumber: batchNo,
      expiryDate,
      isExpired: days <= 0,
      remainingQty: remaining,
    })
  }

  list.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
  return list
}

export function getRepAvailableSampleStock(
  repName: string,
  productName: string,
  batches: BatchRecord[],
  movements: StockMovement[]
): number {
  const sampleBatches = getRepSampleBatches(repName, productName, batches, movements)
  return sampleBatches
    .filter((b) => !b.isExpired)
    .reduce((sum, b) => sum + b.remainingQty, 0)
}

export function allocateRepSampleFefo(
  repName: string,
  productName: string,
  quantity: number,
  batches: BatchRecord[],
  movements: StockMovement[]
): FefoAllocation[] {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error(`Invalid sample quantity for ${productName}.`)
  }

  const sampleBatches = getRepSampleBatches(repName, productName, batches, movements)
    .filter((b) => !b.isExpired && b.remainingQty > 0)

  const allocations: FefoAllocation[] = []
  let needed = quantity

  for (const b of sampleBatches) {
    const take = Math.min(needed, b.remainingQty)
    if (take <= 0) continue

    allocations.push({
      productName,
      batchId: b.batchId,
      batchNumber: b.batchNumber,
      quantity: take,
    })

    needed -= take
    if (needed === 0) break
  }

  if (needed > 0) {
    throw new Error(`Insufficient sample stock for representative ${repName} (${productName}).`)
  }

  return allocations
}

// ── Derived Product Metrics ──────────────────────────────────────────────────
export interface DerivedProductStock {
  name: string
  received: number
  sell_in: number
  sell_out: number
  in_warehouse: number // physical warehouse stock
  reserved_qty: number // active reserved stock
  in_market: number // sell_in - sell_out - returns
  samples: number
  returns: number
  sellable_returns: number
  damaged_returns: number
  expired_returns: number
  adjustments: number
  transfers_rep: number
  sell_through_pct: number
  available_qty: number // warehouse unexpired available qty (physical - reserved)
  expired_qty: number // expired qty in warehouse
  expiring_90d_qty: number // qty expiring within 90 days
  nearest_expiry_date: string | null
  batches: DerivedBatch[]
}

export function deriveProductStock(
  productName: string,
  movements: StockMovement[],
  batches: BatchRecord[],
  role: 'admin' | 'rep' = 'admin',
  currentUserName: string = 'Alex Morgan',
  warehouseIdFilter?: string,
  reservations: StockReservation[] = stockReservationsStore.get(),
): DerivedProductStock {
  const pMovements = movements.filter(
    (m) =>
      m.productName.toLowerCase() === productName.toLowerCase() ||
      (m.product_id && m.product_id.toLowerCase() === productName.toLowerCase()),
  )

  const relevantMovements = warehouseIdFilter
    ? pMovements.filter((m) => {
        if (m.type === 'transfer_warehouse') {
          return m.warehouseId === warehouseIdFilter
        }
        return !m.warehouseId || m.warehouseId === warehouseIdFilter
      })
    : pMovements

  const received = relevantMovements
    .filter((m) => m.type === 'receipt')
    .reduce((sum, m) => sum + m.quantity, 0)

  // Sell-in (warehouse to customer)
  const sell_in = relevantMovements
    .filter((m) => m.type === 'sell_in' || m.type === 'dispatch')
    .reduce((sum, m) => sum + m.quantity, 0)

  // Sell-out (customer to patient)
  const sell_out = relevantMovements
    .filter((m) => m.type === 'sell_out')
    .reduce((sum, m) => sum + m.quantity, 0)

  // All samples (rep and direct)
  const samples = relevantMovements
    .filter((m) => m.type === 'sample')
    .reduce((sum, m) => sum + m.quantity, 0)

  // Total returns
  const returns = relevantMovements
    .filter((m) => m.type === 'return')
    .reduce((sum, m) => sum + m.quantity, 0)

  // Sellable returns (returned in good condition, unexpired)
  const sellable_returns = relevantMovements
    .filter((m) => m.type === 'return' && getReturnCondition(m) === 'sellable')
    .reduce((sum, m) => sum + m.quantity, 0)

  // Damaged returned products
  const damaged_returns = relevantMovements
    .filter((m) => m.type === 'return' && getReturnCondition(m) === 'damaged')
    .reduce((sum, m) => sum + m.quantity, 0)

  // Expired returned products
  const expired_returns = relevantMovements
    .filter((m) => m.type === 'return' && getReturnCondition(m) === 'expired')
    .reduce((sum, m) => sum + m.quantity, 0)

  const adjustments = relevantMovements
    .filter((m) => m.type === 'adjustment')
    .reduce((sum, m) => sum + m.quantity, 0)

  const transfers_rep = relevantMovements
    .filter((m) => m.type === 'transfer_rep')
    .reduce((sum, m) => sum + m.quantity, 0)

  // Derived batches for this product
  const derivedB = deriveBatches(batches, movements, productName, warehouseIdFilter, reservations)

  // Physical stock in warehouse: sum of physical balances across batches
  const in_warehouse = derivedB.reduce((sum, b) => sum + b.qty_physical, 0)

  // Reserved stock across batches
  const reserved_qty = derivedB.reduce((sum, b) => sum + b.qty_reserved, 0)

  // In market: sell_in minus sell_out minus returns
  const in_market = Math.max(0, sell_in - sell_out - returns)

  // Sell-through %: ratio of products dispensed to patients over sell-in
  const sell_through_pct = sell_in > 0 ? Math.round((sell_out / sell_in) * 100) : 0

  // Available stock: unexpired available quantity
  const available_qty = derivedB
    .filter((b) => !b.is_expired)
    .reduce((sum, b) => sum + b.qty_available, 0)

  const expired_qty = derivedB
    .filter((b) => b.is_expired)
    .reduce((sum, b) => sum + b.qty_physical, 0)

  const expiring_90d_qty = derivedB
    .filter((b) => !b.is_expired && b.days_to_expiry <= 90)
    .reduce((sum, b) => sum + b.qty_available, 0)

  const firstValidBatch = derivedB.find((b) => !b.is_expired && b.qty_available > 0)
  const nearest_expiry_date = firstValidBatch ? firstValidBatch.expiry_date : null

  // If role === 'rep', custody is transfers_rep minus samples given by this rep
  if (role === 'rep') {
    const repAvailableSamples = getRepAvailableSampleStock(
      currentUserName,
      productName,
      batches,
      movements,
    )

    const repTransfers = pMovements
      .filter(
        (m) =>
          m.type === 'transfer_rep' &&
          m.referenceType !== 'return' &&
          m.repName?.toLowerCase() === currentUserName.toLowerCase(),
      )
      .reduce((sum, m) => sum + m.quantity, 0)

    const repSampleReturns = pMovements
      .filter(
        (m) =>
          m.type === 'transfer_rep' &&
          m.referenceType === 'return' &&
          m.repName?.toLowerCase() === currentUserName.toLowerCase(),
      )
      .reduce((sum, m) => sum + m.quantity, 0)

    const repSamples = pMovements
      .filter(
        (m) =>
          m.type === 'sample' &&
          m.repName?.toLowerCase() === currentUserName.toLowerCase(),
      )
      .reduce((sum, m) => sum + m.quantity, 0)

    const repCustody = Math.max(0, repTransfers - repSampleReturns - repSamples)

    return {
      name: productName,
      received: repTransfers,
      sell_in,
      sell_out,
      in_warehouse: repCustody,
      reserved_qty: 0,
      in_market,
      samples: repSamples,
      returns: 0,
      sellable_returns: 0,
      damaged_returns: 0,
      expired_returns: 0,
      adjustments: 0,
      transfers_rep: repTransfers,
      sell_through_pct,
      available_qty: repAvailableSamples,
      expired_qty: 0,
      expiring_90d_qty,
      nearest_expiry_date,
      batches: derivedB,
    }
  }

  return {
    name: productName,
    received,
    sell_in,
    sell_out,
    in_warehouse,
    reserved_qty,
    in_market,
    samples,
    returns,
    sellable_returns,
    damaged_returns,
    expired_returns,
    adjustments,
    transfers_rep,
    sell_through_pct,
    available_qty,
    expired_qty,
    expiring_90d_qty,
    nearest_expiry_date,
    batches: derivedB,
  }
}

// ── Overall helpers for Home & Reports ───────────────────────────────────────
export function getAllDerivedBatches(
  movements: StockMovement[],
  batches: BatchRecord[],
  warehouseId?: string,
): DerivedBatch[] {
  return deriveBatches(batches, movements, undefined, warehouseId)
}

export function getBatchesNearExpiry(
  movements: StockMovement[],
  batches: BatchRecord[],
  daysThreshold = 90,
  warehouseId?: string,
): DerivedBatch[] {
  const all = deriveBatches(batches, movements, undefined, warehouseId)
  return all.filter((b) => !b.is_expired && b.days_to_expiry <= daysThreshold && b.qty_available > 0)
}

export function getExpiredBatches(
  movements: StockMovement[],
  batches: BatchRecord[],
  warehouseId?: string,
): DerivedBatch[] {
  const all = deriveBatches(batches, movements, undefined, warehouseId)
  return all.filter((b) => b.is_expired && b.qty_physical > 0)
}

// ── Phase 2 Operational & Inventory Operations ───────────────────────────────

export interface ReceiveStockInput {
  productName: string
  batchNumber: string
  expiryDate: string
  quantity: number
  warehouseId?: string
  warehouseName?: string
  actor?: string
  notes?: string
}

export function receiveStock(input: ReceiveStockInput): StockMovement {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error('Stock receipt quantity must be a positive integer.')
  }
  if (!input.batchNumber.trim()) {
    throw new Error('Batch number is required.')
  }
  if (!input.expiryDate) {
    throw new Error('Expiry date is required.')
  }

  const cleanBatchNo = input.batchNumber.trim().toUpperCase()
  const today = new Date().toISOString().slice(0, 10)

  // Ensure batch exists in batchesStore
  const existingBatch = batchesStore.get().find(
    (b) =>
      b.batch_no.toUpperCase() === cleanBatchNo &&
      b.productName.toLowerCase() === input.productName.toLowerCase(),
  )

  let batchId = existingBatch?.id
  if (!existingBatch) {
    const newBatch = addBatch({
      batch_no: cleanBatchNo,
      productName: input.productName,
      expiry_date: input.expiryDate,
      initial_qty: input.quantity,
      warehouseId: input.warehouseId,
      warehouseName: input.warehouseName,
      status: 'Healthy',
    })
    batchId = newBatch.id
  }

  const movement = addStockMovement({
    productName: input.productName,
    batch_id: batchId,
    batchNumber: cleanBatchNo,
    quantity: input.quantity,
    type: 'receipt',
    date: today,
    warehouseId: input.warehouseId,
    warehouseName: input.warehouseName,
    notes: input.notes || 'Warehouse stock receipt',
  })

  addAuditLog({
    action: 'Stock Received',
    actor: input.actor || 'System',
    time: 'Just now',
    details: `Received ${input.quantity} units of ${input.productName} (Batch ${cleanBatchNo}) into ${input.warehouseName || input.warehouseId || 'Warehouse'}`,
  })

  return movement
}

export function reserveStock(
  orderId: string,
  items: Array<{ productCode?: string; productName: string; quantity: number }>,
  warehouseId?: string,
): StockReservation[] {
  // 1. Idempotency check: if active reservations already exist for this order, return them
  const existingActive = stockReservationsStore
    .get()
    .filter((r) => r.orderId === orderId && r.status === 'active')
  if (existingActive.length > 0) {
    return existingActive
  }

  const batches = batchesStore.get()
  const movements = stockMovementsStore.get()
  const currentReservations = stockReservationsStore.get()

  // 2. Validate all items before making any reservations (atomic check)
  const requiredQtyByProduct = new Map<string, number>()
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(`Invalid reservation quantity for ${item.productName}. Must be a positive integer.`)
    }
    requiredQtyByProduct.set(
      item.productName,
      (requiredQtyByProduct.get(item.productName) ?? 0) + item.quantity,
    )
  }

  // Simulate allocations atomically
  const newReservations: StockReservation[] = []
  const simulatedReservations = [...currentReservations]

  for (const [productName, qty] of requiredQtyByProduct.entries()) {
    const allocations = allocateFefo(
      productName,
      qty,
      batches,
      movements,
      simulatedReservations,
      warehouseId,
    )

    for (const alloc of allocations) {
      const res: StockReservation = {
        id: `RES-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        orderId,
        productName: alloc.productName,
        batchId: alloc.batchId,
        batchNumber: alloc.batchNumber,
        warehouseId: alloc.warehouseId || warehouseId,
        quantity: alloc.quantity,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      newReservations.push(res)
      simulatedReservations.push(res)
    }
  }

  // 3. Persist reservations to store
  stockReservationsStore.update((list) => [...newReservations, ...list])

  // 4. Log reservation stock movements
  for (const res of newReservations) {
    addStockMovement({
      order_id: orderId,
      productName: res.productName,
      batch_id: res.batchId,
      batchNumber: res.batchNumber,
      quantity: res.quantity,
      type: 'reservation',
      warehouseId: res.warehouseId,
      notes: `Reservation for order ${orderId}`,
    })
  }

  return newReservations
}

export function releaseReservation(orderId: string, reason?: string): void {
  const active = stockReservationsStore
    .get()
    .filter((r) => r.orderId === orderId && r.status === 'active')
  if (active.length === 0) return

  const at = new Date().toISOString()
  stockReservationsStore.update((list) =>
    list.map((r) =>
      r.orderId === orderId && r.status === 'active'
        ? { ...r, status: 'cancelled', updatedAt: at }
        : r,
    ),
  )

  for (const res of active) {
    addStockMovement({
      order_id: orderId,
      productName: res.productName,
      batch_id: res.batchId,
      batchNumber: res.batchNumber,
      quantity: res.quantity,
      type: 'reservation_release',
      warehouseId: res.warehouseId,
      reason: reason || 'Reservation released',
      notes: `Released reservation for order ${orderId}`,
    })
  }
}

export function dispatchReservedStock(
  orderId: string,
  actor: string,
  details?: {
    customerId?: string
    customerName?: string
    repId?: string
    repName?: string
    warehouseId?: string
  },
): void {
  // 1. Idempotency: check if this order was already dispatched
  const alreadyDispatched = stockMovementsStore
    .get()
    .some((m) => m.order_id === orderId && (m.type === 'sell_in' || m.type === 'dispatch'))
  if (alreadyDispatched) {
    return
  }

  const activeReservations = stockReservationsStore
    .get()
    .filter((r) => r.orderId === orderId && r.status === 'active')

  if (activeReservations.length === 0) {
    throw new Error(`No active reservations found for order ${orderId} to dispatch.`)
  }

  const at = new Date().toISOString()
  const today = at.slice(0, 10)

  // 2. Mark reservations fulfilled
  stockReservationsStore.update((list) =>
    list.map((r) =>
      r.orderId === orderId && r.status === 'active'
        ? { ...r, status: 'fulfilled', updatedAt: at }
        : r,
    ),
  )

  // 3. Record physical deduction movements
  for (const res of activeReservations) {
    addStockMovement({
      order_id: orderId,
      productName: res.productName,
      batch_id: res.batchId,
      batchNumber: res.batchNumber,
      quantity: res.quantity,
      type: 'sell_in',
      date: today,
      customer_id: details?.customerId,
      customerName: details?.customerName,
      rep_id: details?.repId,
      repName: details?.repName,
      warehouseId: res.warehouseId || details?.warehouseId,
      notes: `Dispatched order ${orderId}`,
    })
  }

  addAuditLog({
    action: 'Order Dispatched',
    actor,
    time: 'Just now',
    details: `Dispatched order ${orderId} (${activeReservations.length} line items fulfilled)`,
  })
}

export interface TransferWarehouseInput {
  productName: string
  batchNumber: string
  sourceWarehouseId: string
  targetWarehouseId: string
  quantity: number
  actor: string
  reason?: string
}

export function transferWarehouseStock(input: TransferWarehouseInput) {
  if (input.sourceWarehouseId === input.targetWarehouseId) {
    throw new Error('Source and target warehouses must be different.')
  }
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error('Transfer quantity must be a positive integer.')
  }

  const batches = batchesStore.get()
  const movements = stockMovementsStore.get()

  // Derive source warehouse batch stock
  const sourceBatches = deriveBatches(
    batches,
    movements,
    input.productName,
    input.sourceWarehouseId,
  )
  const sourceBatch = sourceBatches.find((b) => b.batch_no === input.batchNumber)

  if (!sourceBatch || sourceBatch.qty_available < input.quantity) {
    const avail = sourceBatch ? sourceBatch.qty_available : 0
    throw new Error(
      `Insufficient available stock in source warehouse. Available: ${avail}, Requested: ${input.quantity}`,
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const transferRef = `TR-${Date.now()}`

  // Outbound movement from source warehouse
  addStockMovement({
    productName: input.productName,
    batchNumber: input.batchNumber,
    quantity: input.quantity,
    type: 'transfer_warehouse',
    date: today,
    warehouseId: input.sourceWarehouseId,
    targetWarehouseId: input.targetWarehouseId,
    referenceId: transferRef,
    referenceType: 'outbound',
    reason: input.reason || 'Warehouse transfer',
    notes: `Transfer to ${input.targetWarehouseId}`,
  })

  // Inbound movement to target warehouse
  addStockMovement({
    productName: input.productName,
    batchNumber: input.batchNumber,
    quantity: input.quantity,
    type: 'transfer_warehouse',
    date: today,
    warehouseId: input.targetWarehouseId,
    targetWarehouseId: input.sourceWarehouseId,
    referenceId: transferRef,
    referenceType: 'inbound',
    reason: input.reason || 'Warehouse transfer',
    notes: `Transfer from ${input.sourceWarehouseId}`,
  })

  addAuditLog({
    action: 'Warehouse Stock Transfer',
    actor: input.actor,
    time: 'Just now',
    details: `Transferred ${input.quantity} units of ${input.productName} (Batch ${input.batchNumber}) from ${input.sourceWarehouseId} to ${input.targetWarehouseId}`,
  })
}

export function issueRepSample(input: {
  productName: string
  batchNumber: string
  quantity: number
  repId: string
  repName: string
  warehouseId?: string
  actor?: string
}) {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error('Sample transfer quantity must be a positive integer.')
  }
  const batches = batchesStore.get()
  const movements = stockMovementsStore.get()
  const derivedB = deriveBatches(batches, movements, input.productName, input.warehouseId)
  const batch = derivedB.find((b) => b.batch_no === input.batchNumber)

  if (!batch || batch.qty_available < input.quantity) {
    const avail = batch ? batch.qty_available : 0
    throw new Error(
      `Insufficient warehouse stock to transfer samples. Available: ${avail}, Requested: ${input.quantity}`,
    )
  }

  const movement = addStockMovement({
    productName: input.productName,
    batch_id: batch.id,
    batchNumber: input.batchNumber,
    quantity: input.quantity,
    type: 'transfer_rep',
    rep_id: input.repId,
    repName: input.repName,
    warehouseId: input.warehouseId,
    notes: `Sample transferred to rep ${input.repName}`,
  })

  addAuditLog({
    action: 'Sample Transferred to Rep',
    actor: input.actor || 'System',
    time: 'Just now',
    details: `Transferred ${input.quantity} sample units of ${input.productName} to ${input.repName}`,
  })

  return movement
}

export function distributeRepSample(input: {
  productName: string
  quantity: number
  customerId: string
  customerName: string
  repId: string
  repName: string
  batchNumber?: string
  visitId?: string
}) {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error('Sample distribution quantity must be a positive integer.')
  }
  const batches = batchesStore.get()
  const movements = stockMovementsStore.get()

  const availableCustody = getRepAvailableSampleStock(
    input.repName,
    input.productName,
    batches,
    movements,
  )
  if (availableCustody < input.quantity) {
    throw new Error(
      `Representative ${input.repName} does not have sufficient sample custody for ${input.productName}. Available: ${availableCustody}, Requested: ${input.quantity}`,
    )
  }

  const allocations = allocateRepSampleFefo(
    input.repName,
    input.productName,
    input.quantity,
    batches,
    movements,
  )
  const today = new Date().toISOString().slice(0, 10)

  const createdMovements: StockMovement[] = []
  for (const alloc of allocations) {
    const m = addStockMovement({
      productName: alloc.productName,
      batch_id: alloc.batchId,
      batchNumber: alloc.batchNumber,
      quantity: alloc.quantity,
      type: 'sample',
      date: today,
      customer_id: input.customerId,
      customerName: input.customerName,
      rep_id: input.repId,
      repName: input.repName,
      referenceId: input.visitId,
      referenceType: 'visit',
      notes: `Sample distributed during visit ${input.visitId || ''}`.trim(),
    })
    createdMovements.push(m)
  }

  return createdMovements
}

export function returnRepSample(input: {
  productName: string
  quantity: number
  repId: string
  repName: string
  batchNumber: string
  warehouseId?: string
  actor?: string
}) {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error('Return sample quantity must be a positive integer.')
  }
  const batches = batchesStore.get()
  const movements = stockMovementsStore.get()

  const repBatches = getRepSampleBatches(input.repName, input.productName, batches, movements)
  const repBatch = repBatches.find((b) => b.batchNumber === input.batchNumber)
  if (!repBatch || repBatch.remainingQty < input.quantity) {
    const rem = repBatch ? repBatch.remainingQty : 0
    throw new Error(
      `Representative does not have sufficient sample custody in batch ${input.batchNumber}. Remaining: ${rem}, Requested: ${input.quantity}`,
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const movement = addStockMovement({
    productName: input.productName,
    batch_id: repBatch.batchId,
    batchNumber: input.batchNumber,
    quantity: input.quantity,
    type: 'transfer_rep',
    referenceType: 'return',
    date: today,
    rep_id: input.repId,
    repName: input.repName,
    warehouseId: input.warehouseId,
    notes: `Sample returned by rep ${input.repName} to warehouse`,
  })

  addAuditLog({
    action: 'Sample Returned by Rep',
    actor: input.actor || input.repName,
    time: 'Just now',
    details: `Returned ${input.quantity} sample units of ${input.productName} (Batch ${input.batchNumber}) to warehouse`,
  })

  return movement
}
