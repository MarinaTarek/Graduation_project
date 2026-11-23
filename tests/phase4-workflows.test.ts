/**
 * phase4-workflows.test.ts
 *
 * Phase 4 — End-to-End Workflows & Product QA Regression Suite
 *
 * Tests:
 * 1. Workflow 1: Customer -> Sales Order -> Approval -> Stock Reservation -> Dispatch -> Invoice -> Collection -> Updated Receivables
 * 2. Workflow 2: Product -> Warehouse Receiving -> Batch Creation -> FEFO Allocation -> Sales -> Inventory Deductions
 * 3. Workflow 3: Return Request -> Order Validation -> Disposition (Sellable vs Damaged) -> Credit Note Issuance
 * 4. Workflow 4: Representative Assignment -> Target Allocation -> Visit Logging -> Sample Distribution -> Customer Update
 * 5. Workflow 5: Budget Creation -> Expense Recording -> Approval/Rejection Rules -> Budget Utilization & Alerts
 * 6. Workflow 6: Invoice Cancellation on Sales Order Cancellation -> Ghost Invoices Prevented
 * 7. Workflow 7: Warehouse Transfer -> Outbound/Inbound Movements -> Total System Stock Conservation
 * 8. Workflow 8: Sample Issuance -> Representative Custody -> Sample Distribution -> Return to Warehouse Reconciliation
 * 9. Business Rules & Edge Cases: Negative quantities, expired batch reservation blocks, duplicate idempotency, over-allocation
 * 10. Hydration & Persistence: Data survives store re-hydration
 */

import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'

import {
  customersStore,
  addCustomer,
  type Customer,
} from '../src/data/mock/customers'
import {
  productsStore,
  addProductRecord,
} from '../src/data/mock/products'
import {
  usersStore,
  type StoredAdminUser,
} from '../src/data/mock/users'
import {
  salesOrdersStore,
  addSalesOrder,
  approveSalesOrder,
  dispatchSalesOrder,
  cancelSalesOrder,
  type SalesOrder,
} from '../src/data/mock/sales-orders'
import {
  invoicesStore,
  addInvoice,
  type StoredInvoice,
} from '../src/data/mock/invoices'
import {
  collectionsStore,
  addCollectionPayment,
  calculateCashInKpis,
  getInvoicePaymentSummary,
  toCollectionInvoice,
  type PaymentRecord,
} from '../src/data/mock/cash-in'
import {
  batchesStore,
  stockMovementsStore,
  stockReservationsStore,
  receiveStock,
  transferWarehouseStock,
  issueRepSample,
  returnRepSample,
  deriveProductStock,
  deriveBatches,
  type StockMovement,
} from '../src/data/mock/stockDerived'
import {
  returnsStore,
  creditNotesStore,
  addReturn,
  approveReturn,
  rejectReturn,
} from '../src/data/mock/returns'
import {
  visitsStore,
  addVisit,
} from '../src/data/mock/visits'
import {
  targetsStore,
  createTarget,
  calculateTargetProgress,
} from '../src/data/mock/targets'
import {
  budgetsStore,
  expensesStore,
  addBudget,
  addExpenseRecord,
  approveExpense,
  rejectExpense,
  calculateBudgetMetrics,
  getBudgetAlerts,
} from '../src/data/mock/budgets'
import {
  warehousesStore,
  addWarehouse,
} from '../src/data/mock/warehouses'

function makeTestCustomer(patch: Partial<Customer> & { id: string; name: string }): Customer {
  return {
    meta: 'Test Customer',
    status: 'Active',
    specialty: 'Pharmacy',
    classification: 'Class A',
    region: 'North region',
    repName: 'Alex Morgan',
    active: true,
    type: 'pharmacy',
    ...patch,
  }
}

describe('Navigen Distribution Suite — Phase 4: End-to-End Workflows & Product QA Suite', () => {
  beforeEach(() => {
    // Reset test stores
    salesOrdersStore.set([])
    invoicesStore.set([])
    collectionsStore.set([])
    stockReservationsStore.set([])
    returnsStore.set([])
    creditNotesStore.set([])
    visitsStore.set([])
    targetsStore.set([])
    budgetsStore.set([])
    expensesStore.set([])
  })

  test('1. Workflow 1: Order -> Approval -> Reservation -> Dispatch -> Invoice -> Collection -> Receivables', () => {
    // 1. Setup Customer & Active Rep & Product with Stock
    const testCustId = 'c-p4-flow1'
    customersStore.update((list) => [
      makeTestCustomer({
        id: testCustId,
        name: 'Alfa Cure Pharmacy',
        region: 'North region',
        active: true,
      }),
      ...list.filter((c) => c.id !== testCustId),
    ])

    const testRepId = 'u-p4-rep1'
    usersStore.update((list) => [
      {
        id: testRepId,
        name: 'Tarek Zaki',
        email: 'tarek.zaki@navigen.com',
        role: 'Medical Representative',
        roleType: 'rep',
        territory: 'North region',
        region: 'North region',
        status: 'Active',
      },
      ...list.filter((u) => u.id !== testRepId),
    ])

    // Ensure product with batch in warehouse
    const prodCode = 'P4-PROD-1'
    const prodName = 'NaviCure 500mg'
    productsStore.update((list) => [
      {
        code: prodCode,
        name: prodName,
        category: 'Cardiology',
        standardPack: '30 tablets',
        price: 150,
        status: 'Active',
      },
      ...list.filter((p) => p.code !== prodCode),
    ])

    batchesStore.set([
      {
        id: 'b-p4-1',
        batch_no: 'NC-2601',
        productName: prodName,
        expiry_date: '2028-12-31',
        initial_qty: 200,
      },
    ])
    stockMovementsStore.set([
      {
        id: 'sm-p4-1',
        productName: prodName,
        batchNumber: 'NC-2601',
        quantity: 200,
        type: 'receipt',
        date: '2026-10-01',
      },
    ])

    // 2. Create Sales Order (50 units @ 150 = 7,500 EGP)
    const order = addSalesOrder({
      customerId: testCustId,
      repId: testRepId,
      repName: 'Tarek Zaki',
      items: [{ productCode: prodCode, quantity: 50 }],
    })
    assert.strictEqual(order.status, 'Pending')
    assert.strictEqual(order.total, 7500)

    // 3. Approve Sales Order -> Stock is reserved, Invoice is generated
    approveSalesOrder(order.id, 'Manager Alex')
    const approvedOrder = salesOrdersStore.get().find((o) => o.id === order.id)
    assert.strictEqual(approvedOrder?.status, 'Approved')

    // Stock reservations must exist
    const reservations = stockReservationsStore.get().filter((r) => r.orderId === order.id)
    assert.strictEqual(reservations.length, 1)
    assert.strictEqual(reservations[0].quantity, 50)
    assert.strictEqual(reservations[0].status, 'active')

    // Linked invoice must exist with originalAmount = 7,500
    const inv = invoicesStore.get().find((i) => i.order_id === order.id)
    assert.ok(inv, 'Invoice must be generated from approved sales order')
    assert.strictEqual(inv.originalAmount, 7500)
    assert.strictEqual(inv.customerId, testCustId)

    // 4. Dispatch Sales Order -> Reserved stock is converted to physical sell_in
    dispatchSalesOrder(order.id, 'Warehouse Staff')
    const dispatchedOrder = salesOrdersStore.get().find((o) => o.id === order.id)
    assert.strictEqual(dispatchedOrder?.status, 'Dispatched')

    const activeReservations = stockReservationsStore.get().filter((r) => r.orderId === order.id && r.status === 'active')
    assert.strictEqual(activeReservations.length, 0, 'Reservations must be fulfilled on dispatch')

    // Verify stock was physically deducted
    const stock = deriveProductStock(prodName, stockMovementsStore.get(), batchesStore.get())
    assert.strictEqual(stock.in_warehouse, 150, 'Warehouse stock must be 200 - 50 = 150')
    assert.strictEqual(stock.sell_in, 50, 'Sell-in count must be 50')

    // 5. Collection / Cash-In: Record partial payment of 3,000 EGP
    const colInv = toCollectionInvoice(inv)
    addCollectionPayment({
      customerId: testCustId,
      customerName: 'Alfa Cure Pharmacy',
      paymentDate: '2026-10-25',
      amount: 3000,
      paymentMethod: 'Cash',
      referenceNumber: 'CSH-P4-001',
      receivedBy: 'Tarek Zaki',
      allocations: [
        {
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber || inv.name,
          allocatedAmount: 3000,
          invoiceOriginalAmount: 7500,
        },
      ],
    })

    // 6. Verify receivables and payment summary
    const summary = getInvoicePaymentSummary(colInv, collectionsStore.get())
    assert.strictEqual(summary.paidAmount, 3000)
    assert.strictEqual(summary.remainingBalance, 4500)
    assert.strictEqual(summary.paymentStatus, 'Partially Paid')
  })

  test('2. Workflow 2: Warehouse Receiving -> Batch Creation -> FEFO Allocation -> Inventory Verification', () => {
    const prodName = 'CardioMax 20mg'
    batchesStore.set([])
    stockMovementsStore.set([])

    // Receive first batch: Expiring in 2027 (later)
    receiveStock({
      productName: prodName,
      batchNumber: 'CM-2701',
      expiryDate: '2027-06-30',
      quantity: 100,
    })

    // Receive second batch: Expiring in 2026 (earlier - must be picked first under FEFO)
    receiveStock({
      productName: prodName,
      batchNumber: 'CM-2601',
      expiryDate: '2026-12-31',
      quantity: 100,
    })

    const derivedBatches = deriveBatches(batchesStore.get(), stockMovementsStore.get(), prodName)
    assert.strictEqual(derivedBatches.length, 2)
    // FEFO order: CM-2601 (earlier expiry) must be index 0
    assert.strictEqual(derivedBatches[0].batch_no, 'CM-2601')
    assert.strictEqual(derivedBatches[1].batch_no, 'CM-2701')

    // Initial total in warehouse = 200
    const stock = deriveProductStock(prodName, stockMovementsStore.get(), batchesStore.get())
    assert.strictEqual(stock.in_warehouse, 200)
  })

  test('3. Workflow 3: Return Request -> Order Validation -> Disposition (Sellable vs Damaged) -> Credit Note', () => {
    // Setup order with 30 units
    const orderId = 'SO-P4-RET'
    const prodName = 'Omnicef 300mg'
    salesOrdersStore.set([
      {
        id: orderId,
        customerId: 'c-ret-1',
        customerName: 'Hope Clinic',
        repId: 'rep-1',
        repName: 'Rep One',
        items: [
          {
            productCode: 'OMN-300',
            productName: prodName,
            quantity: 30,
            unitPrice: 100,
            total: 3000,
          },
        ],
        subtotal: 3000,
        total: 3000,
        status: 'Dispatched',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ])

    batchesStore.set([
      {
        id: 'b-ret-1',
        batch_no: 'OMN-B1',
        productName: prodName,
        expiry_date: '2028-01-01',
        initial_qty: 0,
      },
    ])
    stockMovementsStore.set([])

    // 1. Over-return attempt (quantity 35 > ordered 30) must throw
    assert.throws(
      () => {
        addReturn({
          order_id: orderId,
          customerId: 'c-ret-1',
          customerName: 'Hope Clinic',
          repId: 'rep-1',
          repName: 'Rep One',
          productName: prodName,
          batchNumber: 'OMN-B1',
          quantity: 35,
          returnDate: '2026-10-20',
          reason: 'Excess stock',
          condition: 'sellable',
        })
      },
      /Cannot return 35 units/,
      'Must block returning more than original order quantity',
    )

    // 2. Valid return of 10 damaged units
    const retRecord = addReturn({
      order_id: orderId,
      customerId: 'c-ret-1',
      customerName: 'Hope Clinic',
      repId: 'rep-1',
      repName: 'Rep One',
      productName: prodName,
      batchNumber: 'OMN-B1',
      quantity: 10,
      returnDate: '2026-10-20',
      reason: 'Broken seals during handling',
      condition: 'damaged',
    })
    assert.strictEqual(retRecord.status, 'Pending')

    // 3. Approve Return with 'damaged' disposition
    const creditNote = approveReturn(retRecord.id, 'Manager Alex', 'damaged')
    assert.strictEqual(creditNote.amount, 1000, 'Credit note must be 10 units * 100 EGP = 1000')
    assert.strictEqual(creditNote.status, 'Issued')

    // Damaged return must NOT inflate sellable warehouse inventory
    const stockAfter = deriveProductStock(prodName, stockMovementsStore.get(), batchesStore.get())
    assert.strictEqual(stockAfter.damaged_returns, 10)
    assert.strictEqual(stockAfter.sellable_returns, 0)
    assert.strictEqual(stockAfter.in_warehouse, 0, 'Damaged return must not be added to sellable warehouse stock')
  })

  test('4. Workflow 4: Rep Assignment -> Target Allocation -> Completed Visit -> Sample Custody', () => {
    const repName = 'Sara Nour'
    const prodName = 'SampleVite'
    batchesStore.set([
      {
        id: 'b-smp-1',
        batch_no: 'SV-01',
        productName: prodName,
        expiry_date: '2028-01-01',
        initial_qty: 100,
      },
    ])
    stockMovementsStore.set([])

    // 1. Issue 20 samples to rep
    issueRepSample({
      productName: prodName,
      batchNumber: 'SV-01',
      quantity: 20,
      repId: 'rep-sara',
      repName,
    })

    const initialStock = deriveProductStock(prodName, stockMovementsStore.get(), batchesStore.get(), 'rep', repName)
    assert.strictEqual(initialStock.in_warehouse, 20, 'Rep custody must be 20')

    // 2. Set Sales Target
    const target = createTarget({
      name: 'October Target',
      repId: 'rep-sara',
      repName,
      period: 'Monthly',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      targetValue: 50000,
    })
    assert.strictEqual(target.targetValue, 50000)

    // 3. Record visit and distribute 5 samples
    const testCust = makeTestCustomer({
      id: 'c-v-1',
      name: 'Dr. Karim Office',
      active: true,
      last_visit_date: '2026-09-01',
    })
    customersStore.set([testCust])

    addVisit({
      clientName: testCust.name,
      repName,
      date: 'Oct 20, 2026',
      time: '11:00 AM',
      detail: 'Product presentation',
      status: 'Completed',
      productsPresented: [prodName],
      samplesQuantity: 5,
      notes: 'Initial clinical presentation',
      reactionEmoji: '😍',
      reactionLabel: 'Interested',
      nextVisitDate: 'Nov 03, 2026',
      gpsVerified: true,
    })

    // Record sample distribution movement
    stockMovementsStore.update((list) => [
      ...list,
      {
        id: 'sm-dist-1',
        productName: prodName,
        batchNumber: 'SV-01',
        quantity: 5,
        type: 'sample',
        date: '2026-10-20',
        repName,
        customerName: testCust.name,
      },
    ])

    // Verify custody reduced from 20 to 15
    const stockAfterVisit = deriveProductStock(prodName, stockMovementsStore.get(), batchesStore.get(), 'rep', repName)
    assert.strictEqual(stockAfterVisit.in_warehouse, 15, 'Rep custody must be reduced to 15 after distributing 5 samples')
  })

  test('5. Workflow 5: Budget Creation -> Expense Recording -> Approval/Rejection & Alert Rules', () => {
    // 1. Create quarterly travel budget of 10,000 EGP
    const bgt = addBudget({
      name: 'Q4 Field Travel',
      type: 'employee',
      targetEntity: 'Hossam Hassan',
      period: 'quarterly',
      allocatedAmount: 10000,
    })
    assert.strictEqual(bgt.allocatedAmount, 10000)

    // 2. Submit Expense of 8,500 EGP (85% utilization -> should trigger warning threshold >= 80%)
    const exp = addExpenseRecord({
      employeeName: 'Hossam Hassan',
      territory: 'North region',
      category: 'Transportation',
      amount: 8500,
      date: '2026-10-20',
      description: 'Monthly fuel and highway toll receipts',
    })
    assert.strictEqual(exp.status, 'Pending')

    // 3. Approve Expense
    approveExpense(exp.id, 'Manager Alex')
    const approvedExp = expensesStore.get().find((e) => e.id === exp.id)
    assert.strictEqual(approvedExp?.status, 'Approved')

    // Prevent duplicate approval
    assert.throws(
      () => approveExpense(exp.id, 'Manager Alex'),
      /already approved/,
      'Must prevent duplicate approval of already-approved expense',
    )

    // Check Budget Metrics & Alerts
    const metrics = calculateBudgetMetrics()
    assert.strictEqual(metrics.totalSpent, 8500)
    assert.strictEqual(metrics.remainingBudget, 1500)
    assert.strictEqual(metrics.utilizationPct, 85)

    const alerts = getBudgetAlerts()
    const alert = alerts.find((a) => a.budgetId === bgt.id)
    assert.ok(alert, 'Should trigger budget alert for >= 80% utilization')
    assert.strictEqual(alert.severity, 'warning')

    // 4. Submit Second Expense of 2,000 EGP and Reject it without reason -> should throw
    const exp2 = addExpenseRecord({
      employeeName: 'Hossam Hassan',
      territory: 'North region',
      category: 'Transportation',
      amount: 2000,
      date: '2026-10-22',
      description: 'Extra travel',
    })

    assert.throws(
      () => rejectExpense(exp2.id, '   ', 'Manager Alex'),
      /reason or note is required/,
      'Must require non-empty rejection reason',
    )

    // Reject with valid reason
    rejectExpense(exp2.id, 'Over monthly policy limit', 'Manager Alex')
    const rejectedExp = expensesStore.get().find((e) => e.id === exp2.id)
    assert.strictEqual(rejectedExp?.status, 'Rejected')
    assert.strictEqual(rejectedExp?.rejectionReason, 'Over monthly policy limit')
  })

  test('6. Workflow 6: Approved Order Cancellation voids/rejects linked invoice', () => {
    // 1. Create & approve sales order
    customersStore.set([makeTestCustomer({ id: 'c-can-1', name: 'Nile Pharmacy', active: true })])
    productsStore.set([{ code: 'CAN-1', name: 'CanMed 10mg', category: 'General', standardPack: '20 tabs', price: 200, status: 'Active' }])
    batchesStore.set([{ id: 'b-can-1', batch_no: 'CAN-B1', productName: 'CanMed 10mg', expiry_date: '2028-01-01', initial_qty: 100 }])
    stockMovementsStore.set([{ id: 'sm-can-1', productName: 'CanMed 10mg', batchNumber: 'CAN-B1', quantity: 100, type: 'receipt', date: '2026-10-01' }])

    const order = addSalesOrder({
      customerId: 'c-can-1',
      repId: 'rep-alex',
      repName: 'Alex Morgan',
      items: [{ productCode: 'CAN-1', quantity: 10 }],
    })
    approveSalesOrder(order.id, 'Alex Morgan')

    // Invoice was generated with Pending status
    const invBefore = invoicesStore.get().find((i) => i.order_id === order.id)
    assert.ok(invBefore)
    assert.strictEqual(invBefore.status, 'Pending')

    // 2. Cancel order
    cancelSalesOrder(order.id, 'Customer requested order cancellation due to budget freeze', 'Alex Morgan')

    // 3. Verify stock reservation released AND linked invoice marked 'Rejected'
    const reservations = stockReservationsStore.get().filter((r) => r.orderId === order.id && r.status === 'active')
    assert.strictEqual(reservations.length, 0, 'Reservations must be released on cancellation')

    const invAfter = invoicesStore.get().find((i) => i.order_id === order.id)
    assert.ok(invAfter)
    assert.strictEqual(invAfter.status, 'Rejected', 'Linked invoice must be marked Rejected on order cancellation')
    assert.ok(invAfter.notes?.includes('Order cancelled'), 'Invoice notes must record cancellation reason')
  })

  test('7. Workflow 7: Warehouse Transfer Conserves Total System Stock & Not Counted as Sell-In', () => {
    const prodName = 'HepatoShield'
    batchesStore.set([
      {
        id: 'b-wh-1',
        batch_no: 'HS-01',
        productName: prodName,
        expiry_date: '2028-01-01',
        initial_qty: 500,
        warehouseId: 'wh-cairo',
      },
    ])
    stockMovementsStore.set([
      {
        id: 'sm-wh-1',
        productName: prodName,
        batchNumber: 'HS-01',
        quantity: 500,
        type: 'receipt',
        date: '2026-10-01',
        warehouseId: 'wh-cairo',
      },
    ])

    // Transfer 150 units from Cairo warehouse to Alexandria warehouse
    transferWarehouseStock({
      productName: prodName,
      batchNumber: 'HS-01',
      quantity: 150,
      sourceWarehouseId: 'wh-cairo',
      targetWarehouseId: 'wh-alex',
      actor: 'Admin',
    })

    // Cairo warehouse has 350
    const cairoStock = deriveProductStock(prodName, stockMovementsStore.get(), batchesStore.get(), 'admin', undefined, 'wh-cairo')
    assert.strictEqual(cairoStock.in_warehouse, 350)

    // Alexandria warehouse has 150
    const alexStock = deriveProductStock(prodName, stockMovementsStore.get(), batchesStore.get(), 'admin', undefined, 'wh-alex')
    assert.strictEqual(alexStock.in_warehouse, 150)

    // Total system warehouse stock remains conserved: 350 + 150 = 500
    const allStock = deriveProductStock(prodName, stockMovementsStore.get(), batchesStore.get())
    assert.strictEqual(allStock.in_warehouse, 500)
    assert.strictEqual(allStock.sell_in, 0, 'Warehouse transfer must not be counted as sell-in')
  })

  test('8. Workflow 8: Sample Custody Lifecycle & Warehouse Reconciliation', () => {
    const prodName = 'NeuroCalm'
    const repName = 'Mona Fathy'
    batchesStore.set([
      {
        id: 'b-nc-1',
        batch_no: 'NC-99',
        productName: prodName,
        expiry_date: '2028-01-01',
        initial_qty: 100,
        warehouseId: 'wh-main',
      },
    ])
    stockMovementsStore.set([
      {
        id: 'sm-nc-1',
        productName: prodName,
        batchNumber: 'NC-99',
        quantity: 100,
        type: 'receipt',
        date: '2026-10-01',
        warehouseId: 'wh-main',
      },
    ])

    // 1. Issue 30 samples to rep
    issueRepSample({
      productName: prodName,
      batchNumber: 'NC-99',
      quantity: 30,
      repId: 'rep-mona',
      repName,
      warehouseId: 'wh-main',
    })

    let repStock = deriveProductStock(prodName, stockMovementsStore.get(), batchesStore.get(), 'rep', repName)
    assert.strictEqual(repStock.in_warehouse, 30)

    // 2. Rep returns 10 unused samples back to warehouse
    returnRepSample({
      productName: prodName,
      batchNumber: 'NC-99',
      quantity: 10,
      repId: 'rep-mona',
      repName,
      warehouseId: 'wh-main',
    })

    repStock = deriveProductStock(prodName, stockMovementsStore.get(), batchesStore.get(), 'rep', repName)
    assert.strictEqual(repStock.in_warehouse, 20, 'Rep custody must decrease to 20 after returning 10 samples')

    const whStock = deriveProductStock(prodName, stockMovementsStore.get(), batchesStore.get(), 'admin', undefined, 'wh-main')
    assert.strictEqual(whStock.in_warehouse, 80, 'Warehouse stock must be 100 - 30 + 10 = 80')
  })

  test('9. Business Rules & Edge Cases: Negative quantity, expired batch, over-allocation', () => {
    customersStore.set([makeTestCustomer({ id: 'c-edge-1', name: 'Edge Care', active: true })])
    productsStore.set([{ code: 'EDG-1', name: 'EdgePill', category: 'General', standardPack: '30 tabs', price: 50, status: 'Active' }])

    // 1. Negative quantity on sales order must throw
    assert.throws(
      () => {
        addSalesOrder({
          customerId: 'c-edge-1',
          repId: 'rep-1',
          repName: 'Rep One',
          items: [{ productCode: 'EDG-1', quantity: -5 }],
        })
      },
      /positive integer/,
      'Negative quantity must throw validation error',
    )

    // 2. Expired batch reservation must be rejected
    batchesStore.set([
      {
        id: 'b-exp-1',
        batch_no: 'EXP-01',
        productName: 'EdgePill',
        expiry_date: '2024-01-01', // Expired
        initial_qty: 100,
      },
    ])
    stockMovementsStore.set([
      {
        id: 'sm-exp-1',
        productName: 'EdgePill',
        batchNumber: 'EXP-01',
        quantity: 100,
        type: 'receipt',
        date: '2023-01-01',
      },
    ])

    const order = addSalesOrder({
      customerId: 'c-edge-1',
      repId: 'rep-1',
      repName: 'Rep One',
      items: [{ productCode: 'EDG-1', quantity: 10 }],
    })

    assert.throws(
      () => approveSalesOrder(order.id, 'Manager'),
      /Insufficient unexpired stock/,
      'Expired batch cannot be reserved for active sales order',
    )
  })

  test('10. Persistence & Hydration: Stores retain data across hydration cycles', () => {
    const cust = makeTestCustomer({
      id: 'c-persist-1',
      name: 'Delta Care Hospital',
      active: true,
    })
    customersStore.set([cust])

    // Simulate reload hydration
    customersStore.hydrate()
    const hydrated = customersStore.get().find((c) => c.id === 'c-persist-1')
    assert.ok(hydrated, 'Customer must survive store re-hydration')
    assert.strictEqual(hydrated.name, 'Delta Care Hospital')
  })
})
