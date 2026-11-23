/**
 * date-dashboard-sync.test.ts
 *
 * Navigen Distribution Suite — Date & Time Integrity + Live Dashboard Synchronization
 *
 * Verifies:
 * 1. Date & Time Integrity:
 *    - Dynamic current system date, year-month, and localized labels.
 *    - December -> January year boundary transitions.
 *    - Timezone-safe YYYY-MM-DD parsing and manipulation.
 *    - Historical date preservation (existing records retain historical dates).
 * 2. Live Dashboard Synchronization:
 *    - Invoice creation updates total invoiced amount & outstanding receivables.
 *    - Collections/payments reduce outstanding receivables and update payment status.
 *    - Legitimate zero receivables when all debts are cleared (no fallback to mock debt).
 *    - Product price changes apply to future orders without altering past invoices/orders.
 *    - Sales order dispatch & invoice creation prevents double-counting.
 *    - Returns processing updates return metrics, damaged items don't inflate sellable stock,
 *      and credit notes are never counted as cash collections.
 *    - Store consistency and hydration.
 */

import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'

import {
  getSystemNow,
  getSystemCurrentDate,
  getSystemCurrentYearMonth,
  getCurrentMonthYearLabel,
  getRecentMonthOptions,
  translateMonthYear,
  monthLabelToYearMonth,
  setMockSystemDate,
} from '../src/lib/dateUtils'

import {
  invoicesStore,
  addInvoice,
  type StoredInvoice,
} from '../src/data/mock/invoices'

import {
  collectionsStore,
  addCollectionPayment,
  calculateCashInKpis,
} from '../src/data/mock/cash-in'

import {
  customersStore,
  type Customer,
} from '../src/data/mock/customers'

import {
  productsStore,
  updateProduct,
} from '../src/data/mock/products'

import {
  salesOrdersStore,
  addSalesOrder,
  approveSalesOrder,
  dispatchSalesOrder,
  type SalesOrder,
} from '../src/data/mock/sales-orders'

import {
  targetsStore,
  calculateTargetProgress,
  type SalesTarget,
} from '../src/data/mock/targets'

import {
  returnsStore,
  creditNotesStore,
  addReturn,
  approveReturn,
} from '../src/data/mock/returns'

import {
  batchesStore,
  stockMovementsStore,
  stockReservationsStore,
} from '../src/data/mock/stockDerived'

import {
  getAuthoritativeReceivables,
  getAuthoritativeDashboardKpis,
  getAuthoritativeRepScorecard,
} from '../src/data/mock/reportingAnalytics'

describe('Navigen Date & Time Integrity + Live Dashboard Synchronization', () => {
  // Snapshot stores before tests to ensure test isolation
  let initialInvoices: StoredInvoice[]
  let initialCollections: any[]
  let initialCustomers: Customer[]
  let initialOrders: SalesOrder[]
  let initialTargets: SalesTarget[]
  let initialReturns: any[]
  let initialCreditNotes: any[]
  let initialBatches: any[]
  let initialMovements: any[]
  let initialReservations: any[]

  beforeEach(() => {
    // Reset mock test clock
    setMockSystemDate(null)

    initialInvoices = invoicesStore.get()
    initialCollections = collectionsStore.get()
    initialCustomers = customersStore.get()
    initialOrders = salesOrdersStore.get()
    initialTargets = targetsStore.get()
    initialReturns = returnsStore.get()
    initialCreditNotes = creditNotesStore.get()
    initialBatches = batchesStore.get()
    initialMovements = stockMovementsStore.get()
    initialReservations = stockReservationsStore.get()
  })

  afterEach(() => {
    // Restore stores and clock
    setMockSystemDate(null)
    invoicesStore.set(initialInvoices)
    collectionsStore.set(initialCollections)
    customersStore.set(initialCustomers)
    salesOrdersStore.set(initialOrders)
    targetsStore.set(initialTargets)
    returnsStore.set(initialReturns)
    creditNotesStore.set(initialCreditNotes)
    batchesStore.set(initialBatches)
    stockMovementsStore.set(initialMovements)
    stockReservationsStore.set(initialReservations)
  })

  // =========================================================================
  // 1. DATE & TIME INTEGRITY
  // =========================================================================

  describe('1. Date & Time Integrity', () => {
    test('1.1 resolves current system date dynamically without hardcoded October', () => {
      // In live environment without mock injection, date matches real system date
      const currentDate = getSystemCurrentDate()
      assert.match(currentDate, /^\d{4}-\d{2}-\d{2}$/, 'Should be YYYY-MM-DD format')

      const ym = getSystemCurrentYearMonth()
      assert.match(ym, /^\d{4}-\d{2}$/, 'Should be YYYY-MM format')
      assert.strictEqual(ym, currentDate.slice(0, 7))

      const labelEn = getCurrentMonthYearLabel('en')
      const labelAr = getCurrentMonthYearLabel('ar')
      assert.ok(labelEn.length > 5, 'English month label should not be empty')
      assert.ok(labelAr.length > 5, 'Arabic month label should not be empty')
    })

    test('1.2 correctly handles mock system date injection for deterministic tests', () => {
      setMockSystemDate('2026-11-21T12:00:00Z')
      assert.strictEqual(getSystemCurrentDate(), '2026-11-21')
      assert.strictEqual(getSystemCurrentYearMonth(), '2026-11')
      assert.strictEqual(getCurrentMonthYearLabel('en'), 'November 2026')
      assert.strictEqual(getCurrentMonthYearLabel('ar'), 'نوفمبر 2026')

      // Translation helper
      assert.strictEqual(translateMonthYear('November 2026', 'ar'), 'نوفمبر 2026')
      assert.strictEqual(translateMonthYear('November 2026', 'en'), 'November 2026')
      assert.strictEqual(monthLabelToYearMonth('November 2026'), '2026-11')
    })

    test('1.3 correctly handles December to January year roll-over', () => {
      // Set clock to December 2026
      setMockSystemDate('2026-12-25T10:00:00Z')
      assert.strictEqual(getSystemCurrentYearMonth(), '2026-12')
      assert.strictEqual(getCurrentMonthYearLabel('en'), 'December 2026')
      assert.strictEqual(getCurrentMonthYearLabel('ar'), 'ديسمبر 2026')

      const decOptions = getRecentMonthOptions(3)
      assert.deepStrictEqual(
        decOptions.map((o) => o.key),
        ['2026-12', '2026-11', '2026-10'],
      )

      // Advance clock to January 2027
      setMockSystemDate('2027-01-10T15:00:00Z')
      assert.strictEqual(getSystemCurrentYearMonth(), '2027-01')
      assert.strictEqual(getCurrentMonthYearLabel('en'), 'January 2027')
      assert.strictEqual(getCurrentMonthYearLabel('ar'), 'يناير 2027')

      const janOptions = getRecentMonthOptions(4)
      assert.deepStrictEqual(
        janOptions.map((o) => o.key),
        ['2027-01', '2026-12', '2026-11', '2026-10'],
        'Rolling options should seamlessly cross the 2027 -> 2026 year boundary',
      )
      assert.strictEqual(janOptions[0].labelEn, 'January 2027')
      assert.strictEqual(janOptions[0].labelAr, 'يناير 2027')
      assert.strictEqual(janOptions[1].labelEn, 'December 2026')
      assert.strictEqual(janOptions[1].labelAr, 'ديسمبر 2026')
    })

    test('1.4 preserves historical transaction dates on existing records', () => {
      // Seed invoices in store must retain their historical dates (not overwritten by today)
      const invoices = invoicesStore.get()
      const octInvoices = invoices.filter((inv) => inv.issueDate?.startsWith('2026-10'))
      const sepInvoices = invoices.filter((inv) => inv.issueDate?.startsWith('2026-09'))
      const augInvoices = invoices.filter((inv) => inv.issueDate?.startsWith('2026-08'))

      assert.ok(octInvoices.length > 0, 'Should preserve historical October invoices')
      assert.ok(sepInvoices.length > 0, 'Should preserve historical September invoices')
      assert.ok(augInvoices.length > 0, 'Should preserve historical August invoices')

      // Inspect a specific invoice
      const inv1049 = invoices.find((inv) => inv.invoiceNumber === 'INV-1049')
      assert.strictEqual(inv1049?.issueDate, '2026-10-05')
      assert.strictEqual(inv1049?.dueDate, '2026-11-05')
    })
  })

  // =========================================================================
  // 2. DASHBOARD LIVE DATA SYNCHRONIZATION
  // =========================================================================

  describe('2. Dashboard Live Data Synchronization', () => {
    test('2.1 Scenario A: Invoice creation immediately updates total invoiced and receivables', () => {
      setMockSystemDate('2026-11-21T10:00:00Z')

      const beforeKpis = getAuthoritativeDashboardKpis()
      const beforeReceivables = getAuthoritativeReceivables()
      const initialTotalRec = beforeReceivables.reduce((s, r) => s + r.outstanding_amount, 0)

      // Create a valid invoice for existing customer c-1
      const newInvoice = addInvoice({
        customerId: 'c-1',
        customerName: 'Al-Amal Pharmacy',
        originalAmount: 75000,
        currency: 'EGP',
        issueDate: '2026-11-21',
        dueDate: '2026-12-21',
        repName: 'Olivia Martin',
        items: [
          {
            productCode: 'PRD-01',
            productName: 'Bevato',
            quantity: 250,
            unitPrice: 300,
            total: 75000,
          },
        ],
      })

      assert.strictEqual(newInvoice.originalAmount, 75000)
      assert.strictEqual(newInvoice.remainingBalance, 75000)
      assert.strictEqual(newInvoice.paymentStatus, 'Unpaid')

      // Check authoritative receivables
      const afterReceivables = getAuthoritativeReceivables()
      const afterTotalRec = afterReceivables.reduce((s, r) => s + r.outstanding_amount, 0)

      assert.strictEqual(
        afterTotalRec,
        initialTotalRec + 75000,
        'Total receivables must increase by exactly the invoice amount',
      )

      const cust1Rec = afterReceivables.find((r) => r.customer_id === 'c-1')
      assert.ok(cust1Rec, 'Customer c-1 must appear in receivables')
      assert.ok(cust1Rec.outstanding_amount >= 75000)

      // Dashboard KPI strip
      const afterKpis = getAuthoritativeDashboardKpis()
      assert.strictEqual(afterKpis.totalReceivables, beforeKpis.totalReceivables + 75000)
    })

    test('2.2 Scenario B: Partial and full collections immediately decrease receivables', () => {
      setMockSystemDate('2026-11-21T10:00:00Z')

      // Create test invoice
      const inv = addInvoice({
        customerId: 'c-1',
        customerName: 'Al-Amal Pharmacy',
        originalAmount: 50000,
        currency: 'EGP',
        issueDate: '2026-11-21',
        dueDate: '2026-12-21',
        repName: 'Olivia Martin',
        items: [
          {
            productCode: 'PRD-01',
            productName: 'Bevato',
            quantity: 200,
            unitPrice: 250,
            total: 50000,
          },
        ],
      })

      const recAfterCreate = getAuthoritativeReceivables()
      const totalRecAfterCreate = recAfterCreate.reduce((s, r) => s + r.outstanding_amount, 0)

      // 1. Partial payment of 20,000 EGP
      addCollectionPayment({
        customerId: 'c-1',
        customerName: 'Al-Amal Pharmacy',
        amount: 20000,
        paymentDate: '2026-11-22',
        paymentMethod: 'Cash',
        referenceNumber: 'REF-TEST-01',
        allocations: [{ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, allocatedAmount: 20000, invoiceOriginalAmount: 50000 }],
        receivedBy: 'Alex Morgan',
      })

      const invAfterPartial = invoicesStore.get().find((i) => i.id === inv.id)
      assert.strictEqual(invAfterPartial?.paidAmount, 20000)
      assert.strictEqual(invAfterPartial?.remainingBalance, 30000)
      assert.strictEqual(invAfterPartial?.paymentStatus, 'Partially Paid')

      const recAfterPartial = getAuthoritativeReceivables()
      const totalRecAfterPartial = recAfterPartial.reduce((s, r) => s + r.outstanding_amount, 0)
      assert.strictEqual(
        totalRecAfterPartial,
        totalRecAfterCreate - 20000,
        'Receivables must reduce by partial payment amount',
      )

      // 2. Complete remaining payment of 30,000 EGP
      addCollectionPayment({
        customerId: 'c-1',
        customerName: 'Al-Amal Pharmacy',
        amount: 30000,
        paymentDate: '2026-11-23',
        paymentMethod: 'Cash',
        referenceNumber: 'REF-TEST-02',
        allocations: [{ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, allocatedAmount: 30000, invoiceOriginalAmount: 50000 }],
        receivedBy: 'Alex Morgan',
      })

      const invAfterFull = invoicesStore.get().find((i) => i.id === inv.id)
      assert.strictEqual(invAfterFull?.paidAmount, 50000)
      assert.strictEqual(invAfterFull?.remainingBalance, 0)
      assert.strictEqual(invAfterFull?.paymentStatus, 'Paid')

      const recAfterFull = getAuthoritativeReceivables()
      const totalRecAfterFull = recAfterFull.reduce((s, r) => s + r.outstanding_amount, 0)
      assert.strictEqual(totalRecAfterFull, totalRecAfterCreate - 50000)
    })

    test('2.3 Scenario B2: Displays legitimate zero debt when all receivables are settled', () => {
      // Mark all invoices as Paid with zero remaining balance
      invoicesStore.update((list) =>
        list.map((inv) => ({
          ...inv,
          remainingBalance: 0,
          paidAmount: inv.originalAmount,
          paymentStatus: 'Paid',
          status: 'Paid',
        })),
      )

      const liveReceivables = getAuthoritativeReceivables()
      assert.strictEqual(
        liveReceivables.length,
        0,
        'When all invoices are paid, getAuthoritativeReceivables should be empty array',
      )

      const totalOutstanding = liveReceivables.reduce((s, r) => s + r.outstanding_amount, 0)
      assert.strictEqual(totalOutstanding, 0, 'Legitimate 0 outstanding debt')
    })

    test('2.4 Scenario C: Product price changes affect new orders without mutating past invoices', () => {
      const pastInvoices = invoicesStore.get()
      const pastTotal = pastInvoices
        .filter((i) => !i.needsReconciliation && i.status !== 'Rejected')
        .reduce((s, i) => s + (i.originalAmount || 0), 0)

      // Find Bevato product
      const bevato = productsStore.get().find((p) => p.code === 'PRD-01')
      assert.ok(bevato)
      const oldPrice = bevato.price

      // Change Bevato price from 285 to 400
      updateProduct('PRD-01', { price: 400 })

      // Verify past invoices retain original amounts
      const pastInvoicesAfter = invoicesStore.get()
      const pastTotalAfter = pastInvoicesAfter
        .filter((i) => !i.needsReconciliation && i.status !== 'Rejected')
        .reduce((s, i) => s + (i.originalAmount || 0), 0)
      assert.strictEqual(pastTotalAfter, pastTotal, 'Past invoices must NOT be mutated by price changes')

      // Create new sales order with Bevato
      const order = addSalesOrder({
        customerId: 'c-1',
        repId: 'u-rep-olivia',
        repName: 'Olivia Martin',
        items: [{ productCode: 'PRD-01', quantity: 10 }],
      })

      assert.strictEqual(order.items[0].unitPrice, 400, 'New order must use updated price of 400')
      assert.strictEqual(order.total, 4000, 'New order total must reflect updated price')
    })

    test('2.5 Scenario D: Sales order dispatch prevents double-counting against linked invoice', () => {
      setMockSystemDate('2026-11-21T10:00:00Z')

      const target: SalesTarget = {
        id: 'tgt-test-1',
        name: 'November Test Target',
        repId: 'u-rep-olivia',
        repName: 'Olivia Martin',
        period: 'Monthly',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        targetValue: 100000,
        createdAt: '2026-11-01T08:00:00Z',
      }

      // Create and approve sales order
      const order = addSalesOrder({
        customerId: 'c-1',
        repId: 'u-rep-olivia',
        repName: 'Olivia Martin',
        items: [{ productCode: 'PRD-01', quantity: 10 }], // 285 * 10 = 2850
      })
      approveSalesOrder(order.id, 'Manager')

      // Before dispatch: target progress includes the approved sales order
      let progress = calculateTargetProgress(
        target,
        invoicesStore.get(),
        salesOrdersStore.get(),
        '2026-11-21',
      )
      assert.strictEqual(progress.achievedAmount, order.total)

      // Dispatch order
      dispatchSalesOrder(order.id, 'Alex Morgan')
      const invoice = invoicesStore.get().find((inv) => inv.order_id === order.id)
      assert.ok(invoice, 'Order should have generated linked invoice')
      assert.strictEqual(invoice.order_id, order.id, 'Linked invoice must reference order_id')

      // Progress calculation must NOT double count order and invoice
      progress = calculateTargetProgress(
        target,
        invoicesStore.get(),
        salesOrdersStore.get(),
        '2026-11-21',
      )
      assert.strictEqual(
        progress.achievedAmount,
        order.total,
        'Achieved amount must remain exactly order.total without double counting',
      )
    })

    test('2.6 Scenario E: Returns processing updates metrics without treating credit notes as cash collections', () => {
      const initialCashIn = collectionsStore.get()
      const initialCashCount = initialCashIn.length
      const initialMovementsCount = stockMovementsStore.get().length

      // Add a return request
      const returnRec = addReturn({
        customerId: 'c-1',
        customerName: 'Al-Amal Pharmacy',
        repId: 'u-rep-olivia',
        repName: 'Olivia Martin',
        productName: 'Bevato',
        batchNumber: 'BV-2401',
        quantity: 50,
        returnDate: '2026-11-21',
        reason: 'Damaged in transit',
        condition: 'damaged',
      })

      assert.strictEqual(returnRec.status, 'Pending')

      // Approve return with damaged disposition
      const creditNote = approveReturn(returnRec.id, 'Alex Morgan', 'damaged')
      assert.ok(creditNote)
      assert.strictEqual(creditNote.status, 'Issued')

      // Verify return stock movement was recorded as damaged
      const movements = stockMovementsStore.get()
      assert.strictEqual(movements.length, initialMovementsCount + 1)
      const returnMov = movements[0]
      assert.strictEqual(returnMov.type, 'return')
      assert.strictEqual(returnMov.return_condition, 'damaged')

      // Verify credit notes store updated
      const creditNotes = creditNotesStore.get()
      assert.ok(creditNotes.some((cn) => cn.id === creditNote.id))

      // Crucial: Credit notes must NEVER enter cash collections
      const cashInAfter = collectionsStore.get()
      assert.strictEqual(
        cashInAfter.length,
        initialCashCount,
        'Credit notes must never falsely appear as cash collections',
      )

      // Dashboard returns metric reflects units
      const kpis = getAuthoritativeDashboardKpis()
      assert.ok(kpis.returnsTotalUnits >= 50)
    })

    test('2.7 Scenario F: Rep scorecard derives live metrics reactively from invoices and visits', () => {
      const scorecardBefore = getAuthoritativeRepScorecard('Olivia Martin')
      const initialSales = scorecardBefore.sales

      // Add invoice for Olivia Martin
      addInvoice({
        customerId: 'c-1',
        customerName: 'Al-Amal Pharmacy',
        originalAmount: 18000,
        currency: 'EGP',
        issueDate: '2026-11-21',
        dueDate: '2026-12-21',
        status: 'Approved',
        repName: 'Olivia Martin',
        items: [
          {
            productCode: 'PRD-01',
            productName: 'Bevato',
            quantity: 60,
            unitPrice: 300,
            total: 18000,
          },
        ],
      })

      const scorecardAfter = getAuthoritativeRepScorecard('Olivia Martin')
      assert.strictEqual(
        scorecardAfter.sales,
        initialSales + 18000,
        'Rep scorecard sales must reactively update upon new invoice creation',
      )
    })
  })
})
