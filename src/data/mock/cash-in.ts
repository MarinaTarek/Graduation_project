import { createStore } from './store'
import { addAuditLog } from './audit'
import { addNotification } from './notifications'
import { invoicesStore, type StoredInvoice, updateInvoice } from './invoices'
import { resolveCustomerId } from './customerResolution'
import { getSystemCurrentDate, getSystemCurrentYearMonth } from '@/lib/dateUtils'
import { findAuthoritativeUser } from '@/lib/approval/approvalEngine'

export interface CollectionInvoice {
  id: string
  invoiceNumber: string
  customerId: string
  customerName: string
  customerName_ar?: string
  warehouseId?: string
  warehouseName?: string
  warehouseName_ar?: string
  issueDate: string
  dueDate: string
  originalAmount: number
  currency: string
  repName: string
  repId?: string
  notes?: string
  status?: string
  needsReconciliation?: boolean
  reconciliationReason?: string
}

export interface InvoiceAllocation {
  invoiceId: string
  invoiceNumber: string
  allocatedAmount: number
  invoiceOriginalAmount: number
}

export type PaymentMethod = 'Cash'
export type PaymentStatus = 'Completed' | 'Voided'
export type InvoicePaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue'

export interface PaymentRecord {
  id: string
  receiptNumber: string
  customerId: string
  customerName: string
  customerName_ar?: string
  paymentDate: string
  amount: number
  currency?: string
  paymentMethod: PaymentMethod
  referenceNumber: string
  receivedBy: string
  status: PaymentStatus
  notes?: string
  allocations: InvoiceAllocation[]
  unallocatedAmount?: number
  created_at: string
  voidedAt?: string
  voidedBy?: string
  voidReason?: string
}

export interface InvoiceCalculatedSummary {
  invoice: CollectionInvoice
  paidAmount: number
  remainingBalance: number
  effectiveBalance: number
  isOverpaid: boolean
  overpaidAmount: number
  paymentStatus: InvoicePaymentStatus
  isOverdue: boolean
  daysOverdue: number
  allocationsCount: number
}

export interface CashInKpis {
  totalInvoiced: number
  totalCollected: number
  outstandingBalance: number
  overdueAmount: number
  collectionsThisMonth: number
}

// Dynamic system reference date
export const SYSTEM_CURRENT_DATE = getSystemCurrentDate()

// D-05 / D-07 / D-02:
// - Amount: use inv.originalAmount directly; NO EGP regex fallback here.
//   Records that could not be normalised carry needsReconciliation=true and
//   originalAmount=0; callers must check that flag before allocating.
// - Customer: delegate to the shared resolveCustomerId() so this path and
//   normalizeLegacyInvoice() are always consistent.
// - Dates: missing dates are exposed as empty strings rather than invented
//   historical defaults; date-dependent calculations guard for falsy dates.
export function toCollectionInvoice(inv: StoredInvoice): CollectionInvoice {
  const invoiceNumber = inv.invoiceNumber || inv.id || inv.name.split('·')[0].trim()
  const customerName = inv.customerName || (inv.name.includes('·') ? inv.name.split('·')[1].trim() : inv.name)

  // D-05: structured amount is authoritative; no regex fallback.
  const amount =
    typeof inv.originalAmount === 'number' && Number.isFinite(inv.originalAmount) && inv.originalAmount >= 0
      ? inv.originalAmount
      : 0

  // D-02: single shared customer-resolution path.
  const customerResolution = resolveCustomerId(inv.customerId, customerName)
  const customerId = customerResolution.customerId

  // D-07: expose real dates; never invent them.
  const issueDate = inv.issueDate || ''
  const dueDate = inv.dueDate || ''

  return {
    id: invoiceNumber,
    invoiceNumber,
    customerId,
    customerName,
    customerName_ar: inv.customerName_ar || (inv.name_ar?.includes('·') ? inv.name_ar.split('·')[1].trim() : undefined),
    warehouseId: inv.warehouseId || (customerId.startsWith('wh-') ? customerId : undefined),
    warehouseName: inv.warehouseName,
    warehouseName_ar: inv.warehouseName_ar,
    issueDate,
    dueDate,
    originalAmount: Math.round(amount * 100) / 100,
    currency: inv.currency || 'EGP',
    repName: inv.repName || 'Alex Morgan',
    repId: inv.repId || (inv.repName === 'Maya Patel' ? 'rep-maya' : inv.repName === 'Olivia Martin' ? 'rep-olivia' : inv.repName === 'Sofia Chen' ? 'rep-sofia' : inv.repName === 'James Wilson' ? 'rep-james' : 'u-admin-1'),
    notes: inv.notes || inv.meta,
    status: inv.status,
    needsReconciliation: inv.needsReconciliation,
    reconciliationReason: inv.reconciliationReason,
  }
}

export function getSharedCollectionInvoices(): CollectionInvoice[] {
  // D-03: exclude Rejected and needsReconciliation invoices from normal collection views.
  return invoicesStore.get().filter((i) => i.status !== 'Rejected' && !i.needsReconciliation).map(toCollectionInvoice)
}

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-088',
    receiptNumber: 'REC-2026-088',
    customerId: 'c-2',
    customerName: 'Green Cross Pharmacy',
    customerName_ar: 'صيدلية جرين كروس',
    paymentDate: '2026-10-24',
    amount: 12000,
    paymentMethod: 'Cash',
    referenceNumber: 'CSH-2401',
    receivedBy: 'Maya Patel',
    status: 'Completed',
    notes: 'Cash collected during field restock visit.',
    allocations: [
      {
        invoiceId: 'INV-1040',
        invoiceNumber: 'INV-1040',
        allocatedAmount: 8000,
        invoiceOriginalAmount: 16380,
      },
      {
        invoiceId: 'INV-1048',
        invoiceNumber: 'INV-1048',
        allocatedAmount: 4000,
        invoiceOriginalAmount: 8420,
      },
    ],
    created_at: '2026-10-24T14:30:00Z',
  },
  {
    id: 'pay-087',
    receiptNumber: 'REC-2026-087',
    customerId: 'c-6',
    customerName: 'Metro Health Center',
    customerName_ar: 'مركز مترو الصحي',
    paymentDate: '2026-10-22',
    amount: 15200,
    paymentMethod: 'Cash',
    referenceNumber: 'CSH-8849',
    receivedBy: 'Olivia Martin',
    status: 'Completed',
    notes: 'Cash payment confirmed.',
    allocations: [
      {
        invoiceId: 'INV-1039',
        invoiceNumber: 'INV-1039',
        allocatedAmount: 15200,
        invoiceOriginalAmount: 15200,
      },
    ],
    created_at: '2026-10-22T10:15:00Z',
  },
  {
    id: 'pay-086',
    receiptNumber: 'REC-2026-086',
    customerId: 'c-9',
    customerName: 'Riverside Pharmacy',
    customerName_ar: 'صيدلية ريفرسايد',
    paymentDate: '2026-10-20',
    amount: 9400,
    paymentMethod: 'Cash',
    referenceNumber: 'CSH-8821',
    receivedBy: 'Sofia Chen',
    status: 'Completed',
    notes: 'Cash receipt cleared.',
    allocations: [
      {
        invoiceId: 'INV-1041',
        invoiceNumber: 'INV-1041',
        allocatedAmount: 9400,
        invoiceOriginalAmount: 9400,
      },
    ],
    created_at: '2026-10-20T11:45:00Z',
  },
  {
    id: 'pay-085',
    receiptNumber: 'REC-2026-085',
    customerId: 'c-4',
    customerName: 'Wellness First',
    customerName_ar: 'ويلنس فيرست',
    paymentDate: '2026-10-18',
    amount: 7100,
    paymentMethod: 'Cash',
    referenceNumber: 'CSH-4019',
    receivedBy: 'Maya Patel',
    status: 'Completed',
    notes: 'Cash payment settlement.',
    allocations: [
      {
        invoiceId: 'INV-1042',
        invoiceNumber: 'INV-1042',
        allocatedAmount: 7100,
        invoiceOriginalAmount: 7100,
      },
    ],
    created_at: '2026-10-18T09:30:00Z',
  },
  {
    id: 'pay-084',
    receiptNumber: 'REC-2026-084',
    customerId: 'c-apex',
    customerName: 'Apex Pharma Distribution',
    customerName_ar: 'توزيع أبيكس فارما',
    paymentDate: '2026-10-15',
    amount: 25000,
    paymentMethod: 'Cash',
    referenceNumber: 'CSH-1092',
    receivedBy: 'James Wilson',
    status: 'Completed',
    notes: 'Partial cash settlement for Q3 bulk invoice.',
    allocations: [
      {
        invoiceId: 'INV-1036',
        invoiceNumber: 'INV-1036',
        allocatedAmount: 25000,
        invoiceOriginalAmount: 38500,
      },
    ],
    created_at: '2026-10-15T16:00:00Z',
  },
  {
    id: 'pay-083',
    receiptNumber: 'REC-2026-083',
    customerId: 'c-medplus',
    customerName: 'MedPlus',
    customerName_ar: 'صيدلية ميد بلس',
    paymentDate: '2026-10-10',
    amount: 4840,
    paymentMethod: 'Cash',
    referenceNumber: 'CSH-1029',
    receivedBy: 'Alex Morgan',
    status: 'Completed',
    notes: 'Full cash payment received at head office.',
    allocations: [
      {
        invoiceId: 'INV-1047',
        invoiceNumber: 'INV-1047',
        allocatedAmount: 4840,
        invoiceOriginalAmount: 4840,
      },
    ],
    created_at: '2026-10-10T13:20:00Z',
  },
  {
    id: 'pay-082',
    receiptNumber: 'REC-2026-082',
    customerId: 'c-2',
    customerName: 'Green Cross Pharmacy',
    customerName_ar: 'صيدلية جرين كروس',
    paymentDate: '2026-10-05',
    amount: 10000,
    paymentMethod: 'Cash',
    referenceNumber: 'CSH-7719',
    receivedBy: 'Maya Patel',
    status: 'Completed',
    notes: 'Cash collected during scheduled visit.',
    allocations: [
      {
        invoiceId: 'INV-1035',
        invoiceNumber: 'INV-1035',
        allocatedAmount: 10000,
        invoiceOriginalAmount: 12000,
      },
    ],
    created_at: '2026-10-05T12:00:00Z',
  },
  {
    id: 'pay-081',
    receiptNumber: 'REC-2026-081',
    customerId: 'c-6',
    customerName: 'Metro Health Center',
    customerName_ar: 'مركز مترو الصحي',
    paymentDate: '2026-09-28',
    amount: 3210,
    paymentMethod: 'Cash',
    referenceNumber: 'CSH-0981',
    receivedBy: 'Olivia Martin',
    status: 'Voided',
    notes: 'Payment record cancelled due to erroneous receipt duplicate.',
    voidedAt: '2026-09-29T11:00:00Z',
    voidedBy: 'Alex Morgan',
    voidReason: 'Client provided replacement cash slip instead of branch duplicate.',
    allocations: [
      {
        invoiceId: 'INV-1044',
        invoiceNumber: 'INV-1044',
        allocatedAmount: 3210,
        invoiceOriginalAmount: 3210,
      },
    ],
    created_at: '2026-09-28T15:00:00Z',
  },
]

// Stores
export const collectionInvoicesStore = createStore<CollectionInvoice[]>(
  'collection_invoices',
  getSharedCollectionInvoices(),
)

export const collectionsStore = createStore<PaymentRecord[]>(
  'collections',
  INITIAL_PAYMENTS,
)

export interface CollectionTargetSettings {
  monthlyTarget: number
  targetMonth: string
}

export const collectionTargetStore = createStore<CollectionTargetSettings>(
  'cash_in_target',
  {
    monthlyTarget: 100000,
    targetMonth: getSystemCurrentYearMonth(),
  },
)

export function updateCollectionTarget(newTarget: number, actor: string = 'Alex Morgan') {
  collectionTargetStore.update((curr) => {
    const updated = { ...curr, monthlyTarget: newTarget }
    addAuditLog({
      action: 'Collection Target Updated',
      actor,
      time: 'Just now',
      module: 'Collections',
      actionType: 'update',
      affectedRecord: `Monthly Target (${curr.targetMonth})`,
      status: 'Success',
      details: `Updated monthly collection target to ${newTarget.toLocaleString()} EGP`,
    })
    return updated
  })
}

// Calculation Helpers
export function getInvoicePaymentSummary(
  invoice: CollectionInvoice,
  allPayments: PaymentRecord[],
  systemDate: string = getSystemCurrentDate(),
): InvoiceCalculatedSummary {
  // Non-voided payments allocating to this invoice
  const validAllocations = allPayments
    .filter((p) => p.status !== 'Voided')
    .flatMap((p) =>
      p.allocations
        .filter((a) => a.invoiceId === invoice.id || a.invoiceNumber === invoice.invoiceNumber)
        .map((a) => a.allocatedAmount),
    )

  const paidAmount = Math.round(validAllocations.reduce((sum, amt) => sum + amt, 0) * 100) / 100
  const rawRemaining = Math.round((invoice.originalAmount - paidAmount) * 100) / 100
  const isOverpaid = rawRemaining < 0
  const overpaidAmount = isOverpaid ? Math.abs(rawRemaining) : 0
  const remainingBalance = rawRemaining
  const effectiveBalance = Math.max(0, remainingBalance)

  // D-07: guard against missing/empty dates — if dueDate is unknown, treat
  // the invoice as not overdue (we cannot determine overdue status safely).
  const isDueDatePassed =
    invoice.dueDate
      ? new Date(invoice.dueDate).getTime() < new Date(systemDate).getTime()
      : false
  const isOverdue = remainingBalance > 0 && isDueDatePassed

  let daysOverdue = 0
  if (isOverdue && invoice.dueDate) {
    const diffTime = Math.abs(new Date(systemDate).getTime() - new Date(invoice.dueDate).getTime())
    daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  let paymentStatus: InvoicePaymentStatus = 'Unpaid'
  if (remainingBalance <= 0) {
    paymentStatus = 'Paid'
  } else if (paidAmount > 0) {
    paymentStatus = 'Partially Paid'
  } else if (isOverdue) {
    paymentStatus = 'Overdue'
  } else {
    paymentStatus = 'Unpaid'
  }

  return {
    invoice,
    paidAmount,
    remainingBalance,
    effectiveBalance,
    isOverpaid,
    overpaidAmount,
    paymentStatus,
    isOverdue,
    daysOverdue,
    allocationsCount: validAllocations.length,
  }
}

export function calculateCashInKpis(
  invoices: CollectionInvoice[],
  payments: PaymentRecord[],
  systemDate: string = SYSTEM_CURRENT_DATE,
): CashInKpis {
  // 1. Total Invoiced Amount
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.originalAmount, 0)

  // 2. Total Collected Amount (from non-voided payments)
  const validPayments = payments.filter((p) => p.status !== 'Voided')
  const totalCollected = validPayments.reduce((sum, p) => sum + p.amount, 0)

  // 3. Outstanding Balance (sum of remaining balances across all invoices)
  let outstandingBalance = 0
  let overdueAmount = 0

  invoices.forEach((inv) => {
    const summary = getInvoicePaymentSummary(inv, payments, systemDate)
    outstandingBalance += summary.effectiveBalance
    if (summary.isOverdue) {
      overdueAmount += summary.effectiveBalance
    }
  })

  // 5. Collections This Month (payments in current month: 2026-10)
  const currentMonthPrefix = systemDate.slice(0, 7) // '2026-10'
  const collectionsThisMonth = validPayments
    .filter((p) => p.paymentDate?.startsWith(currentMonthPrefix))
    .reduce((sum, p) => sum + p.amount, 0)

  return {
    totalInvoiced: Math.round(totalInvoiced * 100) / 100,
    totalCollected: Math.round(totalCollected * 100) / 100,
    outstandingBalance: Math.round(outstandingBalance * 100) / 100,
    overdueAmount: Math.round(overdueAmount * 100) / 100,
    collectionsThisMonth: Math.round(collectionsThisMonth * 100) / 100,
  }
}

// Add New Collection Action with strict domain invariants
export function addCollectionPayment(
  data: Omit<PaymentRecord, 'id' | 'created_at' | 'status' | 'receiptNumber'> & {
    status?: PaymentStatus
    currency?: string
    receiptNumber?: string
  },
): PaymentRecord {
  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    throw new Error('Payment received amount must be a positive number.')
  }
  if (!data.customerId || !data.customerId.trim()) {
    throw new Error('Customer ID is required for recording a payment.')
  }

  const all = collectionsStore.get()
  const currency = data.currency || 'EGP'

  // Monotonic unique receipt numbering (never relying on array length)
  let receiptNumber = data.receiptNumber?.trim()
  if (!receiptNumber) {
    const maxNum = all.reduce((max, p) => {
      const match = p.receiptNumber.match(/REC-\d+-(\d+)/)
      return match ? Math.max(max, Number(match[1])) : max
    }, 88)
    receiptNumber = `REC-2026-${String(maxNum + 1).padStart(3, '0')}`
  } else {
    const duplicate = all.find((p) => p.receiptNumber === receiptNumber)
    if (duplicate) {
      throw new Error(`Receipt number ${receiptNumber} already exists.`)
    }
  }

  // Validate allocations
  const currentInvoices = invoicesStore.get()
  let totalAllocated = 0

  for (const alloc of data.allocations) {
    if (!Number.isFinite(alloc.allocatedAmount) || alloc.allocatedAmount <= 0) {
      throw new Error(`Allocation for invoice ${alloc.invoiceNumber || alloc.invoiceId} must be positive.`)
    }

    // Locate target invoice
    const inv = currentInvoices.find(
      (i) =>
        i.id === alloc.invoiceId ||
        i.invoiceNumber === alloc.invoiceNumber ||
        i.name === alloc.invoiceId ||
        i.name.includes(alloc.invoiceNumber),
    )
    if (!inv) {
      throw new Error(`Invoice ${alloc.invoiceNumber || alloc.invoiceId} not found.`)
    }

    // D-03: block allocation against invoices that need reconciliation.
    if (inv.needsReconciliation) {
      throw new Error(
        `Invoice ${inv.invoiceNumber || inv.id} requires reconciliation before it can receive payment allocations. Reason: ${inv.reconciliationReason || 'unknown'}`,
      )
    }

    const colInv = toCollectionInvoice(inv)

    // Customer match check: invoice must belong to the same customer or linked warehouse
    if (colInv.customerId !== data.customerId && colInv.warehouseId !== data.customerId) {
      throw new Error(
        `Cannot allocate payment from customer ${data.customerId} to invoice ${colInv.invoiceNumber} belonging to customer ${colInv.customerId}.`,
      )
    }

    // Check currency match
    if (colInv.currency && colInv.currency !== currency) {
      throw new Error(
        `Currency mismatch: Receipt is in ${currency} but invoice ${colInv.invoiceNumber} is in ${colInv.currency}.`,
      )
    }

    // Check allocation does not exceed remaining eligible balance
    const summary = getInvoicePaymentSummary(colInv, all)
    if (alloc.allocatedAmount > summary.remainingBalance) {
      throw new Error(
        `Allocation of ${alloc.allocatedAmount} ${currency} exceeds remaining balance of ${summary.remainingBalance} ${currency} on invoice ${colInv.invoiceNumber}.`,
      )
    }

    totalAllocated += alloc.allocatedAmount
  }

  totalAllocated = Math.round(totalAllocated * 100) / 100

  // Invariant: Total active allocations <= Receipt amount
  if (totalAllocated > data.amount) {
    throw new Error(
      `Total allocated amount (${totalAllocated} ${currency}) cannot exceed received payment amount (${data.amount} ${currency}).`,
    )
  }

  const unallocatedAmount = Math.round((data.amount - totalAllocated) * 100) / 100
  const id = `pay-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`

  const newPayment: PaymentRecord = {
    ...data,
    id,
    receiptNumber,
    currency,
    paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
    paymentMethod: data.paymentMethod || 'Cash',
    status: data.status || 'Completed',
    unallocatedAmount,
    created_at: new Date().toISOString(),
  }

  collectionsStore.update((list) => [newPayment, ...list])

  // Update invoice status & balances in invoicesStore
  const updatedAll = [newPayment, ...all]
  data.allocations.forEach((alloc) => {
    const inv = invoicesStore.get().find(
      (i) =>
        i.id === alloc.invoiceId ||
        i.invoiceNumber === alloc.invoiceNumber ||
        i.name.includes(alloc.invoiceNumber) ||
        i.name === alloc.invoiceId,
    )
    if (inv) {
      const colInv = toCollectionInvoice(inv)
      const summary = getInvoicePaymentSummary(colInv, updatedAll)
      updateInvoice(inv.id || inv.name, {
        paidAmount: summary.paidAmount,
        remainingBalance: summary.remainingBalance,
        paymentStatus: summary.paymentStatus,
        overpaid: summary.isOverpaid,
        overpaidAmount: summary.overpaidAmount,
      })
    }
  })

  addAuditLog({
    action: 'Payment Collected',
    actor: data.receivedBy,
    time: 'Just now',
    details: `Recorded receipt ${receiptNumber} for ${data.customerName} (${data.amount.toLocaleString()} ${currency} in cash, ${unallocatedAmount} unallocated)`,
  })

  addNotification({
    title: 'Payment Collected',
    title_ar: 'تم تسجيل تحصيل نقدي',
    message: `Receipt ${receiptNumber} collected from ${data.customerName} (${currency} ${data.amount.toLocaleString()})`,
    message_ar: `تم تسجيل إيصال ${receiptNumber} من ${data.customerName_ar || data.customerName} (${data.amount.toLocaleString()} ${currency === 'EGP' ? 'ج.م' : currency} نقداً)`,
    category: 'collections',
    priority: 'info',
    time: 'Just now',
    targetPage: 'Cash In',
    actionLabel: 'View Collections',
    actionLabel_ar: 'عرض التحصيلات',
  })

  return newPayment
}

// Void Payment Action with full duplicate prevention and state reconciliation
export function voidCollectionPayment(
  receiptNumber: string,
  reason: string,
  actor: string,
): boolean {
  if (actor) {
    const authUser = findAuthoritativeUser(actor)
    if (authUser && (authUser.role === 'rep' || authUser.role === 'marketing_manager')) {
      throw new Error(`Unauthorized: Role "${authUser.role}" cannot void collection payment records.`)
    }
  }

  let success = false
  let targetPayment: PaymentRecord | undefined

  const currentPayments = collectionsStore.get()
  const found = currentPayments.find((p) => p.receiptNumber === receiptNumber || p.id === receiptNumber)

  if (!found) {
    throw new Error(`Payment receipt ${receiptNumber} not found.`)
  }

  if (found.status === 'Voided') {
    throw new Error(`Payment receipt ${receiptNumber} is already voided.`)
  }

  collectionsStore.update((list) =>
    list.map((p) => {
      if (p.receiptNumber === receiptNumber || p.id === receiptNumber) {
        success = true
        targetPayment = p
        return {
          ...p,
          status: 'Voided',
          voidedAt: new Date().toISOString(),
          voidedBy: actor,
          voidReason: reason,
        }
      }
      return p
    }),
  )

  if (success && targetPayment) {
    const updatedPayments = collectionsStore.get()
    targetPayment.allocations.forEach((alloc) => {
      const inv = invoicesStore.get().find(
        (i) =>
          i.id === alloc.invoiceId ||
          i.invoiceNumber === alloc.invoiceNumber ||
          i.name.includes(alloc.invoiceNumber) ||
          i.name === alloc.invoiceId,
      )
      if (inv) {
        const colInv = toCollectionInvoice(inv)
        const summary = getInvoicePaymentSummary(colInv, updatedPayments)
        updateInvoice(inv.id || inv.name, {
          paidAmount: summary.paidAmount,
          remainingBalance: summary.remainingBalance,
          paymentStatus: summary.paymentStatus,
          overpaid: summary.isOverpaid,
          overpaidAmount: summary.overpaidAmount,
        })
      }
    })

    addAuditLog({
      action: 'Payment Voided',
      actor,
      time: 'Just now',
      details: `Voided receipt ${receiptNumber}. Reason: ${reason}`,
    })

    addNotification({
      title: 'Receipt Voided for Audit',
      title_ar: 'إلغاء إيصال تحصيل مسجل',
      message: `Receipt ${receiptNumber} was voided by ${actor}. Reason: ${reason}`,
      message_ar: `تم إلغاء الإيصال ${receiptNumber} بواسطة ${actor} بسبب: ${reason}`,
      category: 'collections',
      priority: 'warning',
      time: 'Just now',
      targetPage: 'Cash In',
      actionLabel: 'Audit Cash In',
      actionLabel_ar: 'تدقيق التحصيلات',
    })
  }

  return success
}
