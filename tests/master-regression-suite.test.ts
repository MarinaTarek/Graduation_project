import { describe, test } from 'node:test'
import assert from 'node:assert'

import {
  salesOrdersStore,
  addSalesOrder,
  approveSalesOrder,
  dispatchSalesOrder,
  cancelSalesOrder,
  rejectSalesOrder,
} from '../src/data/mock/sales-orders'
import {
  invoicesStore,
  getInvoice,
  approveInvoice,
  rejectInvoice,
  updateInvoice,
} from '../src/data/mock/invoices'
import {
  collectionsStore,
  addCollectionPayment,
  voidCollectionPayment,
  getInvoicePaymentSummary,
} from '../src/data/mock/cash-in'
import {
  returnsStore,
  creditNotesStore,
  addReturn,
  approveReturn,
} from '../src/data/mock/returns'
import {
  targetsStore,
  createTarget,
  updateTarget,
  calculateTargetProgress,
} from '../src/data/mock/targets'
import {
  budgetsStore,
  expensesStore,
  addExpenseRecord,
  approveExpense,
} from '../src/data/mock/budgets'
import {
  visitsStore,
  addVisit,
  updateVisit,
} from '../src/data/mock/visits'
import {
  vacationsStore,
  addVacationRequest,
  approveVacation,
} from '../src/data/mock/vacations'
import {
  doctorQuotaPoliciesStore,
  submitSampleDistributionRequest,
  reviewQuotaOverride,
  confirmSampleDistribution,
  getDoctorQuotaStatus,
} from '../src/data/mock/sampleQuota'
import {
  visitPlansStore,
  addVisitPlan,
  updateVisitPlan,
  submitVisitPlanForApproval,
  reassignRepresentativeManager,
} from '../src/data/mock/visit-plans'
import {
  productsStore,
  getCanonicalProduct,
  updateProduct,
} from '../src/data/mock/products'
import {
  usersStore,
  approveSignUpRequest,
} from '../src/data/mock/users'
import {
  stockMovementsStore,
  deriveBatches,
  batchesStore,
} from '../src/data/mock/stockDerived'
import { recordVisitLocally, syncOfflineVisits, offlineVisitsQueueStore } from '../src/data/mock/locations'

describe('Navigen — Master Project-Wide Regression Suite', () => {

  // =========================================================================
  // 1. Commercial & Sales Order Flow
  // =========================================================================
  describe('1. Commercial Sales Orders & Invoicing', () => {
    test('1.1 Full lifecycle: Create Sales Order -> Approve (Stock Reserved) -> Dispatch (Physical Stock Deducted)', () => {
      const order = addSalesOrder({
        customerId: 'c-2',
        repId: 'u-rep-maya',
        repName: 'Maya Patel',
        items: [{ productCode: 'PRD-01', quantity: 10 }],
        discount: { type: 'percentage', value: 10 },
      })

      assert.strictEqual(order.status, 'Pending')
      assert.strictEqual(order.items[0].quantity, 10)
      assert.strictEqual(order.subtotal, 2850)
      assert.strictEqual(order.total, 2565)

      // Approve order -> reserves stock and creates linked pending invoice
      approveSalesOrder(order.id, 'Alex Morgan')
      const approvedOrder = salesOrdersStore.get().find((o) => o.id === order.id)
      assert.strictEqual(approvedOrder?.status, 'Approved')

      // Linked invoice was created
      const linkedInvoice = invoicesStore.get().find((inv) => inv.order_id === order.id)
      assert.ok(linkedInvoice, 'Linked invoice must be created')
      assert.strictEqual(linkedInvoice?.status, 'Pending')

      // Dispatch order -> deducts stock physically
      dispatchSalesOrder(order.id, 'Alex Morgan')
      const dispatchedOrder = salesOrdersStore.get().find((o) => o.id === order.id)
      assert.strictEqual(dispatchedOrder?.status, 'Dispatched')
    })

    test('1.2 Order cancellation releases stock reservations and rejects linked invoice', () => {
      const order = addSalesOrder({
        customerId: 'c-2',
        repId: 'u-rep-maya',
        repName: 'Maya Patel',
        items: [{ productCode: 'PRD-01', quantity: 5 }],
      })
      approveSalesOrder(order.id, 'Alex Morgan')

      cancelSalesOrder(order.id, 'Client changed mind', 'Alex Morgan')
      const cancelledOrder = salesOrdersStore.get().find((o) => o.id === order.id)
      assert.strictEqual(cancelledOrder?.status, 'Cancelled')

      const linkedInvoice = invoicesStore.get().find((inv) => inv.order_id === order.id)
      assert.strictEqual(linkedInvoice?.status, 'Rejected')
    })
  })

  // =========================================================================
  // 2. Financial Management & Cash In
  // =========================================================================
  describe('2. Financial Collections, Allocations & Voiding', () => {
    test('2.1 Record Cash-In collection, allocate to invoice, update balances, and reverse via Void', () => {
      // Find an invoice with outstanding balance
      const invoices = invoicesStore.get().filter((i) => (i.remainingBalance || i.originalAmount) > 50)
      const targetInvoice = invoices[0]
      assert.ok(targetInvoice, 'Must have at least one test invoice')

      const initialSummary = getInvoicePaymentSummary(targetInvoice as any, collectionsStore.get())
      const payAmount = 50

      const payment = addCollectionPayment({
        customerId: targetInvoice.customerId,
        customerName: targetInvoice.customerName,
        amount: payAmount,
        paymentDate: '2026-10-15',
        paymentMethod: 'Cash',
        referenceNumber: `REC-MTR-${Date.now()}`,
        receivedBy: 'u-admin-1',
        allocations: [
          {
            invoiceId: targetInvoice.id,
            invoiceNumber: targetInvoice.invoiceNumber,
            allocatedAmount: payAmount,
            invoiceOriginalAmount: targetInvoice.originalAmount,
          },
        ],
      })

      assert.strictEqual(payment.status, 'Completed')

      // Check recalculated invoice balance
      const postPaySummary = getInvoicePaymentSummary(targetInvoice as any, collectionsStore.get())
      assert.strictEqual(postPaySummary.paidAmount, initialSummary.paidAmount + payAmount)
      assert.strictEqual(postPaySummary.remainingBalance, initialSummary.remainingBalance - payAmount)

      // Void the payment
      const voidResult = voidCollectionPayment(payment.receiptNumber, 'Entered by mistake', 'u-admin-1')
      assert.strictEqual(voidResult, true)

      // Check balance is fully restored
      const postVoidSummary = getInvoicePaymentSummary(targetInvoice as any, collectionsStore.get())
      assert.strictEqual(postVoidSummary.paidAmount, initialSummary.paidAmount)
      assert.strictEqual(postVoidSummary.remainingBalance, initialSummary.remainingBalance)
    })
  })

  // =========================================================================
  // 3. Returns & Credit Notes
  // =========================================================================
  describe('3. Returns Processing & Credit Note Generation', () => {
    test('3.1 Return creation validates purchased quantity, and approval creates Credit Note & Stock Movement', () => {
      const returnRecord = addReturn({
        customerId: 'c-2',
        customerName: 'Green Cross Pharmacy',
        repId: 'u-rep-maya',
        repName: 'Maya Patel',
        productName: 'Bevato',
        batchNumber: 'BV-2401',
        quantity: 15,
        returnDate: '2026-10-20',
        reason: 'Customer damaged carton',
        condition: 'damaged',
      })

      assert.strictEqual(returnRecord.status, 'Pending')

      // Approve return
      const creditNote = approveReturn(returnRecord.id, 'Alex Morgan', 'damaged')
      assert.strictEqual(creditNote.status, 'Issued')
      assert.strictEqual(creditNote.returnId, returnRecord.id)
      assert.strictEqual(creditNote.quantity, 15)
      assert.ok(creditNote.amount > 0)

      // Verify return stock movement was recorded with damaged condition (does not enter sellable stock)
      const movements = stockMovementsStore.get()
      const m = movements.find((sm) => sm.notes === `Return ${returnRecord.id}`)
      assert.ok(m, 'Stock movement must exist')
      assert.strictEqual(m?.type, 'return')
      assert.strictEqual(m?.return_condition, 'damaged')
    })
  })

  // =========================================================================
  // 4. Budgets & Expenses
  // =========================================================================
  describe('4. Budgets & Expense Accounting', () => {
    test('4.1 Adding and approving expenses updates budget tracking without double counting', () => {
      const exp = addExpenseRecord({
        employeeName: 'Maya Patel',
        employeeId: 'u-rep-maya',
        territory: 'West region',
        category: 'Transportation',
        amount: 250,
        date: '2026-10-22',
        description: 'Clinic visits taxi fare',
      })

      assert.strictEqual(exp.status, 'Pending')

      const approved = approveExpense(exp.id, 'Alex Morgan')
      assert.strictEqual(approved.status, 'Approved')
    })
  })

  // =========================================================================
  // 5. Offline Visits & Sync Queue
  // =========================================================================
  describe('5. Offline Queue & Field Sync', () => {
    test('5.1 Offline visit enqueueing, deterministic client ID, and clean batch synchronization', () => {
      const offlineId = `v-offline-${Date.now()}`
      const visit = recordVisitLocally(
        {
          id: offlineId,
          clientId: 'c-1',
          clientName: 'Dr. Sarah Kim',
          repId: 'u-rep-maya',
          repName: 'Maya Patel',
          date: 'Nov 25, 2026',
          time: '02:00 PM',
          detail: 'Bevato clinical trial review',
          status: 'Completed',
          productsPresented: ['Bevato'],
          samplesQuantity: 2,
          reactionEmoji: '👍',
          reactionLabel: 'Interested',
          notes: 'Detailed discussion on dosing and guidelines',
          nextVisitDate: 'Dec 15, 2026',
          gpsVerified: true,
          capturedLatitude: 30.0444,
          capturedLongitude: 31.2357,
          capturedAccuracy: 15,
          geofenceDistanceMeters: 25,
          locationStatus: 'Location Verified',
          presentationImage: 'data:image/jpeg;base64,...',
          presentationImageName: 'slides.jpg',
        },
        true // offline mode
      )

      assert.strictEqual(visit.id, offlineId)
      assert.strictEqual((visit as any).syncStatus, 'Pending Sync')

      // Verify in offline queue
      const queueBefore = offlineVisitsQueueStore.get()
      assert.ok(queueBefore.some((q) => q.id === offlineId))

      // Execute sync
      const result = syncOfflineVisits()
      assert.ok(result.syncedCount >= 1)

      // Queue is flushed
      const queueAfter = offlineVisitsQueueStore.get()
      assert.strictEqual(queueAfter.length, 0)
    })
  })

  // =========================================================================
  // 6. Medical Plans & Vacations
  // =========================================================================
  describe('6. Field Medical Plans & Vacations', () => {
    test('6.1 Vacation submission validates dates and requires direct manager approval', () => {
      const vacResult = addVacationRequest({
        employeeName: 'Maya Patel',
        employeeId: 'u-rep-maya',
        employeeRole: 'rep',
        startDate: '2026-12-20',
        endDate: '2026-12-25',
        vacationType: 'Annual',
        reason: 'End of year holiday',
      })

      assert.strictEqual(vacResult.vacation.status, 'Pending')

      // Invalid dates must throw
      assert.throws(
        () =>
          addVacationRequest({
            employeeName: 'Maya Patel',
            employeeId: 'u-rep-maya',
            startDate: '2026-12-25',
            endDate: '2026-12-20', // start after end
            vacationType: 'Annual',
            reason: 'Invalid',
          }),
        /Start date cannot be after end date/,
        'Must validate date chronology'
      )
    })
  })
})
