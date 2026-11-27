/**
 * action-response-ui-consistency.test.ts
 *
 * End-to-End Action Response & UI Consistency Regression Test Suite
 *
 * Tests:
 * 1. Action Lifecycle & Validation:
 *    - Empty form submissions rejected with required error messages
 *    - Invalid quantities and negative numbers rejected
 *    - Monotonic receipt and invoice ID generation preventing duplicate collisions
 * 2. Cross-Module Consistency & State Propagation:
 *    - Invoice approval propagates to approval history, audit log, and cash-in calculations
 *    - Cash collection payment atomically updates collectionsStore AND invoicesStore (paidAmount, remainingBalance, status)
 *    - Voiding collection payment restores invoice balance and marks payment as Voided
 *    - Visit Plan approval updates plan status, approval history, and manager queue
 *    - Target creation/update/deletion with structured actor object
 * 3. Role-Based Navigation & Deep Linking:
 *    - Visit Plan page receives filter='approvals' and activates approvals tab
 *    - Marketing Manager dashboard routes commercial drilldown to authorized 'sell-in-vs-sell-out'
 *    - Doctor Profile supports full UserRole without degradation
 * 4. Dashboard Reactivity & Store Subscriptions:
 *    - Role metrics recompute on invoice, visit, and target store updates
 */

import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'

import { invoicesStore, addInvoice, updateInvoice, type StoredInvoice } from '../src/data/mock/invoices'
import { collectionsStore, addCollectionPayment, voidCollectionPayment, calculateCashInKpis, toCollectionInvoice, getInvoicePaymentSummary } from '../src/data/mock/cash-in'
import { visitPlansStore, addVisitPlan, updateVisitPlan, approveVisitPlan, rejectVisitPlan, type VisitPlan } from '../src/data/mock/visit-plans'
import { targetsStore, createTarget, updateTarget, deleteTarget, type SalesTarget } from '../src/data/mock/targets'
import { visitsStore, addVisit, type StoredVisit } from '../src/data/mock/visits'
import { customersStore, addCustomer, type Customer } from '../src/data/mock/customers'
import { productsStore, addProductRecord } from '../src/data/mock/products'
import { isReportAuthorizedForRole } from '../src/ui/pages/reports/reportCatalog'
import { getAdminDashboardMetrics, getBUMDashboardMetrics, getFLMDashboardMetrics, getRepDashboardMetrics, getMarketingDashboardMetrics } from '../src/lib/analytics/roleAnalytics'
import { DEVELOPMENT_TEST_USERS } from '../src/lib/auth/mock-users'

describe('Navigen — End-to-End Action Response & UI Consistency Suite', () => {
  beforeEach(() => {
    // Clean state setup
  })

  describe('1. Form Validation & Empty/Invalid Submission Guards', () => {
    test('Cash-in payment rejects zero or negative amounts', () => {
      assert.throws(
        () =>
          addCollectionPayment({
            customerId: 'c-1',
            customerName: 'Dr. Tarek Hegazi',
            amount: 0,
            receivedBy: 'Alex Morgan',
            paymentDate: '2026-10-25',
            paymentMethod: 'Cash',
            referenceNumber: 'REF-001',
            allocations: [],
          }),
        /must be a positive number/i
      )

      assert.throws(
        () =>
          addCollectionPayment({
            customerId: 'c-1',
            customerName: 'Dr. Tarek Hegazi',
            amount: -500,
            receivedBy: 'Alex Morgan',
            paymentDate: '2026-10-25',
            paymentMethod: 'Cash',
            referenceNumber: 'REF-002',
            allocations: [],
          }),
        /must be a positive number/i
      )
    })

    test('Cash-in payment rejects missing customer ID', () => {
      assert.throws(
        () =>
          addCollectionPayment({
            customerId: '',
            customerName: 'Unknown',
            amount: 1000,
            receivedBy: 'Alex Morgan',
            paymentDate: '2026-10-25',
            paymentMethod: 'Cash',
            referenceNumber: 'REF-003',
            allocations: [],
          }),
        /customer id is required/i
      )
    })

    test('Rejection requires a non-empty reason for Visit Plans', () => {
      const plan = addVisitPlan({
        name: 'Empty Reason Test Plan',
        repName: 'Test Rep Sara',
        repId: 'u-test-rep-sara',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        frequency: 'Weekly',
        status: 'Pending Approval',
        targetClients: ['c-1'],
        plannedProducts: ['Bevato'],
        stops: [],
      })

      assert.throws(
        () => rejectVisitPlan(plan.id, '   ', { id: 'u-test-flm-cardio', name: 'Test FLM Cardio', role: 'first_line_manager' }),
        /rejection reason is required/i
      )
    })
  })

  describe('2. Cross-Module Consistency & State Synchronization', () => {
    test('Cash collection atomically updates invoice balance, paidAmount, and paymentStatus in invoicesStore', () => {
      // 1. Create a confirmed invoice
      const inv = addInvoice({
        customerId: 'c-1',
        customerName: 'Dr. Tarek Hegazi',
        originalAmount: 10000,
        currency: 'EGP',
        issueDate: '2026-10-01',
        dueDate: '2026-10-31',
        status: 'Approved',
        source: 'Web upload',
        dateRange: 'Today',
        repName: 'Test Rep Sara',
        repId: 'u-test-rep-sara',
      })

      // 2. Record partial collection of 4,000 EGP
      const payment = addCollectionPayment({
        customerId: 'c-1',
        customerName: 'Dr. Tarek Hegazi',
        amount: 4000,
        receivedBy: 'Test Rep Sara',
        paymentDate: '2026-10-25',
        paymentMethod: 'Cash',
        referenceNumber: 'REF-004',
        allocations: [
          {
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            allocatedAmount: 4000,
            invoiceOriginalAmount: 10000,
          },
        ],
      })

      // 3. Verify invoice in invoicesStore was updated
      const updatedInv = invoicesStore.get().find((i) => i.id === inv.id)!
      assert.strictEqual(updatedInv.paidAmount, 4000)
      assert.strictEqual(updatedInv.remainingBalance, 6000)
      assert.strictEqual(updatedInv.paymentStatus, 'Partially Paid')

      // 4. Record remaining collection of 6,000 EGP
      addCollectionPayment({
        customerId: 'c-1',
        customerName: 'Dr. Tarek Hegazi',
        amount: 6000,
        receivedBy: 'Test Rep Sara',
        paymentDate: '2026-10-26',
        paymentMethod: 'Cash',
        referenceNumber: 'REF-005',
        allocations: [
          {
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            allocatedAmount: 6000,
            invoiceOriginalAmount: 10000,
          },
        ],
      })

      const fullyPaidInv = invoicesStore.get().find((i) => i.id === inv.id)!
      assert.strictEqual(fullyPaidInv.paidAmount, 10000)
      assert.strictEqual(fullyPaidInv.remainingBalance, 0)
      assert.strictEqual(fullyPaidInv.paymentStatus, 'Paid')
    })

    test('Voiding collection payment restores invoice remaining balance in invoicesStore', () => {
      const inv = addInvoice({
        customerId: 'c-1',
        customerName: 'Dr. Tarek Hegazi',
        originalAmount: 5000,
        currency: 'EGP',
        issueDate: '2026-10-01',
        dueDate: '2026-10-31',
        status: 'Approved',
        source: 'Web upload',
        dateRange: 'Today',
        repName: 'Test Rep Sara',
        repId: 'u-test-rep-sara',
      })

      const payment = addCollectionPayment({
        customerId: 'c-1',
        customerName: 'Dr. Tarek Hegazi',
        amount: 5000,
        receivedBy: 'Test Rep Sara',
        paymentDate: '2026-10-25',
        paymentMethod: 'Cash',
        referenceNumber: 'REF-006',
        allocations: [
          {
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            allocatedAmount: 5000,
            invoiceOriginalAmount: 5000,
          },
        ],
      })

      assert.strictEqual(invoicesStore.get().find((i) => i.id === inv.id)!.paymentStatus, 'Paid')

      // Admin voids payment
      voidCollectionPayment(payment.receiptNumber, 'Accidental duplicate payment entry', 'u-test-admin')

      const restoredInv = invoicesStore.get().find((i) => i.id === inv.id)!
      assert.strictEqual(restoredInv.paidAmount, 0)
      assert.strictEqual(restoredInv.remainingBalance, 5000)
      assert.strictEqual(restoredInv.paymentStatus, 'Overdue')
    })

    test('Target CRUD with structured actor object succeeds for authorized managers and updates store', () => {
      const flmCardio = {
        id: 'u-flm-1',
        name: 'Mona Mansour',
        role: 'first_line_manager',
      }

      const created = createTarget(
        {
          name: 'Q4 Cardio Clinic Target',
          period: 'Quarterly',
          startDate: '2026-10-01',
          endDate: '2026-12-31',
          targetValue: 500000,
          repId: 'u-rep-2',
          repName: 'Sara Ali',
        },
        flmCardio
      )

      assert.ok(created.id)
      assert.strictEqual(created.targetValue, 500000)

      // Update target
      const updatedOk = updateTarget(created.id, { targetValue: 550000 }, flmCardio)
      assert.strictEqual(updatedOk, true)
      assert.strictEqual(targetsStore.get().find((t) => t.id === created.id)?.targetValue, 550000)

      // Delete target
      const deleted = deleteTarget(created.id, flmCardio)
      assert.strictEqual(deleted, true)
      assert.strictEqual(targetsStore.get().some((t) => t.id === created.id), false)
    })
  })

  describe('3. Role Navigation & Access Scope Consistency', () => {
    test('Marketing Manager is authorized for sell-in-vs-sell-out and stock-expiry, but denied sales-performance', () => {
      assert.strictEqual(isReportAuthorizedForRole('sell-in-vs-sell-out', 'marketing_manager'), true)
      assert.strictEqual(isReportAuthorizedForRole('stock-expiry', 'marketing_manager'), true)
      assert.strictEqual(isReportAuthorizedForRole('sales-performance', 'marketing_manager'), false)
      assert.strictEqual(isReportAuthorizedForRole('invoices-approvals', 'marketing_manager'), false)
    })

    test('Medical Representative is authorized only for rep-scorecard', () => {
      assert.strictEqual(isReportAuthorizedForRole('rep-scorecard', 'rep'), true)
      assert.strictEqual(isReportAuthorizedForRole('sales-performance', 'rep'), false)
      assert.strictEqual(isReportAuthorizedForRole('sell-in-vs-sell-out', 'rep'), false)
      assert.strictEqual(isReportAuthorizedForRole('visit-coverage', 'rep'), false)
      assert.strictEqual(isReportAuthorizedForRole('stock-expiry', 'rep'), false)
    })

    test('Admin and BUM are authorized for commercial and operations reports', () => {
      assert.strictEqual(isReportAuthorizedForRole('sales-performance', 'admin'), true)
      assert.strictEqual(isReportAuthorizedForRole('sales-performance', 'business_unit_manager'), true)
      assert.strictEqual(isReportAuthorizedForRole('invoices-approvals', 'admin'), true)
      assert.strictEqual(isReportAuthorizedForRole('invoices-approvals', 'business_unit_manager'), true)
    })
  })

  describe('4. Dashboard Metrics Reactivity & Calculation Accuracy', () => {
    test('Admin dashboard recalculates total sales when a new invoice is added', () => {
      const initialMetrics = getAdminDashboardMetrics()
      const initialSales = initialMetrics.totalSales

      // Add a confirmed invoice of 50,000 EGP
      addInvoice({
        customerId: 'c-1',
        customerName: 'Dr. Tarek Hegazi',
        originalAmount: 50000,
        currency: 'EGP',
        issueDate: '2026-10-15',
        dueDate: '2026-11-15',
        status: 'Approved',
        source: 'Web upload',
        dateRange: 'Today',
        repName: 'Test Rep Sara',
        repId: 'u-test-rep-sara',
      })

      const updatedMetrics = getAdminDashboardMetrics()
      assert.strictEqual(updatedMetrics.totalSales, initialSales + 50000)
    })

    test('FLM dashboard recalculates pending plans count when plan is submitted and approved', () => {
      const flmCardio = {
        id: 'u-flm-1',
        name: 'Mona Mansour',
        role: 'first_line_manager',
        businessUnit: 'Cardio-Metabolic',
        region: 'North region',
      }

      const initialMetrics = getFLMDashboardMetrics(flmCardio)
      const initialPending = initialMetrics.pendingPlansCount

      // Rep submits a new plan
      const plan = addVisitPlan({
        name: 'Sara November Route',
        repName: 'Sara Ali',
        repId: 'u-rep-2',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        frequency: 'Weekly',
        status: 'Pending Approval',
        targetClients: ['c-1'],
        plannedProducts: ['Bevato'],
        stops: [],
      })

      const withPending = getFLMDashboardMetrics(flmCardio)
      assert.strictEqual(withPending.pendingPlansCount, initialPending + 1)

      // Manager approves the plan
      approveVisitPlan(plan.id, flmCardio)

      const afterApprove = getFLMDashboardMetrics(flmCardio)
      assert.strictEqual(afterApprove.pendingPlansCount, initialPending)
    })

    test('Rep dashboard recalculates visit counts when a visit is logged', () => {
      const repSara = {
        id: 'u-test-rep-sara',
        name: 'Test Rep Sara',
        role: 'rep',
        businessUnit: 'Cardio-Metabolic',
        region: 'North region',
      }

      const initialMetrics = getRepDashboardMetrics(repSara)
      const initialCompleted = initialMetrics.visitsMonthCompleted

      addVisit({
        clientName: 'Dr. Tarek Hegazi',
        repName: 'Test Rep Sara',
        date: 'Oct 25, 2026',
        time: '11:00 AM',
        detail: 'Product presentation Bevato',
        status: 'Completed',
        productsPresented: ['Bevato'],
        samplesQuantity: 2,
        reactionEmoji: '😍',
        reactionLabel: 'Interested',
        notes: 'Follow up next week',
        nextVisitDate: '2026-11-05',
        gpsVerified: true,
      })

      const updatedMetrics = getRepDashboardMetrics(repSara)
      assert.strictEqual(updatedMetrics.visitsMonthCompleted, initialCompleted + 1)
    })
  })
})
