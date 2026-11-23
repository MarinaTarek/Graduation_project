/**
 * cross-module-consistency.test.ts
 *
 * Phase 3 — Data Integrity & Cross-Module Consistency Test Suite
 *
 * Verifies:
 * 1. Canonical ID & Foreign Key Resolution Across Modules
 * 2. Propagating Customer Updates & Referential Stability
 * 3. Product Catalog Price Updates vs Historical Invoices
 * 4. Referential Integrity on Hard Deletion of Referenced Entities
 * 5. Safe Customer Archiving & Transaction Blocking
 * 6. Warehouse Inventory Guard on Deletion
 * 7. User/Rep Deactivation & Inactive Transaction Guard
 * 8. Visit Completion Propagates to Customer Overdue State
 * 9. Authoritative Dashboard & Reporting Convergence
 * 10. Store Persistence & Cross-Module Hydration
 */

import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'

import { customersStore, addCustomer, updateCustomer, archiveCustomer, hardDeleteCustomer, type Customer } from '../src/data/mock/customers'
import { productsStore, stockProductsStore, addProductRecord, updateProduct, deleteProduct } from '../src/data/mock/products'
import { usersStore, addUser, updateUser, deactivateUser, type StoredAdminUser } from '../src/data/mock/users'
import { warehousesStore, addWarehouse, deleteWarehouse, archiveWarehouse, type Warehouse } from '../src/data/mock/warehouses'
import { salesOrdersStore, addSalesOrder, type SalesOrder } from '../src/data/mock/sales-orders'
import { invoicesStore, addInvoice, type StoredInvoice } from '../src/data/mock/invoices'
import { collectionsStore, addCollectionPayment } from '../src/data/mock/cash-in'
import { visitsStore, addVisit, updateVisitStatus, type StoredVisit } from '../src/data/mock/visits'
import { targetsStore, createTarget, type SalesTarget } from '../src/data/mock/targets'
import { batchesStore, stockMovementsStore, stockReservationsStore, receiveStock } from '../src/data/mock/stockDerived'
import {
  canDeleteCustomer,
  canDeleteProduct,
  canDeleteUser,
  canDeleteWarehouse,
  safeArchiveCustomer,
  safeArchiveProduct,
  safeDeactivateUser,
} from '../src/data/mock/referentialIntegrity'
import {
  getAuthoritativeReceivables,
  getAuthoritativeDashboardKpis,
  getAuthoritativeRepScorecard,
  getAuthoritativeInvoicesApprovalsSummary,
} from '../src/data/mock/reportingAnalytics'
import { createStore } from '../src/data/mock/store'

class MemoryStorage {
  private store = new Map<string, string>()
  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  clear(): void {
    this.store.clear()
  }
  get length(): number {
    return this.store.size
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
}

function enableTestStorage() {
  const memStorage = new MemoryStorage()
  ;(globalThis as any).window = globalThis
  ;(globalThis as any).localStorage = memStorage
  return memStorage
}

function disableTestStorage() {
  delete (globalThis as any).window
  delete (globalThis as any).localStorage
}

describe('Navigen Distribution Suite — Phase 3: Data Integrity & Cross-Module Consistency Suite', () => {
  beforeEach(() => {
    // Reset stores to predictable baseline
    customersStore.set([
      {
        id: 'c-test-1',
        name: 'El Amal Specialized Hospital',
        status: 'Active',
        active: true,
        classification: 'Class A',
        specialty: 'Cardiology',
        region: 'North region',
        repName: 'Olivia Martin',
        rep_id: 'u-rep-olivia',
        meta: 'Cardiology Center',
        last_visit_date: '2026-10-01',
        updated_at: '2026-10-01T00:00:00Z',
        deleted_at: null,
      },
      {
        id: 'c-test-2',
        name: 'Nile Valley Pharmacy',
        status: 'Active',
        active: true,
        classification: 'Class B',
        specialty: 'Pharmacy',
        region: 'West region',
        repName: 'Maya Patel',
        rep_id: 'u-rep-maya',
        meta: 'Chain Pharmacy',
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
        id: 'u-rep-olivia',
        name: 'Olivia Martin',
        email: 'olivia.martin@navigenpharma.net',
        role: 'Medical Representative',
        roleType: 'rep',
        region: 'North region',
        status: 'Active',
      },
      {
        id: 'u-rep-maya',
        name: 'Maya Patel',
        email: 'maya.patel@navigenpharma.net',
        role: 'Medical Representative',
        roleType: 'rep',
        region: 'West region',
        status: 'Active',
      },
      {
        id: 'u-admin-1',
        name: 'Alex Morgan',
        email: 'admin@navigenpharma.net',
        role: 'Admin',
        roleType: 'admin',
        region: 'HQ - Global',
        status: 'Active',
      },
    ])

    warehousesStore.set([
      {
        id: 'wh-cai-01',
        code: 'WH-CAI-01',
        name: 'Cairo Central Logistics Hub',
        name_ar: 'مستودع القاهرة المركزي اللوجستي',
        area: 'Cairo',
        area_ar: 'القاهرة',
        governorate: 'Cairo Governorate',
        governorate_ar: 'محافظة القاهرة',
        assignedRepName: 'Olivia Martin',
        assignedRepId: 'u-rep-olivia',
        status: 'Active',
        capacityUnits: 16000,
        currentStockUnits: 0,
        temperatureType: 'Dual Zone',
        address: 'Zone 4, Badr City',
        address_ar: 'مدينة بدر',
        phone: '+20 2 2849 5500',
        email: 'wh-cairo@navigenpharma.net',
        products: [],
        lastAuditDate: '2026-10-28',
      },
    ])

    salesOrdersStore.set([])
    invoicesStore.set([])
    collectionsStore.set([])
    visitsStore.set([])
    targetsStore.set([])
    batchesStore.set([])
    stockMovementsStore.set([])
    stockReservationsStore.set([])
  })

  // === Test 1: Canonical IDs and Foreign Key Validation ===
  test('1. Canonical ID & Foreign Key Resolution: Orders, Invoices, and Visits link to authoritative entity IDs', () => {
    // Ingest stock so order can be fulfilled
    receiveStock({
      productName: 'Bevato',
      batchNumber: 'BV-CANON-1',
      expiryDate: '2027-12-31',
      quantity: 100,
      warehouseId: 'wh-cai-01',
      actor: 'Test',
    })

    // Create sales order
    const order = addSalesOrder({
      customerId: 'c-test-1',
      repId: 'u-rep-olivia',
      repName: 'Olivia Martin',
      items: [{ productCode: 'PRD-01', quantity: 10 }],
    })

    assert.strictEqual(order.customerId, 'c-test-1', 'Order customerId must match canonical customer ID')
    assert.strictEqual(order.customerName, 'El Amal Specialized Hospital', 'Customer name must resolve from canonical store')
    assert.strictEqual(order.repId, 'u-rep-olivia', 'Order repId must match canonical user ID')
    assert.strictEqual(order.items[0].productCode, 'PRD-01', 'Product code must resolve to canonical product')
    assert.strictEqual(order.items[0].unitPrice, 285, 'Unit price must resolve from productsStore')

    // Record visit
    const visit = addVisit({
      clientName: 'El Amal Specialized Hospital',
      repName: 'Olivia Martin',
      date: '2026-10-25',
      time: '11:00 AM',
      detail: 'Product presentation',
      status: 'Planned',
      productsPresented: ['Bevato'],
      samplesQuantity: 0,
      reactionEmoji: '👍',
      reactionLabel: 'Positive',
      notes: 'Doctor interested in clinical trial results',
      nextVisitDate: '2026-11-10',
      gpsVerified: true,
    })

    assert.strictEqual(visit.clientId, 'c-test-1', 'Visit must automatically resolve canonical clientId from customer name')
    assert.strictEqual(visit.repId, 'u-rep-olivia', 'Visit must automatically resolve canonical repId from rep name')
  })

  // === Test 2: Propagating Customer Updates & Referential Stability ===
  test('2. Propagating Customer Updates: Renaming and reassigning customer updates customer record while preserving historical transactions', () => {
    // Add invoice for customer
    const inv = addInvoice({
      invoiceNumber: 'INV-PROP-01',
      customerId: 'c-test-1',
      customerName: 'El Amal Specialized Hospital',
      originalAmount: 10000,
      repName: 'Olivia Martin',
      status: 'Approved',
      dueDate: '2026-11-30',
      issueDate: '2026-10-20',
      items: [{ productCode: 'PRD-01', productName: 'Bevato', quantity: 10, unitPrice: 1000, total: 10000 }],
    })

    // Update customer name, region, and rep in customersStore
    updateCustomer('c-test-1', {
      name: 'El Amal International Medical Center',
      region: 'Central region',
      repName: 'Maya Patel',
      rep_id: 'u-rep-maya',
    })

    const updatedCustomer = customersStore.get().find((c) => c.id === 'c-test-1')
    assert.strictEqual(updatedCustomer?.name, 'El Amal International Medical Center', 'Customer name must be updated in customersStore')
    assert.strictEqual(updatedCustomer?.rep_id, 'u-rep-maya', 'Assigned rep ID must be updated')

    // Historical invoice check: invoice preserves its original customerId and snapshot rep at time of transaction
    const fetchedInv = invoicesStore.get().find((i) => i.id === inv.id)
    assert.strictEqual(fetchedInv?.customerId, 'c-test-1', 'Invoice customerId remains invariant')
    assert.strictEqual(fetchedInv?.originalAmount, 10000, 'Invoice amount remains intact')
    assert.strictEqual(fetchedInv?.repName, 'Olivia Martin', 'Historical invoice rep snapshot preserved')
  })

  // === Test 3: Product Catalog Price Updates vs Historical Transactions ===
  test('3. Product Price Updates: Updating catalog price alters future orders but leaves existing orders/invoices untouched', () => {
    receiveStock({
      productName: 'Bevato',
      batchNumber: 'BV-PRICE-1',
      expiryDate: '2027-12-31',
      quantity: 200,
      warehouseId: 'wh-cai-01',
      actor: 'Test',
    })

    // Order 1 at 285 EGP
    const order1 = addSalesOrder({
      customerId: 'c-test-1',
      repId: 'u-rep-olivia',
      repName: 'Olivia Martin',
      items: [{ productCode: 'PRD-01', quantity: 5 }],
    })
    assert.strictEqual(order1.items[0].unitPrice, 285, 'Initial order unit price is 285')
    assert.strictEqual(order1.total, 1425, 'Initial order total is 1425')

    // Update product price in catalog to 350 EGP
    updateProduct('PRD-01', { price: 350 }, 'Admin')
    const catalogProduct = productsStore.get().find((p) => p.code === 'PRD-01')
    assert.strictEqual(catalogProduct?.price, 350, 'Catalog price updated to 350')

    // Order 2 at new price 350 EGP
    const order2 = addSalesOrder({
      customerId: 'c-test-1',
      repId: 'u-rep-olivia',
      repName: 'Olivia Martin',
      items: [{ productCode: 'PRD-01', quantity: 5 }],
    })
    assert.strictEqual(order2.items[0].unitPrice, 350, 'New order uses updated catalog price 350')
    assert.strictEqual(order2.total, 1750, 'New order total is 1750')

    // Verify Order 1 is completely unmutated
    const order1Ref = salesOrdersStore.get().find((o) => o.id === order1.id)
    assert.strictEqual(order1Ref?.items[0].unitPrice, 285, 'Historical order unit price preserved at 285')
    assert.strictEqual(order1Ref?.total, 1425, 'Historical order total preserved at 1425')
  })

  // === Test 4: Referential Integrity on Hard Deletion ===
  test('4. Referential Integrity: Hard deletion of customer or product with active transactions is strictly rejected', () => {
    receiveStock({
      productName: 'Bevato',
      batchNumber: 'BV-DEL-1',
      expiryDate: '2027-12-31',
      quantity: 50,
      warehouseId: 'wh-cai-01',
      actor: 'Test',
    })

    addInvoice({
      invoiceNumber: 'INV-REF-01',
      customerId: 'c-test-1',
      customerName: 'El Amal Specialized Hospital',
      originalAmount: 5000,
      repName: 'Olivia Martin',
      status: 'Approved',
      dueDate: '2026-11-30',
      issueDate: '2026-10-20',
      items: [{ productCode: 'PRD-01', productName: 'Bevato', quantity: 5, unitPrice: 1000, total: 5000 }],
    })

    // Attempting to hard-delete referenced customer
    assert.throws(
      () => hardDeleteCustomer('c-test-1'),
      /Cannot hard delete customer/,
      'Must reject hard deletion of customer with active invoices'
    )

    // Attempting to delete referenced product
    assert.throws(
      () => deleteProduct('PRD-01'),
      /Cannot delete product/,
      'Must reject deletion of product referenced in active batches or movements'
    )

    // Referential check for user
    const userCheck = canDeleteUser('u-rep-olivia')
    assert.strictEqual(userCheck.allowed, false, 'User with assigned customers or transactions cannot be deleted')
  })

  // === Test 5: Safe Customer Archiving & Transaction Blocking ===
  test('5. Safe Customer Archiving: Archiving customer preserves historical records but blocks new orders and visits', () => {
    receiveStock({
      productName: 'Bevato',
      batchNumber: 'BV-ARCH-1',
      expiryDate: '2027-12-31',
      quantity: 50,
      warehouseId: 'wh-cai-01',
      actor: 'Test',
    })

    // Add historical invoice
    addInvoice({
      invoiceNumber: 'INV-HIST-01',
      customerId: 'c-test-1',
      customerName: 'El Amal Specialized Hospital',
      originalAmount: 8000,
      repName: 'Olivia Martin',
      status: 'Approved',
      dueDate: '2026-11-30',
      issueDate: '2026-10-20',
      items: [{ productCode: 'PRD-01', productName: 'Bevato', quantity: 8, unitPrice: 1000, total: 8000 }],
    })

    // Archive customer
    archiveCustomer('c-test-1')
    const customer = customersStore.get().find((c) => c.id === 'c-test-1')
    assert.strictEqual(customer?.status, 'Archived')
    assert.strictEqual(customer?.active, false)
    assert.ok(customer?.deleted_at, 'deleted_at must be populated with timestamp')

    // Attempting new sales order must throw
    assert.throws(
      () =>
        addSalesOrder({
          customerId: 'c-test-1',
          repId: 'u-rep-olivia',
          repName: 'Olivia Martin',
          items: [{ productCode: 'PRD-01', quantity: 2 }],
        }),
      /Customer is unavailable/,
      'Cannot create sales order for archived customer'
    )

    // Attempting new visit must throw
    assert.throws(
      () =>
        addVisit({
          clientId: 'c-test-1',
          clientName: 'El Amal Specialized Hospital',
          repName: 'Olivia Martin',
          date: '2026-11-01',
          time: '10:00 AM',
          detail: 'Check-in',
          status: 'Planned',
          productsPresented: ['Bevato'],
          samplesQuantity: 0,
          reactionEmoji: '👍',
          reactionLabel: 'OK',
          notes: 'Test',
          nextVisitDate: '2026-11-15',
          gpsVerified: true,
        }),
      /inactive or archived/,
      'Cannot schedule visit for archived customer'
    )

    // Historical invoice is preserved and remains visible in receivables
    const receivables = getAuthoritativeReceivables()
    const entry = receivables.find((r) => r.customer_id === 'c-test-1')
    assert.strictEqual(entry?.outstanding_amount, 8000, 'Historical invoice remains active in receivables')
  })

  // === Test 6: Warehouse Inventory Guard on Deletion ===
  test('6. Warehouse Deletion Guard: Warehouse with physical inventory cannot be deleted; must be empty or archived', () => {
    // Add stock to warehouse
    receiveStock({
      productName: 'Bevato',
      batchNumber: 'BV-WH-1',
      expiryDate: '2027-12-31',
      quantity: 100,
      warehouseId: 'wh-cai-01',
      actor: 'Test',
    })

    // Attempt to delete warehouse
    assert.throws(
      () => deleteWarehouse('wh-cai-01'),
      /Cannot delete warehouse.*holds 100 physical units/,
      'Cannot delete warehouse holding active inventory'
    )

    // Warehouse can be safely archived (marked Inactive)
    archiveWarehouse('wh-cai-01')
    const wh = warehousesStore.get().find((w) => w.id === 'wh-cai-01')
    assert.strictEqual(wh?.status, 'Inactive', 'Warehouse archived to Inactive status')
  })

  // === Test 7: User/Representative Deactivation Guard ===
  test('7. User Deactivation: Deactivated rep is barred from new transactions while retaining historical integrity', () => {
    receiveStock({
      productName: 'Bevato',
      batchNumber: 'BV-USER-1',
      expiryDate: '2027-12-31',
      quantity: 50,
      warehouseId: 'wh-cai-01',
      actor: 'Test',
    })

    // Deactivate Olivia
    deactivateUser('u-rep-olivia')
    const user = usersStore.get().find((u) => u.id === 'u-rep-olivia')
    assert.strictEqual(user?.status, 'Inactive')

    // Attempt to create sales order with deactivated rep
    assert.throws(
      () =>
        addSalesOrder({
          customerId: 'c-test-2',
          repId: 'u-rep-olivia',
          repName: 'Olivia Martin',
          items: [{ productCode: 'PRD-01', quantity: 2 }],
        }),
      /Representative Olivia Martin is inactive/,
      'Must block creating sales order with deactivated representative'
    )
  })

  // === Test 8: Visit Completion Propagates to Customer Overdue State ===
  test('8. Visit Completion Cross-Propagation: Completing a visit updates customer last_visit_date and resolves overdue state', () => {
    // Customer c-test-2 had last visit in September 2026 (overdue for Class B: 30 days)
    const initialCustomer = customersStore.get().find((c) => c.id === 'c-test-2')
    assert.strictEqual(initialCustomer?.last_visit_date, '2026-09-01')

    // Record and complete a visit today
    const today = new Date().toISOString().split('T')[0]
    const visit = addVisit({
      clientId: 'c-test-2',
      clientName: 'Nile Valley Pharmacy',
      repName: 'Maya Patel',
      date: today,
      time: '02:00 PM',
      detail: 'Vitamin D shelf audit',
      status: 'Completed',
      productsPresented: ['Naviro D3 50,000 IU'],
      samplesQuantity: 0,
      reactionEmoji: '👍',
      reactionLabel: 'Stocked',
      notes: 'Shelf restocked',
      nextVisitDate: '2026-11-20',
      gpsVerified: true,
    })

    // Customer record in customersStore must be automatically updated with today's date
    const updatedCustomer = customersStore.get().find((c) => c.id === 'c-test-2')
    assert.strictEqual(updatedCustomer?.last_visit_date, today, 'Customer last_visit_date must be updated to today on visit completion')
  })

  // === Test 9: Authoritative Dashboard & Reporting Convergence ===
  test('9. Authoritative Dashboard & Reporting Convergence: Dashboard KPIs and Reports match primary store aggregations exactly', () => {
    // Ingest known invoices
    addInvoice({
      invoiceNumber: 'INV-KPI-A',
      customerId: 'c-test-1',
      customerName: 'El Amal Specialized Hospital',
      originalAmount: 20000,
      repName: 'Olivia Martin',
      status: 'Approved',
      dueDate: '2026-10-15', // Overdue
      issueDate: '2026-09-15',
      items: [{ productCode: 'PRD-01', productName: 'Bevato', quantity: 20, unitPrice: 1000, total: 20000 }],
    })

    addInvoice({
      invoiceNumber: 'INV-KPI-B',
      customerId: 'c-test-2',
      customerName: 'Nile Valley Pharmacy',
      originalAmount: 10000,
      repName: 'Maya Patel',
      status: 'Approved',
      dueDate: '2026-11-30', // Not overdue
      issueDate: '2026-10-20',
      items: [{ productCode: 'PRD-02', productName: 'Naviro D3 50,000 IU', quantity: 10, unitPrice: 1000, total: 10000 }],
    })

    // Allocate 5,000 partial payment to INV-KPI-A
    addCollectionPayment({
      customerId: 'c-test-1',
      customerName: 'El Amal Specialized Hospital',
      receiptNumber: 'REC-KPI-1',
      amount: 5000,
      paymentDate: '2026-10-20',
      paymentMethod: 'Cash',
      referenceNumber: 'REF-001',
      receivedBy: 'Alex Morgan',
      allocations: [{ invoiceId: 'INV-KPI-A', invoiceNumber: 'INV-KPI-A', allocatedAmount: 5000, invoiceOriginalAmount: 20000 }],
    })

    // Total outstanding: 15,000 (A) + 10,000 (B) = 25,000
    // Total overdue: 15,000 (A is overdue)
    const kpis = getAuthoritativeDashboardKpis()
    assert.strictEqual(kpis.totalReceivables, 25000, 'totalReceivables must equal exact remaining balances (25,000)')
    assert.strictEqual(kpis.totalOverdue, 15000, 'totalOverdue must equal exact overdue remaining balance (15,000)')

    // Check receivables grouping
    const receivables = getAuthoritativeReceivables()
    const r1 = receivables.find((r) => r.customer_id === 'c-test-1')
    const r2 = receivables.find((r) => r.customer_id === 'c-test-2')
    assert.strictEqual(r1?.outstanding_amount, 15000, 'Customer 1 outstanding balance must be 15,000')
    assert.strictEqual(r1?.overdue_amount, 15000, 'Customer 1 overdue balance must be 15,000')
    assert.strictEqual(r2?.outstanding_amount, 10000, 'Customer 2 outstanding balance must be 10,000')
    assert.strictEqual(r2?.overdue_amount, 0, 'Customer 2 overdue balance must be 0')

    // Check Rep Scorecard
    const scorecard = getAuthoritativeRepScorecard('Olivia Martin')
    assert.strictEqual(scorecard.sales, 20000, 'Rep scorecard sales must aggregate approved invoices for Olivia (20,000)')

    // Check Invoices Approvals summary
    const approvals = getAuthoritativeInvoicesApprovalsSummary()
    assert.strictEqual(approvals.totalCount, 2, 'Total invoices processed must be 2')
    assert.strictEqual(approvals.totalAmount, 30000, 'Total invoiced amount must be 30,000')
  })

  // === Test 10: Store Persistence & Cross-Module Hydration ===
  test('10. Store Persistence & Cross-Module Hydration: Hydrating all stores reproduces identical cross-module relational state', () => {
    const memStorage = enableTestStorage()

    try {
      // Add customer, product, invoice in active state
      addCustomer({
        id: 'c-persist-1',
        name: 'Delta Care Polyclinic',
        status: 'Active',
        classification: 'Class A',
        specialty: 'Cardiology',
        region: 'North region',
        repName: 'Olivia Martin',
        rep_id: 'u-rep-olivia',
        meta: 'Persisted Clinic',
      })

      addInvoice({
        invoiceNumber: 'INV-PERSIST-1',
        customerId: 'c-persist-1',
        customerName: 'Delta Care Polyclinic',
        originalAmount: 12000,
        repName: 'Olivia Martin',
        status: 'Approved',
        dueDate: '2026-11-15',
        issueDate: '2026-10-15',
        items: [{ productCode: 'PRD-01', productName: 'Bevato', quantity: 12, unitPrice: 1000, total: 12000 }],
      })

      // Simulate browser reload by hydrating all stores
      customersStore.hydrate()
      productsStore.hydrate()
      usersStore.hydrate()
      invoicesStore.hydrate()

      // Assert hydrated customer and invoice relationships
      const hydratedCustomer = customersStore.get().find((c) => c.id === 'c-persist-1')
      assert.ok(hydratedCustomer, 'Customer must survive hydration')
      assert.strictEqual(hydratedCustomer?.name, 'Delta Care Polyclinic')

      const hydratedInvoice = invoicesStore.get().find((i) => i.invoiceNumber === 'INV-PERSIST-1')
      assert.ok(hydratedInvoice, 'Invoice must survive hydration')
      assert.strictEqual(hydratedInvoice?.customerId, 'c-persist-1')
      assert.strictEqual(hydratedInvoice?.originalAmount, 12000)

      // Receivables report matches
      const recs = getAuthoritativeReceivables()
      const entry = recs.find((r) => r.customer_id === 'c-persist-1')
      assert.strictEqual(entry?.outstanding_amount, 12000, 'Receivables report reflects hydrated state accurately')
    } finally {
      memStorage.clear()
      disableTestStorage()
    }
  })
})
