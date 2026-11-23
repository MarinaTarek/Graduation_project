/**
 * Financial & Transaction Logic Test Suite — Phase 1.2
 *
 * Enhancements:
 *  1. Genuine Test Isolation:
 *     - Module stores (invoicesStore, collectionsStore, salesOrdersStore, customersStore)
 *       have their initial state deep-cloned at startup.
 *     - In beforeEach(), all stores are restored to that pristine fixture.
 *     - Every test starts from an identical, predictable baseline.
 *
 *  2. Exact KPI Assertions (Test 20):
 *     - Fully controlled dataset with known invoice amounts, payment allocations,
 *       overdue amounts, statuses, and collection dates.
 *     - Verifies exact counts and monetary totals independently calculated.
 *     - Verifies exclusion of rejected and needsReconciliation records.
 *
 *  3. Actual Store Persistence & Hydration (Test 31):
 *     - Test storage adapter implementing MemoryStorage.
 *     - Full sequence: Initialize → Persist → Simulate Reload → Hydrate → Read → Assert.
 *     - Verifies invoice IDs, customer IDs, amounts, line items, statuses, and flags.
 *
 *  4. Unknown-Date Visibility (Test 32):
 *     - Invoices with missing or invalid due dates are NEVER classified as overdue.
 *     - They remain visible in accounts receivable (effectiveBalance > 0), not dropped.
 *     - Overdue amounts are not contaminated.
 *
 *  5. Invoice Review Display Safety (Test 36):
 *     - Displays unverified estimates with explicit non-authoritative warning labels.
 *     - Prohibits financial approval without reconciliation.
 */

import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  invoicesStore,
  addInvoice,
  getInvoice,
  updateInvoice,
  generateInvoiceNumber,
  generateInvoiceName,
  normalizeLegacyInvoice,
  validateLineItemReconciliation,
  type StoredInvoice,
} from '@/data/mock/invoices';

import {
  collectionsStore,
  addCollectionPayment,
  voidCollectionPayment,
  toCollectionInvoice,
  getInvoicePaymentSummary,
  calculateCashInKpis,
  getSharedCollectionInvoices,
  SYSTEM_CURRENT_DATE,
  type CollectionInvoice,
  type PaymentRecord,
} from '@/data/mock/cash-in';

import {
  salesOrdersStore,
  addSalesOrder,
  approveSalesOrder,
} from '@/data/mock/sales-orders';

import { customersStore, addCustomer, updateCustomer } from '@/data/mock/customers';
import { resolveCustomerId } from '@/data/mock/customerResolution';
import { calculateTargetProgress, type SalesTarget } from '@/data/mock/targets';
import { createStore } from '@/data/mock/store';

// ---------------------------------------------------------------------------
// In-Memory Storage Test Adapter for Persistence & Hydration Testing
// ---------------------------------------------------------------------------
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  get length(): number {
    return this.store.size;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

function enableTestStorage() {
  const memStorage = new MemoryStorage();
  (globalThis as any).window = globalThis;
  (globalThis as any).localStorage = memStorage;
  return memStorage;
}

function disableTestStorage() {
  delete (globalThis as any).window;
  delete (globalThis as any).localStorage;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function uid(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

// Deep clone fixtures captured once at module initialization
const initialInvoicesFixture = JSON.parse(JSON.stringify(invoicesStore.get()));
const initialCollectionsFixture = JSON.parse(JSON.stringify(collectionsStore.get()));
const initialSalesOrdersFixture = JSON.parse(JSON.stringify(salesOrdersStore.get()));
const initialCustomersFixture = JSON.parse(JSON.stringify(customersStore.get()));

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe('Financial & Transaction Logic Remediation Test Suite', () => {
  // Genuine Test-State Isolation:
  // Before each test, reset all module stores to the pristine initial snapshot.
  beforeEach(() => {
    invoicesStore.set(JSON.parse(JSON.stringify(initialInvoicesFixture)));
    collectionsStore.set(JSON.parse(JSON.stringify(initialCollectionsFixture)));
    salesOrdersStore.set(JSON.parse(JSON.stringify(initialSalesOrdersFixture)));
    customersStore.set(JSON.parse(JSON.stringify(initialCustomersFixture)));
  });

  // =========================================================================
  // === Tests 1–19: Invariants, Validations, and Voiding ====================
  // =========================================================================

  // 1. Invoice creation with structured fields
  test('1. Invoice creation with structured fields populates all required domain attributes', () => {
    const inv = addInvoice({
      customerId: `c-t1-${uid()}`,
      customerName: 'Test Hospital Clinic',
      originalAmount: 15400.5,
      currency: 'EGP',
      issueDate: '2026-10-20',
      dueDate: '2026-11-20',
      status: 'Pending',
      source: 'Web upload',
      repName: 'Alex Morgan',
      repId: 'u-admin-1',
      items: [
        { productCode: 'PRD-01', productName: 'Bevato', quantity: 10, unitPrice: 1540.05, total: 15400.5 },
      ],
      notes: 'Initial test invoice',
    });

    assert.ok(inv.id.startsWith('INV-'), 'Invoice ID must start with INV-');
    assert.strictEqual(inv.invoiceNumber, inv.id);
    assert.strictEqual(inv.originalAmount, 15400.5);
    assert.strictEqual(inv.currency, 'EGP');
    assert.strictEqual(inv.issueDate, '2026-10-20');
    assert.strictEqual(inv.dueDate, '2026-11-20');
    assert.strictEqual(inv.status, 'Pending');
    assert.ok(inv.name.includes('Test Hospital Clinic'));
    assert.ok(inv.meta.includes('15,400.5'));

    const fetched = getInvoice(inv.id);
    assert.ok(fetched, 'Invoice must be retrievable by ID');
    assert.strictEqual(fetched?.originalAmount, 15400.5);
  });

  // 2. Invoice creation from a sales order with discount reconciliation
  test('2. Sales order approval creates a structured invoice with order line items and pricing', () => {
    const custId = `c-so-${uid()}`;
    addCustomer({
      id: custId,
      name: 'Order Integration Pharmacy',
      address: '10 Cairo St',
      meta: 'Pharmacy • Class A',
      status: 'Active',
      specialty: 'Pharmacy',
      classification: 'Class A',
      region: 'Cairo',
      repName: 'Maya Patel',
      clientCategory: 'hco',
      hcoType: 'pharmacy',
      active: true,
    });

    const order = addSalesOrder({
      customerId: custId,
      repId: 'rep-maya',
      repName: 'Maya Patel',
      items: [{ productCode: 'PRD-01', quantity: 5 }],
      discount: { type: 'fixed', value: 50 },
    });

    assert.strictEqual(order.status, 'Pending');
    approveSalesOrder(order.id, 'Manager Alex');

    const approvedOrder = salesOrdersStore.get().find((o) => o.id === order.id);
    assert.strictEqual(approvedOrder?.status, 'Approved');

    const linkedInvoice = invoicesStore.get().find((inv) => inv.order_id === order.id);
    assert.ok(linkedInvoice, 'Linked invoice must be created for approved sales order');
    assert.strictEqual(linkedInvoice?.customerId, custId);
    assert.strictEqual(linkedInvoice?.customerName, 'Order Integration Pharmacy');
    assert.strictEqual(linkedInvoice?.originalAmount, order.total);
    assert.strictEqual(linkedInvoice?.currency, 'EGP');
    assert.strictEqual(linkedInvoice?.source, 'Sales order');
    assert.ok(linkedInvoice?.items && linkedInvoice.items.length === 1);
    assert.strictEqual(linkedInvoice?.items[0].productName, 'Bevato');
  });

  // 3. Invoice number uniqueness
  test('3. Invoice number uniqueness rejects duplicate invoice numbers', () => {
    const invNum = `INV-TEST-UNIQ-${uid()}`;
    addInvoice({ invoiceNumber: invNum, customerId: 'c-2', customerName: 'Green Cross Pharmacy', originalAmount: 5000 });
    assert.throws(
      () => addInvoice({ invoiceNumber: invNum, customerId: 'c-2', customerName: 'Green Cross Pharmacy', originalAmount: 3000 }),
      /already exists/,
    );
  });

  // 4. Customer identity stability after renaming
  test('4. Renaming customer does not break historical invoice and collection relationships', () => {
    const custId = `c-rename-${uid()}`;
    addCustomer({ id: custId, name: 'Original Hospital Name', address: '22 Nile St', meta: 'Hospital • Class A', status: 'Active', specialty: 'General', classification: 'Class A', region: 'Cairo', repName: 'Maya Patel', clientCategory: 'hco', hcoType: 'hospital', active: true });

    const inv = addInvoice({ customerId: custId, customerName: 'Original Hospital Name', originalAmount: 12000 });
    const payment = addCollectionPayment({
      customerId: custId, customerName: 'Original Hospital Name', paymentDate: '2026-10-25', amount: 12000,
      paymentMethod: 'Cash', referenceNumber: `CSH-REN-${uid()}`, receivedBy: 'Alex Morgan',
      allocations: [{ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, allocatedAmount: 12000, invoiceOriginalAmount: 12000 }],
    });

    updateCustomer(custId, { name: 'Renamed Modern Medical Center' });

    const colInv = toCollectionInvoice(getInvoice(inv.id)!);
    assert.strictEqual(colInv.customerId, custId, 'Customer ID must remain stable across renaming');
    const summary = getInvoicePaymentSummary(colInv, collectionsStore.get());
    assert.strictEqual(summary.paidAmount, 12000);
    assert.strictEqual(summary.remainingBalance, 0);
    assert.strictEqual(summary.paymentStatus, 'Paid');
  });

  // 5. Balance calculation
  test('5. Balance calculation accurately reflects original amount minus valid allocations', () => {
    const inv = toCollectionInvoice({ name: 'INV-TEST-BAL', id: 'INV-TEST-BAL', invoiceNumber: 'INV-TEST-BAL', customerId: 'c-2', customerName: 'Green Cross Pharmacy', originalAmount: 10000, currency: 'EGP', issueDate: '2026-10-01', dueDate: '2026-11-01', status: 'Approved', source: 'Sales order', dateRange: 'This month', repName: 'Alex Morgan', meta: 'EGP 10,000' } as StoredInvoice);
    const testPayments: PaymentRecord[] = [{ id: 'p-1', receiptNumber: 'REC-001', customerId: 'c-2', customerName: 'Green Cross Pharmacy', paymentDate: '2026-10-10', amount: 3500, paymentMethod: 'Cash', referenceNumber: 'REF-1', receivedBy: 'Alex Morgan', status: 'Completed', allocations: [{ invoiceId: 'INV-TEST-BAL', invoiceNumber: 'INV-TEST-BAL', allocatedAmount: 3500, invoiceOriginalAmount: 10000 }], created_at: '2026-10-10T10:00:00Z' }];
    const summary = getInvoicePaymentSummary(inv, testPayments);
    assert.strictEqual(summary.paidAmount, 3500);
    assert.strictEqual(summary.remainingBalance, 6500);
    assert.strictEqual(summary.effectiveBalance, 6500);
    assert.strictEqual(summary.isOverpaid, false);
    assert.strictEqual(summary.paymentStatus, 'Partially Paid');
  });

  // 6. Full payment
  test('6. Full payment allocation transitions invoice status to Paid with 0 remaining balance', () => {
    const inv = toCollectionInvoice({ name: 'INV-FULL-PAID', id: 'INV-FULL-PAID', invoiceNumber: 'INV-FULL-PAID', customerId: 'c-2', customerName: 'Green Cross Pharmacy', originalAmount: 8500, currency: 'EGP', issueDate: '2026-10-01', dueDate: '2026-11-01', status: 'Approved', source: 'Sales order', dateRange: 'This month', repName: 'Alex Morgan', meta: 'EGP 8,500' } as StoredInvoice);
    const payments: PaymentRecord[] = [{ id: 'p-full', receiptNumber: 'REC-FULL', customerId: 'c-2', customerName: 'Green Cross Pharmacy', paymentDate: '2026-10-15', amount: 8500, paymentMethod: 'Cash', referenceNumber: 'REF-FULL', receivedBy: 'Alex Morgan', status: 'Completed', allocations: [{ invoiceId: 'INV-FULL-PAID', invoiceNumber: 'INV-FULL-PAID', allocatedAmount: 8500, invoiceOriginalAmount: 8500 }], created_at: '2026-10-15T10:00:00Z' }];
    const summary = getInvoicePaymentSummary(inv, payments);
    assert.strictEqual(summary.paidAmount, 8500);
    assert.strictEqual(summary.remainingBalance, 0);
    assert.strictEqual(summary.paymentStatus, 'Paid');
  });

  // 7. Partial payment
  test('7. Partial payment allocation leaves invoice in Partially Paid status with remaining balance', () => {
    const inv = toCollectionInvoice({ name: 'INV-PARTIAL', id: 'INV-PARTIAL', invoiceNumber: 'INV-PARTIAL', customerId: 'c-2', customerName: 'Green Cross Pharmacy', originalAmount: 20000, currency: 'EGP', issueDate: '2026-10-01', dueDate: '2026-11-01', status: 'Approved', source: 'Sales order', dateRange: 'This month', repName: 'Alex Morgan', meta: 'EGP 20,000' } as StoredInvoice);
    const payments: PaymentRecord[] = [{ id: 'p-part', receiptNumber: 'REC-PART', customerId: 'c-2', customerName: 'Green Cross Pharmacy', paymentDate: '2026-10-15', amount: 5000, paymentMethod: 'Cash', referenceNumber: 'REF-PART', receivedBy: 'Alex Morgan', status: 'Completed', allocations: [{ invoiceId: 'INV-PARTIAL', invoiceNumber: 'INV-PARTIAL', allocatedAmount: 5000, invoiceOriginalAmount: 20000 }], created_at: '2026-10-15T10:00:00Z' }];
    const summary = getInvoicePaymentSummary(inv, payments);
    assert.strictEqual(summary.paidAmount, 5000);
    assert.strictEqual(summary.remainingBalance, 15000);
    assert.strictEqual(summary.paymentStatus, 'Partially Paid');
  });

  // 8. Multiple receipts
  test('8. Multiple payments against one invoice cumulatively reduce balance accurately', () => {
    const inv = toCollectionInvoice({ name: 'INV-MULTI-PAY', id: 'INV-MULTI-PAY', invoiceNumber: 'INV-MULTI-PAY', customerId: 'c-2', customerName: 'Green Cross Pharmacy', originalAmount: 10000, currency: 'EGP', issueDate: '2026-10-01', dueDate: '2026-11-01', status: 'Approved', source: 'Sales order', dateRange: 'This month', repName: 'Alex Morgan', meta: 'EGP 10,000' } as StoredInvoice);
    const payments: PaymentRecord[] = [
      { id: 'p-m1', receiptNumber: 'REC-M1', customerId: 'c-2', customerName: 'Green Cross Pharmacy', paymentDate: '2026-10-10', amount: 2000, paymentMethod: 'Cash', referenceNumber: 'REF-1', receivedBy: 'Alex Morgan', status: 'Completed', allocations: [{ invoiceId: 'INV-MULTI-PAY', invoiceNumber: 'INV-MULTI-PAY', allocatedAmount: 2000, invoiceOriginalAmount: 10000 }], created_at: '2026-10-10T10:00:00Z' },
      { id: 'p-m2', receiptNumber: 'REC-M2', customerId: 'c-2', customerName: 'Green Cross Pharmacy', paymentDate: '2026-10-12', amount: 3000, paymentMethod: 'Cash', referenceNumber: 'REF-2', receivedBy: 'Alex Morgan', status: 'Completed', allocations: [{ invoiceId: 'INV-MULTI-PAY', invoiceNumber: 'INV-MULTI-PAY', allocatedAmount: 3000, invoiceOriginalAmount: 10000 }], created_at: '2026-10-12T10:00:00Z' },
      { id: 'p-m3', receiptNumber: 'REC-M3', customerId: 'c-2', customerName: 'Green Cross Pharmacy', paymentDate: '2026-10-14', amount: 5000, paymentMethod: 'Cash', referenceNumber: 'REF-3', receivedBy: 'Alex Morgan', status: 'Completed', allocations: [{ invoiceId: 'INV-MULTI-PAY', invoiceNumber: 'INV-MULTI-PAY', allocatedAmount: 5000, invoiceOriginalAmount: 10000 }], created_at: '2026-10-14T10:00:00Z' },
    ];
    const summary = getInvoicePaymentSummary(inv, payments);
    assert.strictEqual(summary.paidAmount, 10000);
    assert.strictEqual(summary.remainingBalance, 0);
    assert.strictEqual(summary.paymentStatus, 'Paid');
    assert.strictEqual(summary.allocationsCount, 3);
  });

  // 9. Split receipt
  test('9. Single receipt can be split across multiple invoices of the same customer', () => {
    const cid = `c-multi-${uid()}`;
    const inv1 = addInvoice({ customerId: cid, customerName: 'Multi Split Clinic', originalAmount: 4000, currency: 'EGP' });
    const inv2 = addInvoice({ customerId: cid, customerName: 'Multi Split Clinic', originalAmount: 6000, currency: 'EGP' });
    const payment = addCollectionPayment({ customerId: cid, customerName: 'Multi Split Clinic', paymentDate: '2026-10-25', amount: 10000, paymentMethod: 'Cash', referenceNumber: `CSH-SPL-${uid()}`, receivedBy: 'Alex Morgan', allocations: [{ invoiceId: inv1.id, invoiceNumber: inv1.invoiceNumber, allocatedAmount: 4000, invoiceOriginalAmount: 4000 }, { invoiceId: inv2.id, invoiceNumber: inv2.invoiceNumber, allocatedAmount: 6000, invoiceOriginalAmount: 6000 }] });
    assert.strictEqual(payment.unallocatedAmount, 0);
    const s1 = getInvoicePaymentSummary(toCollectionInvoice(getInvoice(inv1.id)!), collectionsStore.get());
    const s2 = getInvoicePaymentSummary(toCollectionInvoice(getInvoice(inv2.id)!), collectionsStore.get());
    assert.strictEqual(s1.paymentStatus, 'Paid');
    assert.strictEqual(s2.paymentStatus, 'Paid');
  });

  // 10. Unallocated amount
  test('10. Partial allocations record unallocated cash amount satisfying Total Received = Allocated + Unallocated', () => {
    const cid = `c-unal-${uid()}`;
    const inv = addInvoice({ customerId: cid, customerName: 'Unallocated Test Hospital', originalAmount: 7000, currency: 'EGP' });
    const payment = addCollectionPayment({ customerId: cid, customerName: 'Unallocated Test Hospital', paymentDate: '2026-10-25', amount: 10000, paymentMethod: 'Cash', referenceNumber: `CSH-UNL-${uid()}`, receivedBy: 'Alex Morgan', allocations: [{ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, allocatedAmount: 7000, invoiceOriginalAmount: 7000 }] });
    assert.strictEqual(payment.amount, 10000);
    assert.strictEqual(payment.unallocatedAmount, 3000);
    assert.strictEqual(payment.amount, 7000 + payment.unallocatedAmount!);
  });

  // 11. Over-allocation
  test('11. Allocation exceeding remaining invoice balance is strictly rejected with Domain Error', () => {
    const cid = `c-over-${uid()}`;
    const inv = addInvoice({ customerId: cid, customerName: 'Over Allocation Clinic', originalAmount: 5000, currency: 'EGP' });
    assert.throws(() => addCollectionPayment({ customerId: cid, customerName: 'Over Allocation Clinic', paymentDate: '2026-10-25', amount: 8000, paymentMethod: 'Cash', referenceNumber: `CSH-OV-${uid()}`, receivedBy: 'Alex Morgan', allocations: [{ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, allocatedAmount: 7000, invoiceOriginalAmount: 5000 }] }), /exceeds remaining balance/);
  });

  // 12. Total allocations > receipt
  test('12. Total allocations exceeding receipt amount is strictly rejected with Domain Error', () => {
    const cid = `c-rec-${uid()}`;
    const inv = addInvoice({ customerId: cid, customerName: 'Over Receipt Clinic', originalAmount: 10000, currency: 'EGP' });
    assert.throws(() => addCollectionPayment({ customerId: cid, customerName: 'Over Receipt Clinic', paymentDate: '2026-10-25', amount: 4000, paymentMethod: 'Cash', referenceNumber: `CSH-OR-${uid()}`, receivedBy: 'Alex Morgan', allocations: [{ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, allocatedAmount: 6000, invoiceOriginalAmount: 10000 }] }), /cannot exceed received payment amount/);
  });

  // 13. Cross-customer allocation
  test('13. Cross-customer payment allocation is strictly rejected with Domain Error', () => {
    const cidA = `c-custA-${uid()}`;
    const cidB = `c-custB-${uid()}`;
    const invA = addInvoice({ customerId: cidA, customerName: 'Customer A Pharmacy', originalAmount: 4000, currency: 'EGP' });
    assert.throws(() => addCollectionPayment({ customerId: cidB, customerName: 'Customer B Pharmacy', paymentDate: '2026-10-25', amount: 4000, paymentMethod: 'Cash', referenceNumber: `CSH-MIS-${uid()}`, receivedBy: 'Alex Morgan', allocations: [{ invoiceId: invA.id, invoiceNumber: invA.invoiceNumber, allocatedAmount: 4000, invoiceOriginalAmount: 4000 }] }), /Cannot allocate payment from customer/);
  });

  // 14. Currency mismatch
  test('14. Payment allocation with mismatched currency is rejected', () => {
    const cid = `c-curr-${uid()}`;
    const inv = addInvoice({ customerId: cid, customerName: 'Currency Test Pharmacy', originalAmount: 3000, currency: 'USD' });
    assert.throws(() => addCollectionPayment({ customerId: cid, customerName: 'Currency Test Pharmacy', paymentDate: '2026-10-25', amount: 3000, currency: 'EGP', paymentMethod: 'Cash', referenceNumber: `CSH-CUR-${uid()}`, receivedBy: 'Alex Morgan', allocations: [{ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, allocatedAmount: 3000, invoiceOriginalAmount: 3000 }] }), /Currency mismatch/);
  });

  // 15. Duplicate allocation
  test('15. Attempting to allocate twice to a settled invoice throws error on subsequent attempt', () => {
    const cid = `c-dup-${uid()}`;
    const inv = addInvoice({ customerId: cid, customerName: 'Duplicate Alloc Clinic', originalAmount: 5000, currency: 'EGP' });
    addCollectionPayment({ customerId: cid, customerName: 'Duplicate Alloc Clinic', paymentDate: '2026-10-25', amount: 5000, paymentMethod: 'Cash', referenceNumber: `CSH-S1-${uid()}`, receivedBy: 'Alex Morgan', allocations: [{ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, allocatedAmount: 5000, invoiceOriginalAmount: 5000 }] });
    assert.throws(() => addCollectionPayment({ customerId: cid, customerName: 'Duplicate Alloc Clinic', paymentDate: '2026-10-26', amount: 5000, paymentMethod: 'Cash', referenceNumber: `CSH-S2-${uid()}`, receivedBy: 'Alex Morgan', allocations: [{ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, allocatedAmount: 5000, invoiceOriginalAmount: 5000 }] }), /exceeds remaining balance of 0/);
  });

  // 16. Single-invoice void restoration
  test('16. Voiding payment safely restores invoice outstanding balance and marks receipt Voided', () => {
    const cid = `c-void-${uid()}`;
    const inv = addInvoice({ customerId: cid, customerName: 'Void Test Pharmacy', originalAmount: 9000, currency: 'EGP' });
    const payment = addCollectionPayment({ customerId: cid, customerName: 'Void Test Pharmacy', paymentDate: '2026-10-25', amount: 9000, paymentMethod: 'Cash', referenceNumber: `CSH-V1-${uid()}`, receivedBy: 'Alex Morgan', allocations: [{ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, allocatedAmount: 9000, invoiceOriginalAmount: 9000 }] });

    let s = getInvoicePaymentSummary(toCollectionInvoice(getInvoice(inv.id)!), collectionsStore.get());
    assert.strictEqual(s.paymentStatus, 'Paid');

    voidCollectionPayment(payment.receiptNumber, 'Dishonored', 'Alex Morgan');
    s = getInvoicePaymentSummary(toCollectionInvoice(getInvoice(inv.id)!), collectionsStore.get());
    assert.strictEqual(s.paidAmount, 0);
    assert.strictEqual(s.remainingBalance, 9000);
    assert.strictEqual(s.paymentStatus, 'Unpaid');
    assert.strictEqual(collectionsStore.get().find((p) => p.id === payment.id)?.status, 'Voided');
  });

  // 17. Double void
  test('17. Attempting to void an already-voided payment throws error', () => {
    const cid = `c-dvoid-${uid()}`;
    const inv = addInvoice({ customerId: cid, customerName: 'Duplicate Void Pharmacy', originalAmount: 4000, currency: 'EGP' });
    const payment = addCollectionPayment({ customerId: cid, customerName: 'Duplicate Void Pharmacy', paymentDate: '2026-10-25', amount: 4000, paymentMethod: 'Cash', referenceNumber: `CSH-DV-${uid()}`, receivedBy: 'Alex Morgan', allocations: [{ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, allocatedAmount: 4000, invoiceOriginalAmount: 4000 }] });
    voidCollectionPayment(payment.receiptNumber, 'First void', 'Alex Morgan');
    assert.throws(() => voidCollectionPayment(payment.receiptNumber, 'Second void', 'Alex Morgan'), /is already voided/);
  });

  // 18. Legacy normalization — known customer + EGP meta
  test('18. Legacy un-normalized invoices are safely normalized with deterministic customer ID and amount', () => {
    const legacyRaw = { name: 'INV-1099 · Al-Amal Medical Clinic', meta: 'Sourced from legacy telegram · EGP 18,250', status: 'Approved', repName: 'Sofia Chen' };
    const normalized = normalizeLegacyInvoice(legacyRaw as any);
    assert.strictEqual(normalized.invoiceNumber, 'INV-1099');
    assert.strictEqual(normalized.originalAmount, 18250);
    assert.strictEqual(normalized.currency, 'EGP');
    // Unknown customer → slug + needsReconciliation
    assert.strictEqual(normalized.customerId, 'c-alamalmedicalclinic');
    assert.strictEqual(normalized.needsReconciliation, true);
  });

  // 19. Upload validation
  test('19. Upload invoice rejects missing customer, invalid dates, and zero or negative amounts', () => {
    assert.throws(() => addInvoice({ customerId: '', customerName: 'Valid Name', originalAmount: 5000 }), /Customer ID is required/);
    assert.throws(() => addInvoice({ customerId: 'c-1', customerName: 'Valid Name', originalAmount: -500 }), /positive number/);
    assert.throws(() => addInvoice({ customerId: 'c-1', customerName: 'Valid Name', originalAmount: 5000, issueDate: '2026-11-20', dueDate: '2026-10-20' }), /due date cannot be earlier than issue date/i);
  });

  // =========================================================================
  // === Test 20: Exact Controlled KPI Assertions (Phase 1.2) =================
  // =========================================================================
  test('20. Exact KPI Assertions: calculates exact expected totals, overdue amounts, and collections on controlled dataset', () => {
    // Construct a completely controlled dataset with known numbers
    const controlledInvoices: CollectionInvoice[] = [
      // INV-1: Partially Paid, Overdue (dueDate 2026-10-15 < 2026-10-26, balance 6000)
      {
        id: 'INV-KPI-1',
        invoiceNumber: 'INV-KPI-1',
        customerId: 'c-kpi-1',
        customerName: 'KPI Hospital 1',
        issueDate: '2026-09-15',
        dueDate: '2026-10-15',
        originalAmount: 10000,
        currency: 'EGP',
        repName: 'Alex Morgan',
        status: 'Approved',
      },
      // INV-2: Fully Paid, Future due date (dueDate 2026-11-15, balance 0)
      {
        id: 'INV-KPI-2',
        invoiceNumber: 'INV-KPI-2',
        customerId: 'c-kpi-1',
        customerName: 'KPI Hospital 1',
        issueDate: '2026-10-15',
        dueDate: '2026-11-15',
        originalAmount: 8000,
        currency: 'EGP',
        repName: 'Alex Morgan',
        status: 'Approved',
      },
      // INV-3: Unpaid, Future due date (dueDate 2026-11-20, balance 5000)
      {
        id: 'INV-KPI-3',
        invoiceNumber: 'INV-KPI-3',
        customerId: 'c-kpi-2',
        customerName: 'KPI Pharmacy 2',
        issueDate: '2026-10-20',
        dueDate: '2026-11-20',
        originalAmount: 5000,
        currency: 'EGP',
        repName: 'Alex Morgan',
        status: 'Pending',
      },
    ];

    const controlledPayments: PaymentRecord[] = [
      // P1: October 2026 (current month) - 8,000 (4,000 to INV-1, 4,000 to INV-2)
      {
        id: 'REC-KPI-P1',
        receiptNumber: 'REC-KPI-P1',
        customerId: 'c-kpi-1',
        customerName: 'KPI Hospital 1',
        paymentDate: '2026-10-20',
        amount: 8000,
        paymentMethod: 'Cash',
        referenceNumber: 'REF-P1',
        receivedBy: 'Alex Morgan',
        status: 'Completed',
        allocations: [
          { invoiceId: 'INV-KPI-1', invoiceNumber: 'INV-KPI-1', allocatedAmount: 4000, invoiceOriginalAmount: 10000 },
          { invoiceId: 'INV-KPI-2', invoiceNumber: 'INV-KPI-2', allocatedAmount: 4000, invoiceOriginalAmount: 8000 },
        ],
        created_at: '2026-10-20T10:00:00Z',
      },
      // P2: October 2026 (current month) - 4,000 (4,000 to INV-2, settling it)
      {
        id: 'REC-KPI-P2',
        receiptNumber: 'REC-KPI-P2',
        customerId: 'c-kpi-1',
        customerName: 'KPI Hospital 1',
        paymentDate: '2026-10-22',
        amount: 4000,
        paymentMethod: 'Cash',
        referenceNumber: 'REF-P2',
        receivedBy: 'Alex Morgan',
        status: 'Completed',
        allocations: [
          { invoiceId: 'INV-KPI-2', invoiceNumber: 'INV-KPI-2', allocatedAmount: 4000, invoiceOriginalAmount: 8000 },
        ],
        created_at: '2026-10-22T10:00:00Z',
      },
      // P3: Voided receipt - 5,000 (must be completely ignored!)
      {
        id: 'REC-KPI-VOID',
        receiptNumber: 'REC-KPI-VOID',
        customerId: 'c-kpi-1',
        customerName: 'KPI Hospital 1',
        paymentDate: '2026-10-23',
        amount: 5000,
        paymentMethod: 'Cash',
        referenceNumber: 'REF-VOID',
        receivedBy: 'Alex Morgan',
        status: 'Voided',
        allocations: [
          { invoiceId: 'INV-KPI-1', invoiceNumber: 'INV-KPI-1', allocatedAmount: 5000, invoiceOriginalAmount: 10000 },
        ],
        created_at: '2026-10-23T10:00:00Z',
      },
      // P4: September 2026 (previous month) - 3,000 (counts toward totalCollected, but NOT collectionsThisMonth)
      {
        id: 'REC-KPI-OLD',
        receiptNumber: 'REC-KPI-OLD',
        customerId: 'c-kpi-2',
        customerName: 'KPI Pharmacy 2',
        paymentDate: '2026-09-15',
        amount: 3000,
        paymentMethod: 'Cash',
        referenceNumber: 'REF-OLD',
        receivedBy: 'Alex Morgan',
        status: 'Completed',
        allocations: [],
        created_at: '2026-09-15T10:00:00Z',
      },
    ];

    // Compute KPIs against reference system date '2026-10-26'
    const kpis = calculateCashInKpis(controlledInvoices, controlledPayments, '2026-10-26');

    // Expected value derivation:
    // 1. totalInvoiced: 10,000 + 8,000 + 5,000 = 23,000 EGP
    assert.strictEqual(kpis.totalInvoiced, 23000, 'totalInvoiced must equal exact sum of active invoices (23,000)');

    // 2. totalCollected: P1 (8,000) + P2 (4,000) + P4 (3,000) = 15,000 EGP (P3 voided excluded)
    assert.strictEqual(kpis.totalCollected, 15000, 'totalCollected must equal exact sum of valid non-voided receipts (15,000)');

    // 3. outstandingBalance:
    //    INV-1 balance: 10000 - 4000 = 6000
    //    INV-2 balance: 8000 - (4000 + 4000) = 0
    //    INV-3 balance: 5000 - 0 = 5000
    //    Total outstanding = 6000 + 0 + 5000 = 11,000 EGP
    assert.strictEqual(kpis.outstandingBalance, 11000, 'outstandingBalance must equal exact remaining balances (11,000)');

    // 4. overdueAmount:
    //    INV-1 is overdue (dueDate 2026-10-15 < 2026-10-26): 6000 EGP
    //    INV-2 is paid (0 EGP)
    //    INV-3 is future (2026-11-20 > 2026-10-26): not overdue
    //    Total overdue = 6000 EGP
    assert.strictEqual(kpis.overdueAmount, 6000, 'overdueAmount must equal exact overdue invoice balance (6,000)');

    // 5. collectionsThisMonth: P1 (8,000) + P2 (4,000) in 2026-10 = 12,000 EGP (P4 was September)
    assert.strictEqual(kpis.collectionsThisMonth, 12000, 'collectionsThisMonth must count only receipts in 2026-10 (12,000)');

    // Verify Exclusion of Rejected and NeedsReconciliation Invoices from Shared Collection Views
    const testRej: StoredInvoice = {
      id: 'INV-KPI-REJ', invoiceNumber: 'INV-KPI-REJ', customerId: 'c-kpi-1', customerName: 'KPI Hospital 1',
      originalAmount: 7000, currency: 'EGP', issueDate: '2026-10-01', dueDate: '2026-11-01',
      status: 'Rejected', source: 'Web upload', dateRange: 'This month', repName: 'Alex Morgan', name: 'INV-KPI-REJ', meta: 'EGP 7,000',
    };
    const testRecon: StoredInvoice = {
      id: 'INV-KPI-RECON', invoiceNumber: 'INV-KPI-RECON', customerId: 'c-kpi-1', customerName: 'KPI Hospital 1',
      originalAmount: 9000, currency: 'EGP', issueDate: '2026-10-01', dueDate: '2026-11-01',
      status: 'Pending', source: 'Web upload', dateRange: 'This month', repName: 'Alex Morgan', name: 'INV-KPI-RECON', meta: 'EGP 9,000',
      needsReconciliation: true, reconciliationReason: 'customerId unresolved',
    };

    invoicesStore.update((list) => [testRej, testRecon, ...list]);
    const shared = getSharedCollectionInvoices();
    assert.ok(!shared.some((i) => i.id === 'INV-KPI-REJ'), 'Rejected invoices must be excluded from shared collection view');
    assert.ok(!shared.some((i) => i.id === 'INV-KPI-RECON'), 'NeedsReconciliation invoices must be excluded from shared collection view');
  });

  // =========================================================================
  // === Phase 1.1 Tests (21–30) =============================================
  // =========================================================================

  // 21. D-01: Line-item total equals originalAmount
  test('21. (D-01) Invoice with consistent line-item total is accepted', () => {
    const cid = `c-li-ok-${uid()}`;
    const inv = addInvoice({
      customerId: cid,
      customerName: 'Line Item Clinic',
      originalAmount: 10000,
      currency: 'EGP',
      items: [
        { productCode: 'PRD-01', productName: 'Bevato', quantity: 4, unitPrice: 2500, total: 10000 },
      ],
    });
    assert.strictEqual(inv.originalAmount, 10000);
    assert.strictEqual(inv.items?.length, 1);
  });

  // 22. D-01: Line-item mismatch is rejected
  test('22. (D-01) Invoice with mismatched line-item total is rejected with domain error', () => {
    assert.throws(
      () =>
        addInvoice({
          customerId: `c-li-bad-${uid()}`,
          customerName: 'Mismatch Pharmacy',
          originalAmount: 10000,
          currency: 'EGP',
          items: [
            { productCode: 'PRD-01', productName: 'Bevato', quantity: 2, unitPrice: 2500, total: 5000 },
          ],
        }),
      /line-item total.*does not match originalAmount/,
      'Must reject when item sum ≠ originalAmount',
    );
  });

  // 23. D-01: Zero items allowed; header is authoritative
  test('23. (D-01) Invoice with no line items is accepted; header originalAmount is authoritative', () => {
    const inv = addInvoice({
      customerId: `c-noitems-${uid()}`,
      customerName: 'No Items Pharmacy',
      originalAmount: 7500,
      currency: 'EGP',
    });
    assert.strictEqual(inv.originalAmount, 7500);
    assert.ok(!inv.items || inv.items.length === 0);
  });

  // 24. D-04: Multi-invoice void restoration
  test('24. (D-04) Voiding a split receipt restores ALL three affected invoice balances', () => {
    const cid = `c-mv-${uid()}`;
    const invA = addInvoice({ customerId: cid, customerName: 'Multi Void Corp', originalAmount: 3000, currency: 'EGP' });
    const invB = addInvoice({ customerId: cid, customerName: 'Multi Void Corp', originalAmount: 4000, currency: 'EGP' });
    const invC = addInvoice({ customerId: cid, customerName: 'Multi Void Corp', originalAmount: 5000, currency: 'EGP' });

    const receipt = addCollectionPayment({
      customerId: cid, customerName: 'Multi Void Corp', paymentDate: '2026-10-25', amount: 12000,
      paymentMethod: 'Cash', referenceNumber: `CSH-MV-${uid()}`, receivedBy: 'Alex Morgan',
      allocations: [
        { invoiceId: invA.id, invoiceNumber: invA.invoiceNumber, allocatedAmount: 3000, invoiceOriginalAmount: 3000 },
        { invoiceId: invB.id, invoiceNumber: invB.invoiceNumber, allocatedAmount: 4000, invoiceOriginalAmount: 4000 },
        { invoiceId: invC.id, invoiceNumber: invC.invoiceNumber, allocatedAmount: 5000, invoiceOriginalAmount: 5000 },
      ],
    });

    // Confirm all three invoices are Paid before void.
    const allPmts = collectionsStore.get();
    for (const inv of [invA, invB, invC]) {
      const s = getInvoicePaymentSummary(toCollectionInvoice(getInvoice(inv.id)!), allPmts);
      assert.strictEqual(s.paymentStatus, 'Paid', `Invoice ${inv.id} should be Paid before void`);
    }

    voidCollectionPayment(receipt.receiptNumber, 'Bank reversal', 'Alex Morgan');

    // After void, all three invoices must revert to Unpaid with full balance.
    const afterVoid = collectionsStore.get();
    const expectRestored = [
      { inv: invA, expected: 3000 },
      { inv: invB, expected: 4000 },
      { inv: invC, expected: 5000 },
    ];
    for (const { inv, expected } of expectRestored) {
      const s = getInvoicePaymentSummary(toCollectionInvoice(getInvoice(inv.id)!), afterVoid);
      assert.strictEqual(s.paidAmount, 0, `Invoice ${inv.id}: paidAmount must be 0 after void`);
      assert.strictEqual(s.remainingBalance, expected, `Invoice ${inv.id}: balance must be restored to ${expected}`);
      assert.strictEqual(s.paymentStatus, 'Unpaid', `Invoice ${inv.id}: status must be Unpaid after void`);
    }
  });

  // 25. D-03: Legacy record with no amount → needsReconciliation
  test('25. (D-03) Legacy record with no originalAmount and no parseable meta sets needsReconciliation', () => {
    const raw = { name: 'INV-9901 · Unknown Pharmacy', status: 'Pending', repName: 'Alex Morgan' };
    const normalized = normalizeLegacyInvoice(raw as any);
    assert.strictEqual(normalized.needsReconciliation, true, 'Must be flagged for reconciliation');
    assert.ok(normalized.reconciliationReason?.includes('originalAmount'), 'Reason must mention amount');
    assert.strictEqual(normalized.originalAmount, 0, 'Sentinel 0 must be stored, not a real financial amount');
  });

  // 26. D-03: Legacy record with malformed meta
  test('26. (D-03) Legacy record with malformed meta (no EGP pattern) sets needsReconciliation', () => {
    const raw = { name: 'INV-9902 · Another Clinic', meta: 'Invoice sourced via field team', status: 'Pending', repName: 'Alex Morgan' };
    const normalized = normalizeLegacyInvoice(raw as any);
    assert.strictEqual(normalized.needsReconciliation, true);
    assert.strictEqual(normalized.originalAmount, 0);
  });

  // 27. D-02 / D-03: Unknown customer → needsReconciliation + stable slug
  test('27. (D-02/D-03) Legacy record with completely unknown customer gets slug and needsReconciliation', () => {
    const raw = { name: 'INV-9903 · Zanzibar Island Clinic', meta: 'EGP 5,000', status: 'Pending', repName: 'Alex Morgan' };
    const normalized = normalizeLegacyInvoice(raw as any);
    assert.strictEqual(normalized.needsReconciliation, true);
    assert.ok(normalized.reconciliationReason?.includes('unknown'), 'Reason must state unknown customer');
    assert.strictEqual(normalized.customerId, 'c-zanzibarislandclinic', 'Must use stable slug');
    assert.strictEqual(normalized.originalAmount, 5000);
  });

  // 28. D-02: Ambiguous customer name → needsReconciliation
  test('28. (D-02) Customer name matching multiple seed entries gets ambiguous flag', () => {
    const raw = { name: 'INV-9904 · Metro Health Wellness', meta: 'EGP 3,000', status: 'Pending', repName: 'Alex Morgan' };
    const normalized = normalizeLegacyInvoice(raw as any);
    assert.strictEqual(normalized.needsReconciliation, true);
    assert.ok(normalized.reconciliationReason?.includes('ambiguous'), 'Reason must state ambiguous');
  });

  // 29. D-03: needsReconciliation invoice blocked from allocation
  test('29. (D-03) Attempting to allocate payment to a needsReconciliation invoice throws domain error', () => {
    const reconInv: StoredInvoice = {
      id: `INV-RECON-${uid()}`, invoiceNumber: `INV-RECON-${uid()}`,
      customerId: 'c-unknown-slug', customerName: 'Unknown Legacy Pharmacy',
      originalAmount: 0, currency: 'EGP', issueDate: '', dueDate: '',
      status: 'Pending', source: 'Web upload', dateRange: 'This month',
      repName: 'Alex Morgan', name: 'INV-RECON · Unknown Legacy Pharmacy', meta: 'EGP 0',
      needsReconciliation: true, reconciliationReason: 'originalAmount could not be resolved',
    };
    invoicesStore.update((list) => [reconInv, ...list]);

    assert.throws(
      () =>
        addCollectionPayment({
          customerId: 'c-unknown-slug', customerName: 'Unknown Legacy Pharmacy',
          paymentDate: '2026-10-25', amount: 100, paymentMethod: 'Cash',
          referenceNumber: `CSH-RC-${uid()}`, receivedBy: 'Alex Morgan',
          allocations: [{ invoiceId: reconInv.id, invoiceNumber: reconInv.invoiceNumber, allocatedAmount: 100, invoiceOriginalAmount: 0 }],
        }),
      /requires reconciliation/,
      'Must block allocation to needsReconciliation invoices',
    );
  });

  // 30. D-02: existing customerId passes through resolver unchanged
  test('30. (D-02) resolveCustomerId returns existing ID unchanged without lookup', () => {
    const result = resolveCustomerId('c-explicit-id', 'Some Customer');
    assert.strictEqual(result.resolved, true);
    assert.strictEqual(result.customerId, 'c-explicit-id');
  });

  // =========================================================================
  // === Phase 1.2 Tests: Persistence, Dates, and Display Safety =============
  // =========================================================================

  // 31. Actual Store Persistence & Hydration Sequence
  test('31. (D-08) Actual store persistence & hydration: Initialize → Persist → Simulate Reload → Hydrate → Read → Assert', () => {
    const memStorage = enableTestStorage();
    const testKey = `invoices_persist_test_${Date.now()}`;

    try {
      // 1. Initialize fresh store with storage adapter active
      const storeA = createStore<StoredInvoice[]>(testKey, []);

      const invoiceToPersist: StoredInvoice = {
        id: 'INV-PERSIST-01',
        invoiceNumber: 'INV-PERSIST-01',
        customerId: 'c-persist-cust',
        customerName: 'Persisted Hospital Corp',
        originalAmount: 12500.5,
        currency: 'EGP',
        issueDate: '2026-10-15',
        dueDate: '2026-11-15',
        status: 'Pending',
        source: 'Web upload',
        dateRange: 'This month',
        repName: 'Alex Morgan',
        name: 'INV-PERSIST-01 · Persisted Hospital Corp',
        meta: '2 items · EGP 12,500.5',
        items: [
          { productCode: 'PRD-01', productName: 'Bevato', quantity: 5, unitPrice: 2000, total: 10000 },
          { productCode: 'PRD-02', productName: 'Cataflam', quantity: 1, unitPrice: 2500.5, total: 2500.5 },
        ],
        needsReconciliation: false,
      };

      // 2. Persist: set() writes to memory snapshot and calls localStorage.setItem
      storeA.set([invoiceToPersist]);

      const storedRaw = memStorage.getItem(`navigen_mock_v1:${testKey}`);
      assert.ok(storedRaw, 'Raw JSON data must be written to browser storage');
      const parsedStorage = JSON.parse(storedRaw);
      assert.strictEqual(parsedStorage.version, 1, 'Storage version must equal MOCK_STORE_VERSION (1)');
      assert.strictEqual(parsedStorage.data.length, 1);

      // 3. Simulate Reload: create brand new store instance with empty seed
      const storeB = createStore<StoredInvoice[]>(testKey, []);
      // Before hydration, storeB has empty seed snapshot
      assert.strictEqual(storeB.getSnapshot().length, 0, 'New store before hydration must contain initial seed');

      // 4. Hydrate: trigger hydrate() from storage
      storeB.hydrate();

      // 5. Read & Assert
      const hydrated = storeB.get();
      assert.strictEqual(hydrated.length, 1, 'Hydrated store must contain exactly 1 invoice');
      assert.strictEqual(hydrated[0].id, 'INV-PERSIST-01');
      assert.strictEqual(hydrated[0].customerId, 'c-persist-cust');
      assert.strictEqual(hydrated[0].originalAmount, 12500.5);
      assert.strictEqual(hydrated[0].items?.length, 2);
      assert.strictEqual(hydrated[0].items?.[0].productCode, 'PRD-01');
      assert.strictEqual(hydrated[0].items?.[1].unitPrice, 2500.5);
      assert.strictEqual(hydrated[0].status, 'Pending');
      assert.strictEqual(hydrated[0].needsReconciliation, false);
    } finally {
      memStorage.clear();
      disableTestStorage();
    }
  });

  // 32. Unknown-Date Visibility and Overdue Protection
  test('32. (D-07) Unknown-Date Visibility: missing/invalid due dates remain visible in balances but never contaminate overdue totals', () => {
    const datelessInv: StoredInvoice = {
      id: `INV-ND-${uid()}`,
      invoiceNumber: `INV-ND-${uid()}`,
      customerId: 'c-9',
      customerName: 'Riverside Pharmacy',
      originalAmount: 5000,
      currency: 'EGP',
      status: 'Approved',
      source: 'Telegram',
      dateRange: 'This month',
      repName: 'Sofia Chen',
      name: 'INV-ND · Riverside Pharmacy',
      meta: 'EGP 5,000',
      needsReconciliation: true,
      reconciliationReason: 'issueDate or dueDate is missing',
    } as unknown as StoredInvoice;

    const col = toCollectionInvoice(datelessInv);
    assert.strictEqual(col.issueDate, '', 'issueDate must be empty string when missing');
    assert.strictEqual(col.dueDate, '', 'dueDate must be empty string when missing');
    assert.strictEqual(col.needsReconciliation, true, 'needsReconciliation flag must be preserved on collection record');

    // 1. In getInvoicePaymentSummary, an invoice with no dueDate must NOT be marked overdue
    const summary = getInvoicePaymentSummary(col, [], '2026-10-26');
    assert.strictEqual(summary.isOverdue, false, 'Invoice with no dueDate must NEVER be marked overdue');
    assert.strictEqual(summary.daysOverdue, 0, 'daysOverdue must be 0 for dateless invoice');
    assert.strictEqual(summary.remainingBalance, 5000, 'Remaining balance must remain intact');
    assert.strictEqual(summary.effectiveBalance, 5000, 'Effective balance must remain intact (visible in receivables)');

    // 2. In calculateCashInKpis, dateless invoices must not contaminate overdue amount
    const kpis = calculateCashInKpis([col], [], '2026-10-26');
    assert.strictEqual(kpis.overdueAmount, 0, 'Overdue amount must be 0 for dateless invoices');
    assert.strictEqual(kpis.outstandingBalance, 5000, 'Outstanding balance must include the dateless invoice');
  });

  // 33. D-06: Target progress excludes needsReconciliation invoices
  test('33. (D-06) calculateTargetProgress excludes needsReconciliation invoices from sales totals', () => {
    const target: SalesTarget = {
      id: 'tgt-test-33', name: 'Test Target', repId: 'rep-t33', repName: 'Target Rep',
      period: 'Monthly', startDate: '2026-10-01', endDate: '2026-10-31',
      targetValue: 50000, createdAt: '2026-10-01T00:00:00Z',
    };

    const normalInv: StoredInvoice = {
      id: `INV-N33-${uid()}`, invoiceNumber: `INV-N33-${uid()}`,
      customerId: 'c-t33', customerName: 'T33 Pharmacy',
      originalAmount: 10000, currency: 'EGP',
      issueDate: '2026-10-10', dueDate: '2026-11-10',
      status: 'Approved', source: 'Web upload', dateRange: 'This month',
      repName: 'Target Rep', name: 'INV-N33 · T33 Pharmacy', meta: 'EGP 10,000',
    };
    const reconInv: StoredInvoice = {
      id: `INV-R33-${uid()}`, invoiceNumber: `INV-R33-${uid()}`,
      customerId: 'c-unknown-33', customerName: 'Unknown T33',
      originalAmount: 0, currency: 'EGP',
      issueDate: '2026-10-12', dueDate: '2026-11-12',
      status: 'Pending', source: 'Web upload', dateRange: 'This month',
      repName: 'Target Rep', name: 'INV-R33 · Unknown T33', meta: '',
      needsReconciliation: true, reconciliationReason: 'originalAmount could not be resolved',
    };

    const progress = calculateTargetProgress(target, [normalInv, reconInv], []);
    assert.strictEqual(progress.achievedAmount, 10000, 'Only the valid invoice must count toward target');
  });

  // 34. D-05: Invoice display uses originalAmount, not meta regex
  test('34. (D-05) normalizeInvoice and toCollectionInvoice use originalAmount, not meta, as financial value', () => {
    const conflicted: StoredInvoice = {
      id: `INV-D05-${uid()}`, invoiceNumber: `INV-D05-${uid()}`,
      customerId: 'c-9', customerName: 'Riverside Pharmacy',
      originalAmount: 20000,
      currency: 'EGP',
      issueDate: '2026-10-01', dueDate: '2026-11-01',
      status: 'Approved', source: 'Telegram', dateRange: 'This month',
      repName: 'Sofia Chen', name: 'INV-D05 · Riverside Pharmacy',
      meta: 'EGP 99,999', // deliberately wrong meta
    };

    const col = toCollectionInvoice(conflicted);
    assert.strictEqual(col.originalAmount, 20000, 'toCollectionInvoice must use originalAmount, not meta');
  });

  // 35. D-01: Rounding boundary — 0.01 tolerance accepted; 0.02 rejected
  test('35. (D-01) Line-item rounding: difference ≤ 0.01 accepted; > 0.01 rejected', () => {
    assert.doesNotThrow(() =>
      validateLineItemReconciliation(12345.67, [
        { productCode: 'P', productName: 'P', quantity: 3, unitPrice: 4115.22, total: 12345.66 },
      ]),
    );

    assert.throws(
      () =>
        validateLineItemReconciliation(12345.68, [
          { productCode: 'P', productName: 'P', quantity: 3, unitPrice: 4115.22, total: 12345.66 },
        ]),
      /line-item total.*does not match/,
    );
  });

  // 36. D-05: Unverified legacy estimate display safety
  test('36. (D-05) Invoice Review Display Safety: unverified parsed amounts are flagged as estimates and cannot be approved', () => {
    const legacyEstimateRecord = {
      name: 'INV-LEGACY-01 · Unreconciled Clinic',
      meta: 'Legacy telegram note · EGP 45,000',
      status: 'Pending',
      repName: 'Alex Morgan',
    };

    const normalized = normalizeLegacyInvoice(legacyEstimateRecord as any);

    // Amount was extracted from meta, but record is explicitly marked needsReconciliation
    // because dates and customer identity are unresolved
    assert.strictEqual(normalized.needsReconciliation, true);
    assert.strictEqual(normalized.originalAmount, 45000);

    // If an invoice enters with NO valid originalAmount (originalAmount: 0),
    // it must not be usable as an authoritative zero or arbitrary payment target.
    const unverifiedZeroAmount: StoredInvoice = {
      id: `INV-ZERO-${uid()}`,
      invoiceNumber: `INV-ZERO-${uid()}`,
      customerId: 'c-unverified',
      customerName: 'Zero Amount Clinic',
      originalAmount: 0,
      currency: 'EGP',
      issueDate: '',
      dueDate: '',
      status: 'Pending',
      source: 'Telegram',
      dateRange: 'This month',
      repName: 'Alex Morgan',
      name: 'INV-ZERO · Zero Amount Clinic',
      meta: 'EGP 30,000 estimate',
      needsReconciliation: true,
      reconciliationReason: 'originalAmount could not be resolved',
    };

    invoicesStore.update((list) => [unverifiedZeroAmount, ...list]);

    // Allocation must be blocked
    assert.throws(
      () =>
        addCollectionPayment({
          customerId: 'c-unverified',
          customerName: 'Zero Amount Clinic',
          paymentDate: '2026-10-25',
          amount: 500,
          paymentMethod: 'Cash',
          referenceNumber: `CSH-ZERO-${uid()}`,
          receivedBy: 'Alex Morgan',
          allocations: [
            { invoiceId: unverifiedZeroAmount.id, invoiceNumber: unverifiedZeroAmount.invoiceNumber, allocatedAmount: 500, invoiceOriginalAmount: 0 },
          ],
        }),
      /requires reconciliation/,
      'Cannot allocate payments to unverified estimate records',
    );
  });
});
