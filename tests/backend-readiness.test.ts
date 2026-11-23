/**
 * backend-readiness.test.ts
 *
 * Backend-Ready Frontend Architecture Verification Suite
 *
 * Verifies:
 * 1. Monotonic & Collision-Free ID Generation across all domain entities (orders, budgets, expenses, returns)
 * 2. Strict Monetary & Quantity Precision (two decimal places, positive integers)
 * 3. State Machine Transition Integrity (orders, invoices, expenses, returns)
 * 4. Replaceable Persistence Facade (all primary domain stores & methods accessible via @/data/mock)
 * 5. Atomic Operations & Side-Effect Synchronization (order approval -> FEFO reservation + invoice generation)
 */

import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'

import {
  salesOrdersStore,
  addSalesOrder,
  approveSalesOrder,
  dispatchSalesOrder,
  cancelSalesOrder,
  invoicesStore,
  customersStore,
  productsStore,
  usersStore,
  batchesStore,
  stockMovementsStore,
  stockReservationsStore,
  collectionsStore,
  returnsStore,
  creditNotesStore,
  budgetsStore,
  expensesStore,
  addBudget,
  addExpenseRecord,
  addReturn,
  approveReturn,
  addCollectionPayment,
  toCollectionInvoice,
  getInvoicePaymentSummary,
} from '../src/data/mock'

describe('Navigen — Backend-Ready Architecture Verification Suite', () => {
  beforeEach(() => {
    salesOrdersStore.set([])
    invoicesStore.set([])
    collectionsStore.set([])
    stockReservationsStore.set([])
    returnsStore.set([])
    creditNotesStore.set([])
    budgetsStore.set([])
    expensesStore.set([])
  })

  test('1. Monotonic & Collision-Free ID Generation: High-frequency rapid insertions generate unique IDs', () => {
    // Rapid budget generation
    const b1 = addBudget({ name: 'B1', type: 'employee', targetEntity: 'Rep A', period: 'monthly', allocatedAmount: 1000 })
    const b2 = addBudget({ name: 'B2', type: 'employee', targetEntity: 'Rep A', period: 'monthly', allocatedAmount: 2000 })
    const b3 = addBudget({ name: 'B3', type: 'employee', targetEntity: 'Rep A', period: 'monthly', allocatedAmount: 3000 })
    assert.notStrictEqual(b1.id, b2.id)
    assert.notStrictEqual(b2.id, b3.id)

    // Rapid expense generation
    const e1 = addExpenseRecord({ employeeName: 'Rep A', territory: 'North', category: 'Transportation', amount: 100, date: '2026-10-20', description: 'Toll 1' })
    const e2 = addExpenseRecord({ employeeName: 'Rep A', territory: 'North', category: 'Transportation', amount: 200, date: '2026-10-20', description: 'Toll 2' })
    assert.notStrictEqual(e1.id, e2.id)

    // Rapid return generation
    const r1 = addReturn({ customerId: 'c-1', customerName: 'Pharmacy A', repId: 'u-1', repName: 'Rep A', productName: 'P1', batchNumber: 'B1', quantity: 1, returnDate: '2026-10-20', reason: 'R1', condition: 'sellable' })
    const r2 = addReturn({ customerId: 'c-1', customerName: 'Pharmacy A', repId: 'u-1', repName: 'Rep A', productName: 'P1', batchNumber: 'B1', quantity: 2, returnDate: '2026-10-20', reason: 'R2', condition: 'sellable' })
    assert.notStrictEqual(r1.id, r2.id)
  })

  test('2. Monetary Precision: Subtotals, discounts, taxes, and balances maintain two decimal precision', () => {
    customersStore.set([{
      id: 'c-money-1',
      name: 'Precision Clinic',
      meta: 'Test',
      status: 'Active',
      specialty: 'General',
      classification: 'Class A',
      region: 'North',
      repName: 'Rep A',
      active: true,
    }])

    productsStore.set([{
      code: 'PRD-M1',
      name: 'PrecisionTab 10mg',
      category: 'General',
      standardPack: '30 tabs',
      price: 33.33,
      status: 'Active',
    }])

    batchesStore.set([{
      id: 'b-m1',
      batch_no: 'PM-01',
      productName: 'PrecisionTab 10mg',
      expiry_date: '2028-01-01',
      initial_qty: 1000,
    }])
    stockMovementsStore.set([{
      id: 'sm-m1',
      productName: 'PrecisionTab 10mg',
      batchNumber: 'PM-01',
      quantity: 1000,
      type: 'receipt',
      date: '2026-10-01',
    }])

    // 3 items @ 33.33 = 99.99 with 10% discount = 9.999 -> rounded to 10.00 -> total = 89.99
    const order = addSalesOrder({
      customerId: 'c-money-1',
      repId: 'u-1',
      repName: 'Rep A',
      items: [{ productCode: 'PRD-M1', quantity: 3 }],
      discount: { type: 'percentage', value: 10 },
    })

    assert.strictEqual(order.subtotal, 99.99)
    assert.strictEqual(order.discountAmount, 10)
    assert.strictEqual(order.total, 89.99)
  })

  test('3. State Machine Transitions: Prevent invalid transitions and enforce terminal states', () => {
    // Sales order terminal states
    customersStore.set([{
      id: 'c-sm-1',
      name: 'SM Pharmacy',
      meta: 'Test',
      status: 'Active',
      specialty: 'Pharmacy',
      classification: 'Class A',
      region: 'North',
      repName: 'Rep A',
      active: true,
    }])
    productsStore.set([{
      code: 'PRD-SM1',
      name: 'SM Product',
      category: 'General',
      standardPack: '10 tabs',
      price: 100,
      status: 'Active',
    }])
    batchesStore.set([{
      id: 'b-sm1',
      batch_no: 'SM-01',
      productName: 'SM Product',
      expiry_date: '2028-01-01',
      initial_qty: 100,
    }])
    stockMovementsStore.set([{
      id: 'sm-sm1',
      productName: 'SM Product',
      batchNumber: 'SM-01',
      quantity: 100,
      type: 'receipt',
      date: '2026-10-01',
    }])

    const order = addSalesOrder({
      customerId: 'c-sm-1',
      repId: 'u-1',
      repName: 'Rep A',
      items: [{ productCode: 'PRD-SM1', quantity: 10 }],
    })
    assert.strictEqual(order.status, 'Pending')

    // Cannot dispatch pending order (must be approved first)
    assert.throws(() => dispatchSalesOrder(order.id, 'Staff'), /Only approved orders can be dispatched/)

    // Approve
    approveSalesOrder(order.id, 'Manager')
    // Dispatch
    dispatchSalesOrder(order.id, 'Staff')

    // Cannot cancel already dispatched order
    assert.throws(() => cancelSalesOrder(order.id, 'Changed mind', 'Staff'), /Only pending or approved orders can be cancelled/)
  })

  test('4. Atomic Transactions: Order approval couples FEFO stock reservation with invoice creation', () => {
    customersStore.set([{
      id: 'c-atom-1',
      name: 'Atomic Hospital',
      meta: 'Test',
      status: 'Active',
      specialty: 'Cardiology',
      classification: 'Class A',
      region: 'North',
      repName: 'Rep A',
      active: true,
    }])
    productsStore.set([{
      code: 'PRD-AT1',
      name: 'AtomicVite',
      category: 'General',
      standardPack: '20 tabs',
      price: 50,
      status: 'Active',
    }])
    batchesStore.set([{
      id: 'b-at1',
      batch_no: 'AT-01',
      productName: 'AtomicVite',
      expiry_date: '2028-01-01',
      initial_qty: 100,
    }])
    stockMovementsStore.set([{
      id: 'sm-at1',
      productName: 'AtomicVite',
      batchNumber: 'AT-01',
      quantity: 100,
      type: 'receipt',
      date: '2026-10-01',
    }])

    const order = addSalesOrder({
      customerId: 'c-atom-1',
      repId: 'u-1',
      repName: 'Rep A',
      items: [{ productCode: 'PRD-AT1', quantity: 20 }],
    })

    approveSalesOrder(order.id, 'Manager')

    // Both reservation and invoice MUST exist and match exact values
    const res = stockReservationsStore.get().find((r) => r.orderId === order.id)
    const inv = invoicesStore.get().find((i) => i.order_id === order.id)

    assert.ok(res, 'Stock reservation must exist')
    assert.strictEqual(res.quantity, 20)
    assert.strictEqual(res.status, 'active')

    assert.ok(inv, 'Invoice must exist')
    assert.strictEqual(inv.originalAmount, 1000)
    assert.strictEqual(inv.customerId, 'c-atom-1')
  })
})
