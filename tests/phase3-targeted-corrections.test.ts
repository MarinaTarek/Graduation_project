/**
 * phase3-targeted-corrections.test.ts
 *
 * Phase 3 — Final Targeted Corrections Regression Test Suite
 *
 * Verifies:
 * 1. Reporting Accuracy (live authoritative connections, legitimate zero results, no mock fallbacks)
 * 2. Customer Archiving (historical records allowed, open orders blocked, new operations blocked, hard delete blocked)
 * 3. User Deactivation and Deletion (referential checks enforced, deactivation preferred, attribution preserved, dual-store consistency)
 * 4. Explicit User Status Mapping (pending, active, rejected, disabled preserved across synchronizations)
 */

import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'

import {
  customersStore,
  addCustomer,
  updateCustomer,
  archiveCustomer,
  hardDeleteCustomer,
  type Customer,
} from '../src/data/mock/customers'
import {
  productsStore,
  addProductRecord,
  updateProduct,
} from '../src/data/mock/products'
import {
  usersStore,
  addUser,
  updateUser,
  deleteUser,
  deactivateUser,
  mapToAuthStatus,
  mapToBusinessStatus,
  type StoredAdminUser,
} from '../src/data/mock/users'
import { storedUsersStore } from '../src/lib/auth/mock-users'
import { salesOrdersStore, addSalesOrder, type SalesOrder } from '../src/data/mock/sales-orders'
import { invoicesStore, addInvoice, type StoredInvoice } from '../src/data/mock/invoices'
import { visitsStore, addVisit, type StoredVisit } from '../src/data/mock/visits'
import { targetsStore, createTarget, type SalesTarget } from '../src/data/mock/targets'
import {
  batchesStore,
  stockMovementsStore,
  stockReservationsStore,
  receiveStock,
  deriveBatches,
} from '../src/data/mock/stockDerived'
import {
  canDeleteCustomer,
  canArchiveCustomer,
  safeArchiveCustomer,
  canDeleteUser,
  safeDeactivateUser,
  ReferentialIntegrityError,
} from '../src/data/mock/referentialIntegrity'
import {
  getAuthoritativeReceivables,
  getAuthoritativeDashboardKpis,
  getAuthoritativeRepScorecard,
  getAuthoritativeInvoicesApprovalsSummary,
  getAuthoritativeSalesPerformance,
  getAuthoritativeVisitCoverage,
  getAuthoritativeSellInOut,
} from '../src/data/mock/reportingAnalytics'

describe('Navigen Distribution Suite — Phase 3: Final Targeted Corrections Suite', () => {
  beforeEach(() => {
    // Reset test stores
    customersStore.set([
      {
        id: 'c-test-1',
        name: 'Cairo University Hospital',
        meta: 'Hospital Center',
        status: 'Active',
        active: true,
        classification: 'Class A',
        specialty: 'Cardiology',
        region: 'Central District',
        repName: 'Alex Morgan',
        rep_id: 'u-admin-1',
        last_visit_date: '2026-10-01',
        updated_at: '2026-10-01T00:00:00Z',
        deleted_at: null,
      },
      {
        id: 'c-test-2',
        name: 'Delta Community Pharmacy',
        meta: 'Community Pharmacy',
        status: 'Active',
        active: true,
        classification: 'Class B',
        specialty: 'Pharmacy',
        region: 'North District',
        repName: 'Maya Patel',
        rep_id: 'u-rep-maya',
        last_visit_date: '2026-09-01',
        updated_at: '2026-09-01T00:00:00Z',
        deleted_at: null,
      },
    ])

    productsStore.set([
      {
        code: 'PRD-01',
        name: 'Bevato',
        category: 'Cardiovascular',
        standardPack: '30 tablets / box',
        status: 'Active',
        price: 285,
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        code: 'PRD-02',
        name: 'Naviro D3 50,000 IU',
        category: 'Vitamin D Supplement',
        standardPack: '20 capsules / box',
        status: 'Active',
        price: 150,
        updated_at: '2026-10-01T00:00:00Z',
      },
    ])

    usersStore.set([
      {
        id: 'u-admin-1',
        name: 'Alex Morgan',
        email: 'alex.morgan@navigenpharma.net',
        role: 'Admin',
        roleType: 'admin',
        region: 'Central District',
        status: 'Active',
      },
      {
        id: 'u-rep-maya',
        name: 'Maya Patel',
        email: 'maya.patel@navigenpharma.net',
        role: 'Medical Representative',
        roleType: 'rep',
        region: 'North District',
        status: 'Active',
      },
      {
        id: 'u-rep-fresh',
        name: 'Fresh Rep Without Activity',
        email: 'fresh.rep@navigenpharma.net',
        role: 'Medical Representative',
        roleType: 'rep',
        region: 'West District',
        status: 'Active',
      },
    ])

    storedUsersStore.set([
      {
        id: 'u-admin-1',
        name: 'Alex Morgan',
        email: 'alex.morgan@navigenpharma.net',
        role: 'admin',
        region: 'Central District',
        status: 'active',
        passwordHash: 'User123!',
      },
      {
        id: 'u-rep-maya',
        name: 'Maya Patel',
        email: 'maya.patel@navigenpharma.net',
        role: 'rep',
        region: 'North District',
        status: 'active',
        passwordHash: 'User123!',
      },
      {
        id: 'u-rep-fresh',
        name: 'Fresh Rep Without Activity',
        email: 'fresh.rep@navigenpharma.net',
        role: 'rep',
        region: 'West District',
        status: 'active',
        passwordHash: 'User123!',
      },
    ])

    invoicesStore.set([])
    salesOrdersStore.set([])
    visitsStore.set([])
    targetsStore.set([])
    batchesStore.set([])
    stockMovementsStore.set([])
    stockReservationsStore.set([])
  })

  // ══════════════════════════════════════════════════════════════════════════
  // 1. REPORTING ACCURACY
  // ══════════════════════════════════════════════════════════════════════════

  test('1. Reporting Accuracy: Live authoritative data connects to Sales Performance without mock fallback', () => {
    // Set target for Maya Patel
    createTarget({
      name: 'Maya North Target',
      repId: 'u-rep-maya',
      repName: 'Maya Patel',
      period: 'Monthly',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      targetValue: 50000,
    })

    // Ingest approved invoice for Maya
    addInvoice({
      invoiceNumber: 'INV-REP-01',
      customerId: 'c-test-2',
      customerName: 'Delta Community Pharmacy',
      originalAmount: 25000,
      repName: 'Maya Patel',
      status: 'Approved',
      dueDate: '2026-11-30',
      issueDate: '2026-10-15',
      items: [{ productCode: 'PRD-01', productName: 'Bevato', quantity: 25, unitPrice: 1000, total: 25000 }],
    })

    const report = getAuthoritativeSalesPerformance({ reps: ['Maya Patel'] })
    assert.strictEqual(report.reps.length, 1)
    const maya = report.reps[0]
    assert.strictEqual(maya.rep, 'Maya Patel')
    assert.strictEqual(maya.actual, 25000)
    assert.strictEqual(maya.target, 50000)
    assert.strictEqual(maya.achievementRate, 50.0)
    assert.strictEqual(maya.topProduct, 'Bevato')
    assert.strictEqual(maya.productBars.length, 1)
    assert.strictEqual(maya.productBars[0].amount, 25000)
  })

  test('2. Reporting Accuracy: Legitimate zero results return exact zero and never fall back to static mock data', () => {
    // Maya Patel has no invoices and no targets
    const report = getAuthoritativeSalesPerformance({ reps: ['Maya Patel'] })
    assert.strictEqual(report.reps.length, 1)
    const maya = report.reps[0]
    assert.strictEqual(maya.actual, 0, 'Actual sales must be 0, not mock value')
    assert.strictEqual(maya.target, 0, 'Target must be 0, not invented mock value')
    assert.strictEqual(maya.achievementRate, 0, 'Achievement must be 0')
    assert.strictEqual(maya.topProduct, 'None')
    assert.strictEqual(maya.productBars.length, 0)

    // Scorecard check for rep with 0 sales
    const scorecard = getAuthoritativeRepScorecard('Maya Patel')
    assert.strictEqual(scorecard.sales, 0, 'Scorecard must return exact 0 sales')
    assert.strictEqual(scorecard.salesTarget, 0, 'Scorecard must return exact 0 target when none set')
    assert.strictEqual(scorecard.targetPct, 0)
    assert.strictEqual(scorecard.visitsLogged, 0)
    assert.strictEqual(scorecard.samplesDistributed, 0)

    // Sell-in vs Sell-out with 0 movements
    const sellReport = getAuthoritativeSellInOut()
    assert.strictEqual(sellReport.summaryStats[0].value, 'EGP 0')
    assert.strictEqual(sellReport.summaryStats[1].value, 'EGP 0')
    assert.strictEqual(sellReport.summaryStats[2].value, '0.0%')
  })

  test('3. Reporting Accuracy: Visit Coverage calculates overdue accounts from cycle intervals and last_visit_date', () => {
    // Customer c-test-1 has last visit Oct 1 (Class A: 20 days interval) -> overdue
    // Add planned visit
    addVisit({
      clientId: 'c-test-1',
      clientName: 'Cairo University Hospital',
      repName: 'Alex Morgan',
      date: '2026-11-01',
      time: '10:00 AM',
      detail: 'Follow up',
      status: 'Completed',
      productsPresented: ['Bevato'],
      samplesQuantity: 0,
      reactionEmoji: '👍',
      reactionLabel: 'Good',
      notes: 'Notes',
      nextVisitDate: '2026-11-20',
      gpsVerified: true,
    })

    const coverage = getAuthoritativeVisitCoverage()
    assert.ok(coverage.repCoverage.length > 0)
    const alexCoverage = coverage.repCoverage.find((r) => r.rep === 'Alex Morgan')
    assert.strictEqual(alexCoverage?.completed, 1, 'Alex Morgan has 1 completed visit')
    assert.strictEqual(alexCoverage?.coveragePct, 100, 'Alex coverage is 100%')

    // c-test-2 (Class B, last visit Sept 1) is overdue
    const overdueC2 = coverage.overdueDoctors.find((d) => d.name === 'Delta Community Pharmacy')
    assert.ok(overdueC2, 'Delta Community Pharmacy must be listed as overdue')
    assert.strictEqual(overdueC2?.targetFrequency, 'Every 30 days')
  })

  // ══════════════════════════════════════════════════════════════════════════
  // 2. CUSTOMER ARCHIVING
  // ══════════════════════════════════════════════════════════════════════════

  test('4. Customer Archiving: Archiving customer with historical invoices and completed orders is allowed', () => {
    // Ingest historical invoice
    addInvoice({
      invoiceNumber: 'INV-HIST-01',
      customerId: 'c-test-1',
      customerName: 'Cairo University Hospital',
      originalAmount: 15000,
      repName: 'Alex Morgan',
      status: 'Paid',
      dueDate: '2026-10-30',
      issueDate: '2026-09-30',
      items: [{ productCode: 'PRD-01', productName: 'Bevato', quantity: 15, unitPrice: 1000, total: 15000 }],
    })

    // Ingest completed (dispatched) order
    salesOrdersStore.set([
      {
        id: 'so-comp-1',
        customerId: 'c-test-1',
        customerName: 'Cairo University Hospital',
        repId: 'u-admin-1',
        repName: 'Alex Morgan',
        items: [{ productCode: 'PRD-01', productName: 'Bevato', quantity: 5, unitPrice: 285, total: 1425 }],
        subtotal: 1425,
        total: 1425,
        status: 'Dispatched',
        createdAt: '2026-09-15T00:00:00Z',
        updatedAt: '2026-09-16T00:00:00Z',
      },
    ])

    // Archiving must succeed
    const check = canArchiveCustomer('c-test-1')
    assert.strictEqual(check.allowed, true, 'Customer with historical records and completed orders can be archived')

    const archived = archiveCustomer('c-test-1')
    assert.strictEqual(archived.status, 'Archived')
    assert.strictEqual(archived.active, false)
    assert.ok(archived.deleted_at)

    // Historical invoice is preserved and remains intact
    const inv = invoicesStore.get().find((i) => i.invoiceNumber === 'INV-HIST-01')
    assert.strictEqual(inv?.customerId, 'c-test-1')
    assert.strictEqual(inv?.originalAmount, 15000)
  })

  test('5. Customer Archiving: Archiving customer with open/in-progress orders is rejected until resolved', () => {
    // Add pending order for c-test-1
    salesOrdersStore.set([
      {
        id: 'so-open-1',
        customerId: 'c-test-1',
        customerName: 'Cairo University Hospital',
        repId: 'u-admin-1',
        repName: 'Alex Morgan',
        items: [{ productCode: 'PRD-01', productName: 'Bevato', quantity: 10, unitPrice: 285, total: 2850 }],
        subtotal: 2850,
        total: 2850,
        status: 'Pending',
        createdAt: '2026-10-20T00:00:00Z',
        updatedAt: '2026-10-20T00:00:00Z',
      },
    ])

    const check = canArchiveCustomer('c-test-1')
    assert.strictEqual(check.allowed, false, 'Archiving must be rejected when open orders exist')
    assert.strictEqual(check.openOrdersCount, 1)

    assert.throws(
      () => safeArchiveCustomer('c-test-1'),
      /Cannot archive customer.*open\/in-progress order/,
      'safeArchiveCustomer must throw when open orders exist'
    )
  })

  test('6. Customer Archiving: Archived customers are blocked from new operational transactions', () => {
    archiveCustomer('c-test-1')

    // Block new sales order
    assert.throws(
      () =>
        addSalesOrder({
          customerId: 'c-test-1',
          repId: 'u-admin-1',
          repName: 'Alex Morgan',
          items: [{ productCode: 'PRD-01', quantity: 2 }],
        }),
      /Customer is unavailable/,
      'Cannot create sales order for archived customer'
    )

    // Block new invoice
    assert.throws(
      () =>
        addInvoice({
          invoiceNumber: 'INV-NEW-ARCH',
          customerId: 'c-test-1',
          customerName: 'Cairo University Hospital',
          originalAmount: 5000,
          repName: 'Alex Morgan',
          status: 'Pending',
          dueDate: '2026-11-30',
          issueDate: '2026-10-25',
          items: [{ productCode: 'PRD-01', productName: 'Bevato', quantity: 5, unitPrice: 1000, total: 5000 }],
        }),
      /Cannot create invoice.*inactive or archived/,
      'Cannot create invoice for archived customer'
    )

    // Block new visit
    assert.throws(
      () =>
        addVisit({
          clientId: 'c-test-1',
          clientName: 'Cairo University Hospital',
          repName: 'Alex Morgan',
          date: '2026-11-01',
          time: '11:00 AM',
          detail: 'Check',
          status: 'Planned',
          productsPresented: ['Bevato'],
          samplesQuantity: 0,
          reactionEmoji: '👍',
          reactionLabel: 'OK',
          notes: 'Test',
          nextVisitDate: '2026-11-20',
          gpsVerified: true,
        }),
      /inactive or archived/,
      'Cannot schedule visit for archived customer'
    )
  })

  test('7. Customer Archiving: Hard deletion of customer with historical references is strictly blocked', () => {
    addInvoice({
      invoiceNumber: 'INV-HIST-HARD',
      customerId: 'c-test-1',
      customerName: 'Cairo University Hospital',
      originalAmount: 10000,
      repName: 'Alex Morgan',
      status: 'Paid',
      dueDate: '2026-10-30',
      issueDate: '2026-09-30',
      items: [{ productCode: 'PRD-01', productName: 'Bevato', quantity: 10, unitPrice: 1000, total: 10000 }],
    })

    const check = canDeleteCustomer('c-test-1')
    assert.strictEqual(check.allowed, false)
    assert.strictEqual(check.references.invoices, 1)

    assert.throws(
      () => hardDeleteCustomer('c-test-1'),
      /Cannot hard delete customer/,
      'Hard deletion must be rejected when historical transactions exist'
    )
  })

  // ══════════════════════════════════════════════════════════════════════════
  // 3. USER DEACTIVATION AND DELETION
  // ══════════════════════════════════════════════════════════════════════════

  test('8. User Deactivation & Deletion: deleteUser() deactivates users with historical activity instead of physical deletion', () => {
    // Maya Patel is assigned to customer c-test-2
    const checkBefore = canDeleteUser('u-rep-maya')
    assert.strictEqual(checkBefore.allowed, false, 'User with assigned customers cannot be physically deleted')

    // Calling deleteUser on Maya Patel
    const result = deleteUser('u-rep-maya', 'Admin')
    assert.strictEqual(result?.deleted, false, 'Physical deletion must not occur')
    assert.strictEqual(result?.deactivated, true, 'User must be safely deactivated instead')

    // Maya Patel still exists in usersStore with Inactive status
    const mayaInStore = usersStore.get().find((u) => u.id === 'u-rep-maya')
    assert.ok(mayaInStore, 'User must remain in usersStore')
    assert.strictEqual(mayaInStore?.status, 'Inactive', 'Business status must be Inactive')

    // Maya Patel in storedUsersStore is synchronized to disabled
    const mayaInAuth = storedUsersStore.get().find((u) => u.id === 'u-rep-maya')
    assert.ok(mayaInAuth, 'User must remain in storedUsersStore')
    assert.strictEqual(mayaInAuth?.status, 'disabled', 'Auth status must be disabled')

    // Historical customer attribution preserved
    const c2 = customersStore.get().find((c) => c.id === 'c-test-2')
    assert.strictEqual(c2?.rep_id, 'u-rep-maya', 'Customer rep_id attribution preserved')
    assert.strictEqual(c2?.repName, 'Maya Patel', 'Customer repName attribution preserved')
  })

  test('9. User Deactivation & Deletion: deleteUser() physically removes users with zero historical activity', () => {
    // u-rep-fresh has zero customers, orders, visits, targets, or movements
    const check = canDeleteUser('u-rep-fresh')
    assert.strictEqual(check.allowed, true, 'User without any activity can be deleted')

    const result = deleteUser('u-rep-fresh', 'Admin')
    assert.strictEqual(result?.deleted, true)
    assert.strictEqual(result?.deactivated, false)

    // User is completely removed from both stores
    assert.strictEqual(usersStore.get().find((u) => u.id === 'u-rep-fresh'), undefined)
    assert.strictEqual(storedUsersStore.get().find((u) => u.id === 'u-rep-fresh'), undefined)
  })

  // ══════════════════════════════════════════════════════════════════════════
  // 4. EXPLICIT USER STATUS MAPPING
  // ══════════════════════════════════════════════════════════════════════════

  test('10. Explicit User Status Mapping: Supported states (pending, active, rejected, disabled) are preserved across synchronizations', () => {
    // Explicit mapping helper verification
    assert.strictEqual(mapToAuthStatus('Active'), 'active')
    assert.strictEqual(mapToAuthStatus('Pending'), 'pending')
    assert.strictEqual(mapToAuthStatus('Rejected'), 'rejected')
    assert.strictEqual(mapToAuthStatus('Disabled'), 'disabled')
    assert.strictEqual(mapToAuthStatus('Inactive'), 'disabled')
    assert.strictEqual(mapToAuthStatus('Archived'), 'disabled')

    assert.strictEqual(mapToBusinessStatus('active'), 'Active')
    assert.strictEqual(mapToBusinessStatus('pending'), 'Pending')
    assert.strictEqual(mapToBusinessStatus('rejected'), 'Rejected')
    assert.strictEqual(mapToBusinessStatus('disabled'), 'Inactive')

    // Add a pending user: must not silently map to disabled
    addUser({
      id: 'u-pending-1',
      name: 'Pending Applicant',
      email: 'pending@navigenpharma.net',
      role: 'Medical Representative',
      roleType: 'rep',
      region: 'Central District',
      status: 'Pending',
    })

    const pendingAuth = storedUsersStore.get().find((u) => u.id === 'u-pending-1')
    assert.strictEqual(pendingAuth?.status, 'pending', 'Pending business status maps explicitly to pending auth status')

    // Add a rejected user: must not silently map to disabled
    addUser({
      id: 'u-rejected-1',
      name: 'Rejected Applicant',
      email: 'rejected@navigenpharma.net',
      role: 'Medical Representative',
      roleType: 'rep',
      region: 'Central District',
      status: 'Rejected',
    })

    const rejectedAuth = storedUsersStore.get().find((u) => u.id === 'u-rejected-1')
    assert.strictEqual(rejectedAuth?.status, 'rejected', 'Rejected business status maps explicitly to rejected auth status')

    // Update user permissions without altering status preserves existing status
    updateUser('u-pending-1', {
      name: 'Pending Applicant Renamed',
    })
    const updatedPendingAuth = storedUsersStore.get().find((u) => u.id === 'u-pending-1')
    assert.strictEqual(updatedPendingAuth?.status, 'pending', 'Updating user preserves auth status without resetting to active or disabled')
    assert.strictEqual(updatedPendingAuth?.name, 'Pending Applicant Renamed')
  })
})
