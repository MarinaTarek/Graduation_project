import { invoicesMockData, type InvoiceRecord, type InvoiceLineItem } from '@/ui/pages/invoices/mock-data'
import { addAuditLog } from './audit'
import { createStore } from './store'
import { resolveCustomerId } from './customerResolution'
import { customersStore } from './customers'
import { getSystemNow, getSystemCurrentDate } from '@/lib/dateUtils'

export type { InvoiceLineItem } from '@/ui/pages/invoices/mock-data'

export type ApprovalHistoryEntry = {
  action: 'Approved' | 'Rejected' | 'Resubmitted'
  actor: string
  timestamp: string
  reason?: string
}

export type StoredInvoice = InvoiceRecord & {
  id: string
  invoiceNumber: string
  customerId: string
  customerName: string
  originalAmount: number
  currency: string
  issueDate: string
  dueDate: string
  repId?: string
  items?: InvoiceLineItem[]
  updated_at?: string
  created_at?: string
  order_id?: string
  rejection_reason?: string
  approval_history?: ApprovalHistoryEntry[]
  paidAmount?: number
  remainingBalance?: number
  paymentStatus?: string
  overpaid?: boolean
  overpaidAmount?: number
  discountAmount?: number
  /**
   * D-03: Set to true when this invoice was imported from legacy data and
   * one or more critical fields (amount, customer identity, dates) could not
   * be reliably resolved.  Such records must NOT participate in normal
   * collection allocation or financial KPIs as valid zero-value invoices.
   */
  needsReconciliation?: boolean
  /**
   * D-03: Human-readable explanation of why reconciliation is required,
   * preserved for display in the UI without crashing.
   */
  reconciliationReason?: string
}

const now = () => getSystemNow().toISOString()

// ---------------------------------------------------------------------------
// D-02: Legacy customer inference — single shared helper (see customerResolution.ts)
// ---------------------------------------------------------------------------

/**
 * D-03 / D-07: Normalize a raw legacy invoice record into a StoredInvoice.
 *
 * Key behavioural changes from Phase 1:
 *  - originalAmount = 0 is NO LONGER silently admitted.  Any record where
 *    the amount cannot be verified is flagged with needsReconciliation = true.
 *  - Customer ID is resolved through the shared resolveCustomerId() helper.
 *    Ambiguous or unknown results also set needsReconciliation = true.
 *  - issueDate / dueDate are NOT defaulted to hardcoded historical dates.
 *    Missing dates cause needsReconciliation = true; date-sensitive
 *    calculations in cash-in.ts guard against undefined dates.
 */
export function normalizeLegacyInvoice(inv: Partial<StoredInvoice> & { name: string }): StoredInvoice {
  const matchNum = (inv.invoiceNumber || inv.id || inv.name).match(/INV-(\d+)/)
  const invoiceNumber = inv.invoiceNumber || inv.id || (matchNum ? matchNum[0] : 'INV-0000')
  const id = inv.id || invoiceNumber
  const customerName = inv.customerName || (inv.name.includes('·') ? inv.name.split('·')[1].trim() : inv.name)

  // --- Amount resolution (D-03) -------------------------------------------
  let originalAmount: number | undefined = inv.originalAmount
  let amountUnresolved = false

  if (originalAmount === undefined || originalAmount === null || isNaN(originalAmount as number)) {
    // Migration-only: try to read from legacy meta string.
    if (inv.meta) {
      const match = inv.meta.match(/EGP\s*([\d,]+(?:\.\d+)?)/)
      if (match) {
        const parsed = Number(match[1].replace(/,/g, ''))
        if (Number.isFinite(parsed) && parsed > 0) {
          originalAmount = parsed
        }
      }
    }
  }

  if (originalAmount === undefined || !Number.isFinite(originalAmount) || originalAmount <= 0) {
    // Cannot determine a valid amount — keep 0 as a sentinel but flag the record.
    originalAmount = 0
    amountUnresolved = true
  }

  // --- Customer ID resolution (D-02) ----------------------------------------
  const customerResolution = resolveCustomerId(inv.customerId, customerName)
  const customerId = customerResolution.customerId
  const customerUnresolved = !customerResolution.resolved

  // --- Date resolution (D-07) ------------------------------------------------
  const issueDate = inv.issueDate || undefined
  const dueDate = inv.dueDate || undefined
  const datesUnresolved = !issueDate || !dueDate

  // --- Reconciliation flag (D-03) -------------------------------------------
  const needsReconciliation = amountUnresolved || customerUnresolved || datesUnresolved
  const reconciliationReasons: string[] = []
  if (amountUnresolved) reconciliationReasons.push('originalAmount could not be resolved')
  if (customerUnresolved)
    reconciliationReasons.push(`customerId unresolved (${customerResolution.reason})`)
  if (datesUnresolved) reconciliationReasons.push('issueDate or dueDate is missing')

  const currency = inv.currency || 'EGP'

  // issueDate/dueDate stored as undefined when missing; date-sensitive
  // calculations guard for this explicitly.
  const result: StoredInvoice = {
    ...inv,
    id,
    invoiceNumber,
    customerId,
    customerName,
    originalAmount: Math.round((originalAmount as number) * 100) / 100,
    currency,
    // Store the resolved dates if present, omit the field if unknown.
    ...(issueDate ? { issueDate } : {}),
    ...(dueDate ? { dueDate } : {}),
    status: inv.status || 'Pending',
    source: (inv.source as any) || 'Web upload',
    dateRange: inv.dateRange || 'This month',
    repName: inv.repName || 'Alex Morgan',
    name: inv.name || `${invoiceNumber} · ${customerName}`,
    meta: inv.meta || `${currency} ${(originalAmount as number).toLocaleString('en-US')}`,
    ...(needsReconciliation
      ? {
          needsReconciliation: true,
          reconciliationReason: reconciliationReasons.join('; '),
        }
      : {}),
  } as StoredInvoice

  return result
}

const initialNormalizedInvoices: StoredInvoice[] = (invoicesMockData as any[]).map((inv) =>
  normalizeLegacyInvoice(inv),
)

export const invoicesStore = createStore<StoredInvoice[]>('invoices', initialNormalizedInvoices)

export function generateInvoiceNumber(): string {
  const max = invoicesStore.get().reduce((latest, invoice) => {
    const match = (invoice.invoiceNumber || invoice.name || '').match(/INV-(\d+)/)
    return match ? Math.max(latest, Number(match[1])) : latest
  }, 1050)
  return `INV-${max + 1}`
}

// Continues the INV-#### numbering found in existing records (backward-compatible).
export function generateInvoiceName(customerName: string): string {
  const num = generateInvoiceNumber()
  return `${num} · ${customerName}`
}

export interface AddInvoiceInput {
  customerId: string
  customerName: string
  customerName_ar?: string
  originalAmount: number
  currency?: string
  invoiceNumber?: string
  issueDate?: string
  dueDate?: string
  status?: string
  source?: 'Telegram' | 'Web upload' | 'Sales order'
  repName?: string
  repId?: string
  items?: InvoiceLineItem[]
  discountAmount?: number
  order_id?: string
  notes?: string
  name?: string
  name_ar?: string
  meta?: string
  meta_ar?: string
  dateRange?: 'Today' | 'Last 7 days' | 'This month' | 'Last month'
  warehouseId?: string
  warehouseName?: string
  warehouseName_ar?: string
  attachmentFileName?: string
  attachmentFileSize?: string
  paidAmount?: number
  remainingBalance?: number
  paymentStatus?: string
}

// ---------------------------------------------------------------------------
// D-01: Line-item reconciliation helper
// ---------------------------------------------------------------------------
/**
 * When an invoice includes line items, the sum of item totals must equal
 * originalAmount (within a 1-cent floating-point tolerance).
 *
 * Behaviour by case:
 *  - No items provided         → allowed; header amount is authoritative.
 *  - Items provided, sum match → allowed.
 *  - Items provided, sum mismatch → rejected with a domain error.
 *
 * The 1-cent (0.01) tolerance absorbs harmless IEEE 754 rounding that
 * occurs when quantity × unitPrice is computed externally.
 */
export function validateLineItemReconciliation(
  originalAmount: number,
  items: InvoiceLineItem[] | undefined,
  discountAmount?: number,
): void {
  if (!items || items.length === 0) return

  const rawItemSum = items.reduce((sum, it) => sum + it.total, 0)
  const discount = Number.isFinite(discountAmount) && (discountAmount as number) > 0 ? (discountAmount as number) : 0
  const netItemSum = rawItemSum - discount

  const headerCents = Math.round(originalAmount * 100)
  const itemsCents = Math.round(netItemSum * 100)
  const diffCents = Math.abs(headerCents - itemsCents)

  // 1-cent tolerance in integer minor units
  if (diffCents > 1) {
    const formattedItemSum = (netItemSum).toFixed(2)
    const formattedHeader = originalAmount.toFixed(2)
    throw new Error(
      `Invoice line-item total (${formattedItemSum}) does not match originalAmount (${formattedHeader}). ` +
        `Difference: ${(diffCents / 100).toFixed(2)}. Correct the items or the invoice amount.`,
    )
  }
}

export function addInvoice(input: AddInvoiceInput): StoredInvoice {
  if (!input.customerId || !input.customerId.trim()) {
    throw new Error('Customer ID is required for invoice creation.')
  }
  if (!input.customerName || !input.customerName.trim()) {
    throw new Error('Customer name is required for invoice creation.')
  }
  if (!Number.isFinite(input.originalAmount) || input.originalAmount <= 0) {
    throw new Error('Invoice original amount must be a positive number.')
  }

  // Prevent creating invoices for inactive or archived customers
  const customer = customersStore.get().find((c) => c.id === input.customerId.trim())
  if (customer && (customer.deleted_at || customer.status === 'Archived' || customer.active === false)) {
    throw new Error(`Cannot create invoice: Customer ${customer.name} (${input.customerId}) is inactive or archived.`)
  }

  // D-01: validate line-item reconciliation before any store mutation.
  validateLineItemReconciliation(input.originalAmount, input.items, input.discountAmount)

  const currentList = invoicesStore.get()

  // Generate unique invoice number if not provided
  let invoiceNumber = input.invoiceNumber?.trim()
  if (!invoiceNumber) {
    invoiceNumber = generateInvoiceNumber()
  } else {
    // Uniqueness check
    const duplicate = currentList.find(
      (inv) => inv.invoiceNumber === invoiceNumber || inv.id === invoiceNumber,
    )
    if (duplicate) {
      throw new Error(`Invoice number ${invoiceNumber} already exists.`)
    }
  }

  const id = invoiceNumber
  const currency = input.currency || 'EGP'
  const issueDate = input.issueDate || getSystemCurrentDate()

  let dueDate = input.dueDate
  if (!dueDate) {
    const dueObj = new Date(issueDate)
    dueObj.setDate(dueObj.getDate() + 30)
    dueDate = dueObj.toISOString().slice(0, 10)
  }

  // Validate due date >= issue date
  if (new Date(dueDate).getTime() < new Date(issueDate).getTime()) {
    throw new Error('Invoice due date cannot be earlier than issue date.')
  }

  const name = input.name || `${invoiceNumber} · ${input.customerName}`
  const name_ar =
    input.name_ar || (input.customerName_ar ? `${invoiceNumber} · ${input.customerName_ar}` : undefined)

  const itemsCount = input.items?.length || 1
  const meta =
    input.meta || `${itemsCount} items · ${currency} ${input.originalAmount.toLocaleString('en-US')}`
  const meta_ar =
    input.meta_ar ||
    `${itemsCount} أصناف · ${input.originalAmount.toLocaleString('en-US')} ${currency === 'EGP' ? 'ج.م' : currency}`

  const at = now()

  const invoice: StoredInvoice = {
    ...input,
    id,
    invoiceNumber,
    customerId: input.customerId.trim(),
    customerName: input.customerName.trim(),
    originalAmount: Math.round(input.originalAmount * 100) / 100,
    currency,
    issueDate,
    dueDate,
    status: input.status || 'Pending',
    source: input.source || 'Web upload',
    dateRange: input.dateRange || 'Today',
    repName: input.repName || 'Alex Morgan',
    paidAmount: input.paidAmount ?? 0,
    remainingBalance: input.remainingBalance ?? Math.round(input.originalAmount * 100) / 100,
    paymentStatus: input.paymentStatus || (input.paidAmount && input.paidAmount >= input.originalAmount ? 'Paid' : input.paidAmount && input.paidAmount > 0 ? 'Partially Paid' : 'Unpaid'),
    name,
    name_ar,
    meta,
    meta_ar,
    created_at: at,
    updated_at: at,
  }

  invoicesStore.update((list) => [invoice, ...list])

  addAuditLog({
    action: 'Invoice Added',
    actor: invoice.repName || 'User',
    time: 'Just now',
    details: `Added invoice ${invoice.invoiceNumber} (${invoice.originalAmount} ${invoice.currency}) for ${invoice.customerName}`,
  })

  return invoice
}

export function updateInvoice(identifier: string, patch: Partial<StoredInvoice>) {
  invoicesStore.update((list) =>
    list.map((inv) =>
      inv.id === identifier || inv.name === identifier || inv.invoiceNumber === identifier
        ? { ...inv, ...patch, updated_at: now() }
        : inv,
    ),
  )
}

export function getInvoice(identifier: string): StoredInvoice | undefined {
  return invoicesStore
    .get()
    .find((inv) => inv.id === identifier || inv.name === identifier || inv.invoiceNumber === identifier)
}
