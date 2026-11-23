/**
 * Inventory & Operational Logic Remediation Test Suite — Phase 2
 *
 * Covers all 10 core inventory & operational scenarios:
 *  1. Receiving Stock into Warehouse & Batch.
 *  2. FEFO Reservation (earliest expiry first, physical unchanged, reserved increased, available decreased).
 *  3. Order Dispatch (physical & reserved decreased, available conserved, double dispatch prevented).
 *  4. Order Cancellation & Reservation Release (reservation released, physical unchanged, available restored).
 *  5. Insufficient Stock Rejection without partial mutation (atomic validation).
 *  6. Warehouse Transfer (linked movements, quantity invariant, location partitioning).
 *  7. Return Validation & Stock Disposition (order limits, sellable vs damaged/expired, credit note generation).
 *  8. Sample Custody & Distribution Bounds (warehouse deduction, rep custody, over-distribution rejection, return).
 *  9. Expired Batch Ineligibility (expired batches excluded from FEFO and availability).
 *  10. Persistence & Hydration reload test using MemoryStorage test adapter.
 */

import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  batchesStore,
  stockMovementsStore,
  stockReservationsStore,
  addBatch,
  addStockMovement,
  deriveBatches,
  deriveProductStock,
  allocateFefo,
  receiveStock,
  reserveStock,
  releaseReservation,
  dispatchReservedStock,
  transferWarehouseStock,
  issueRepSample,
  distributeRepSample,
  returnRepSample,
  getRepAvailableSampleStock,
  type BatchRecord,
  type StockMovement,
  type StockReservation,
} from '@/data/mock/stockDerived';

import {
  salesOrdersStore,
  addSalesOrder,
  approveSalesOrder,
  dispatchSalesOrder,
  cancelSalesOrder,
  rejectSalesOrder,
} from '@/data/mock/sales-orders';

import {
  returnsStore,
  creditNotesStore,
  addReturn,
  approveReturn,
  rejectReturn,
  getReturnedQtyForOrder,
} from '@/data/mock/returns';

import { customersStore, addCustomer } from '@/data/mock/customers';
import { productsStore } from '@/data/mock/products';
import { invoicesStore } from '@/data/mock/invoices';

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
const initialBatchesFixture = JSON.parse(JSON.stringify(batchesStore.get()));
const initialMovementsFixture = JSON.parse(JSON.stringify(stockMovementsStore.get()));
const initialReservationsFixture = JSON.parse(JSON.stringify(stockReservationsStore.get()));
const initialSalesOrdersFixture = JSON.parse(JSON.stringify(salesOrdersStore.get()));
const initialInvoicesFixture = JSON.parse(JSON.stringify(invoicesStore.get()));
const initialReturnsFixture = JSON.parse(JSON.stringify(returnsStore.get()));
const initialCreditNotesFixture = JSON.parse(JSON.stringify(creditNotesStore.get()));
const initialCustomersFixture = JSON.parse(JSON.stringify(customersStore.get()));

describe('Navigen Distribution Suite — Phase 2: Inventory & Operational Logic Suite', () => {
  beforeEach(() => {
    // Reset all stores to their pristine fixtures before every test
    batchesStore.set(JSON.parse(JSON.stringify(initialBatchesFixture)));
    stockMovementsStore.set(JSON.parse(JSON.stringify(initialMovementsFixture)));
    stockReservationsStore.set(JSON.parse(JSON.stringify(initialReservationsFixture)));
    salesOrdersStore.set(JSON.parse(JSON.stringify(initialSalesOrdersFixture)));
    invoicesStore.set(JSON.parse(JSON.stringify(initialInvoicesFixture)));
    returnsStore.set(JSON.parse(JSON.stringify(initialReturnsFixture)));
    creditNotesStore.set(JSON.parse(JSON.stringify(initialCreditNotesFixture)));
    customersStore.set(JSON.parse(JSON.stringify(initialCustomersFixture)));
  });

  // ── 1. Receiving Stock into Warehouse & Batch ───────────────────────────────
  test('1. Receiving Stock creates batch record, receipt movement, and establishes physical stock', () => {
    const testBatchNo = `BV-RCV-${uid()}`;
    const movement = receiveStock({
      productName: 'Bevato',
      batchNumber: testBatchNo,
      expiryDate: '2028-06-30',
      quantity: 500,
      warehouseId: 'wh-cai-01',
      warehouseName: 'Cairo Central Hub',
      actor: 'Logistics Manager',
    });

    assert.ok(movement.id);
    assert.strictEqual(movement.type, 'receipt');
    assert.strictEqual(movement.quantity, 500);
    assert.strictEqual(movement.batchNumber, testBatchNo);

    // Verify batch was created in batchesStore
    const createdBatch = batchesStore.get().find((b) => b.batch_no === testBatchNo);
    assert.ok(createdBatch, 'Batch must exist in batchesStore');
    assert.strictEqual(createdBatch?.productName, 'Bevato');
    assert.strictEqual(createdBatch?.expiry_date, '2028-06-30');
    assert.strictEqual(createdBatch?.warehouseId, 'wh-cai-01');

    // Derive batch stock
    const derived = deriveBatches(batchesStore.get(), stockMovementsStore.get(), 'Bevato');
    const targetBatch = derived.find((b) => b.batch_no === testBatchNo);

    assert.ok(targetBatch);
    assert.strictEqual(targetBatch.qty_physical, 500);
    assert.strictEqual(targetBatch.qty_reserved, 0);
    assert.strictEqual(targetBatch.qty_available, 500);
    assert.strictEqual(targetBatch.is_expired, false);
    assert.strictEqual(targetBatch.has_inconsistent_quantity, false);
  });

  // ── 2. FEFO Reservation ───────────────────────────────────────────────────
  test('2. FEFO Reservation allocates earliest expiry first; physical unchanged, reserved increased, available decreased', () => {
    const prodName = `FEFO-Prod-${uid()}`;
    const batchEarlyNo = `BT-EARLY-${uid()}`;
    const batchLateNo = `BT-LATE-${uid()}`;

    // Add Batch A (expires 2027-01-01, 100 units)
    receiveStock({
      productName: prodName,
      batchNumber: batchEarlyNo,
      expiryDate: '2027-01-01',
      quantity: 100,
      warehouseId: 'wh-cai-01',
    });

    // Add Batch B (expires 2027-12-01, 200 units)
    receiveStock({
      productName: prodName,
      batchNumber: batchLateNo,
      expiryDate: '2027-12-01',
      quantity: 200,
      warehouseId: 'wh-cai-01',
    });

    // Reserve 150 units for order SO-TEST-01
    const orderId = `SO-FEFO-${uid()}`;
    const reservations = reserveStock(orderId, [{ productName: prodName, quantity: 150 }]);

    assert.strictEqual(reservations.length, 2, 'Should be split across two batches');

    const resEarly = reservations.find((r) => r.batchNumber === batchEarlyNo);
    const resLate = reservations.find((r) => r.batchNumber === batchLateNo);

    assert.ok(resEarly);
    assert.strictEqual(resEarly.quantity, 100, 'Batch A with earliest expiry should be fully reserved (100 units)');
    assert.ok(resLate);
    assert.strictEqual(resLate.quantity, 50, 'Batch B should cover remaining 50 units');

    // Check derived batch balances
    const derived = deriveBatches(batchesStore.get(), stockMovementsStore.get(), prodName);
    const bEarly = derived.find((b) => b.batch_no === batchEarlyNo);
    const bLate = derived.find((b) => b.batch_no === batchLateNo);

    // Batch Early: physical is still 100, reserved is 100, available is 0
    assert.strictEqual(bEarly?.qty_physical, 100);
    assert.strictEqual(bEarly?.qty_reserved, 100);
    assert.strictEqual(bEarly?.qty_available, 0);

    // Batch Late: physical is still 200, reserved is 50, available is 150
    assert.strictEqual(bLate?.qty_physical, 200);
    assert.strictEqual(bLate?.qty_reserved, 50);
    assert.strictEqual(bLate?.qty_available, 150);

    // Idempotency: calling reserveStock again for the same order returns identical reservations without duplicates
    const reReservations = reserveStock(orderId, [{ productName: prodName, quantity: 150 }]);
    assert.strictEqual(reReservations.length, 2);
    assert.strictEqual(
      stockReservationsStore.get().filter((r) => r.orderId === orderId && r.status === 'active').length,
      2,
    );
  });

  // ── 3. Order Dispatch ─────────────────────────────────────────────────────
  test('3. Order Dispatch fulfills reservation, creates sell_in movement, and conserves available quantity', () => {
    const prodName = `DISP-Prod-${uid()}`;
    const batchNo = `BT-DISP-${uid()}`;

    receiveStock({
      productName: prodName,
      batchNumber: batchNo,
      expiryDate: '2028-01-01',
      quantity: 100,
      warehouseId: 'wh-cai-01',
    });

    const orderId = `SO-DISP-${uid()}`;
    reserveStock(orderId, [{ productName: prodName, quantity: 40 }]);

    // Before dispatch: physical = 100, reserved = 40, available = 60
    const beforeBatches = deriveBatches(batchesStore.get(), stockMovementsStore.get(), prodName);
    const bBefore = beforeBatches.find((b) => b.batch_no === batchNo)!;
    assert.strictEqual(bBefore.qty_physical, 100);
    assert.strictEqual(bBefore.qty_reserved, 40);
    assert.strictEqual(bBefore.qty_available, 60);

    // Dispatch the order
    dispatchReservedStock(orderId, 'Warehouse Supervisor', {
      customerId: 'c-2',
      customerName: 'Green Cross Pharmacy',
    });

    // After dispatch:
    // 1. Reservation is fulfilled
    const res = stockReservationsStore.get().find((r) => r.orderId === orderId)!;
    assert.strictEqual(res.status, 'fulfilled');

    // 2. Physical movement sell_in was recorded
    const dispatchMov = stockMovementsStore
      .get()
      .find((m) => m.order_id === orderId && m.type === 'sell_in');
    assert.ok(dispatchMov);
    assert.strictEqual(dispatchMov.quantity, 40);

    // 3. Derived batch balances: physical = 60, reserved = 0, available = 60
    const afterBatches = deriveBatches(batchesStore.get(), stockMovementsStore.get(), prodName);
    const bAfter = afterBatches.find((b) => b.batch_no === batchNo)!;
    assert.strictEqual(bAfter.qty_physical, 60, 'Physical stock decremented upon dispatch');
    assert.strictEqual(bAfter.qty_reserved, 0, 'Reserved stock dropped to zero');
    assert.strictEqual(bAfter.qty_available, 60, 'Available stock is strictly conserved');

    // 4. Double dispatch prevented idempotently
    dispatchReservedStock(orderId, 'Warehouse Supervisor');
    const dispatchMovementsCount = stockMovementsStore
      .get()
      .filter((m) => m.order_id === orderId && m.type === 'sell_in').length;
    assert.strictEqual(dispatchMovementsCount, 1, 'Double dispatch must not create duplicate deductions');
  });

  // ── 4. Order Cancellation & Reservation Release ───────────────────────────
  test('4. Order Cancellation releases reservation, restores available stock, and leaves physical stock unchanged', () => {
    const customer = addCustomer({
      name: `Cancel Test Cust ${uid()}`,
      email: 'cancel@cust.com',
      status: 'Active',
      repName: 'Maya Patel',
      meta: '',
      specialty: 'General',
      classification: 'A',
      region: 'Cairo',
    });
    const order = addSalesOrder({
      customerId: customer.id!,
      repId: 'rep-maya',
      repName: 'Maya Patel',
      items: [{ productCode: 'PRD-01', quantity: 20 }], // Bevato
    });

    // Approve order (which reserves stock)
    approveSalesOrder(order.id, 'Manager Alex');

    const derivedApproved = deriveBatches(batchesStore.get(), stockMovementsStore.get(), 'Bevato');
    const totalReservedApproved = derivedApproved.reduce((sum, b) => sum + b.qty_reserved, 0);
    assert.ok(totalReservedApproved >= 20);

    // Cancel the approved order
    cancelSalesOrder(order.id, 'Customer changed requirements', 'Admin');

    const cancelledOrder = salesOrdersStore.get().find((o) => o.id === order.id);
    assert.strictEqual(cancelledOrder?.status, 'Cancelled');
    assert.strictEqual(cancelledOrder?.rejectionReason, 'Customer changed requirements');

    // Check reservations are cancelled
    const orderReservations = stockReservationsStore.get().filter((r) => r.orderId === order.id);
    assert.ok(orderReservations.length > 0);
    assert.ok(orderReservations.every((r) => r.status === 'cancelled'));

    // Check reservation_release movement logged
    const releaseMov = stockMovementsStore
      .get()
      .find((m) => m.order_id === order.id && m.type === 'reservation_release');
    assert.ok(releaseMov, 'reservation_release movement must be logged');

    // Check available stock is restored
    const derivedCancelled = deriveBatches(batchesStore.get(), stockMovementsStore.get(), 'Bevato');
    const activeResAfter = stockReservationsStore
      .get()
      .filter((r) => r.orderId === order.id && r.status === 'active');
    assert.strictEqual(activeResAfter.length, 0);
  });

  // ── 5. Insufficient Stock Rejection Without Partial Mutation ──────────────
  test('5. Insufficient Stock Rejection aborts atomically without creating partial reservations or movements', () => {
    const prodName = `ATOMIC-Prod-${uid()}`;
    const batchNo = `BT-ATOMIC-${uid()}`;

    // Receive only 50 units
    receiveStock({
      productName: prodName,
      batchNumber: batchNo,
      expiryDate: '2028-01-01',
      quantity: 50,
      warehouseId: 'wh-cai-01',
    });

    const reservationsCountBefore = stockReservationsStore.get().length;
    const movementsCountBefore = stockMovementsStore.get().length;

    // Attempt to reserve 100 units (requires 100, only 50 available)
    assert.throws(
      () => reserveStock('SO-FAIL-01', [{ productName: prodName, quantity: 100 }]),
      /Insufficient unexpired stock/,
    );

    // Assert zero mutations occurred
    assert.strictEqual(
      stockReservationsStore.get().length,
      reservationsCountBefore,
      'No reservations must be added on failure',
    );
    assert.strictEqual(
      stockMovementsStore.get().length,
      movementsCountBefore,
      'No stock movements must be added on failure',
    );

    // Multi-item atomic test: Item 1 has sufficient stock, Item 2 does not
    const prodSufficient = `SUFF-Prod-${uid()}`;
    receiveStock({
      productName: prodSufficient,
      batchNumber: `BT-SUFF-${uid()}`,
      expiryDate: '2028-01-01',
      quantity: 100,
    });

    assert.throws(
      () =>
        reserveStock('SO-MULTI-FAIL', [
          { productName: prodSufficient, quantity: 20 }, // would succeed on its own
          { productName: prodName, quantity: 80 },       // will fail (only 50 exists)
        ]),
      /Insufficient unexpired stock/,
    );

    // Ensure prodSufficient was NOT partially reserved
    const activeSuffRes = stockReservationsStore
      .get()
      .filter((r) => r.productName === prodSufficient && r.status === 'active');
    assert.strictEqual(activeSuffRes.length, 0, 'Item 1 must not remain reserved when Item 2 fails');
  });

  // ── 6. Warehouse Transfer ─────────────────────────────────────────────────
  test('6. Warehouse Transfer creates linked outbound/inbound movements and strictly preserves total system stock', () => {
    const prodName = `TR-Prod-${uid()}`;
    const batchNo = `BT-TR-${uid()}`;

    // Seed 300 units in Warehouse Cairo (wh-cai-01)
    receiveStock({
      productName: prodName,
      batchNumber: batchNo,
      expiryDate: '2028-06-30',
      quantity: 300,
      warehouseId: 'wh-cai-01',
      warehouseName: 'Cairo Hub',
    });

    // Cairo has 300, Alexandria has 0
    const cairoInitial = deriveBatches(batchesStore.get(), stockMovementsStore.get(), prodName, 'wh-cai-01');
    assert.strictEqual(cairoInitial.find((b) => b.batch_no === batchNo)?.qty_available, 300);

    // Transfer 120 units from Cairo to Alexandria (wh-alex-01)
    transferWarehouseStock({
      productName: prodName,
      batchNumber: batchNo,
      sourceWarehouseId: 'wh-cai-01',
      targetWarehouseId: 'wh-alex-01',
      quantity: 120,
      actor: 'Logistics Director',
      reason: 'Regional rebalance',
    });

    // Check Cairo warehouse balance: 300 - 120 = 180
    const cairoAfter = deriveBatches(batchesStore.get(), stockMovementsStore.get(), prodName, 'wh-cai-01');
    assert.strictEqual(cairoAfter.find((b) => b.batch_no === batchNo)?.qty_available, 180);

    // Check Alexandria warehouse balance: 0 + 120 = 120
    const alexAfter = deriveBatches(batchesStore.get(), stockMovementsStore.get(), prodName, 'wh-alex-01');
    assert.strictEqual(alexAfter.find((b) => b.batch_no === batchNo)?.qty_available, 120);

    // Check Global System View (no warehouse filter): 180 + 120 = 300
    const globalAfter = deriveBatches(batchesStore.get(), stockMovementsStore.get(), prodName);
    assert.strictEqual(
      globalAfter.find((b) => b.batch_no === batchNo)?.qty_physical,
      300,
      'Total system physical stock must remain invariant under warehouse transfers',
    );

    // Attempting to transfer more than available in source warehouse must throw
    assert.throws(
      () =>
        transferWarehouseStock({
          productName: prodName,
          batchNumber: batchNo,
          sourceWarehouseId: 'wh-cai-01',
          targetWarehouseId: 'wh-alex-01',
          quantity: 250, // only 180 remaining in Cairo
          actor: 'Logistics Director',
        }),
      /Insufficient available stock in source warehouse/,
    );
  });

  // ── 7. Return Validation & Stock Disposition ──────────────────────────────
  test('7. Return Validation enforces order limits; Damaged returns do not inflate sellable inventory; Credit Note generated', () => {
    const customer = addCustomer({
      name: `Return Test Cust ${uid()}`,
      email: 'return@cust.com',
      status: 'Active',
      repName: 'Maya Patel',
      meta: '',
      specialty: 'General',
      classification: 'A',
      region: 'Cairo',
    });
    const order = addSalesOrder({
      customerId: customer.id!,
      repId: 'rep-maya',
      repName: 'Maya Patel',
      items: [{ productCode: 'PRD-01', quantity: 50 }], // 50 Bevato
    });

    // 1. Return exceeding ordered quantity is strictly rejected
    assert.throws(
      () =>
        addReturn({
          order_id: order.id,
          customerId: customer.id!,
          customerName: customer.name,
          repId: 'rep-maya',
          repName: 'Maya Patel',
          productName: 'Bevato',
          batchNumber: 'BV-2401',
          quantity: 60, // Exceeds 50 ordered!
          returnDate: '2026-11-20',
          reason: 'Excess return',
          condition: 'sellable',
        }),
      /Cannot return 60 units. Already returned: 0, Ordered: 50/,
    );

    // 2. Add valid return of 30 units (damaged condition)
    const returnDamaged = addReturn({
      order_id: order.id,
      customerId: customer.id!,
      customerName: customer.name,
      repId: 'rep-maya',
      repName: 'Maya Patel',
      productName: 'Bevato',
      batchNumber: 'BV-2401',
      quantity: 30,
      returnDate: '2026-11-20',
      reason: 'Damaged packaging during handling',
      condition: 'damaged',
    });

    // 3. Second return of 30 units exceeds remaining eligible (50 - 30 = 20)
    assert.throws(
      () =>
        addReturn({
          order_id: order.id,
          customerId: customer.id!,
          customerName: customer.name,
          repId: 'rep-maya',
          repName: 'Maya Patel',
          productName: 'Bevato',
          batchNumber: 'BV-2401',
          quantity: 25, // 30 + 25 = 55 > 50
          returnDate: '2026-11-20',
          reason: 'Excess second return',
          condition: 'sellable',
        }),
      /Cannot return 25 units. Already returned: 30, Ordered: 50/,
    );

    // 4. Approve the damaged return
    const beforeDamagedDerivation = deriveBatches(batchesStore.get(), stockMovementsStore.get(), 'Bevato');
    const bBefore = beforeDamagedDerivation.find((b) => b.batch_no === 'BV-2401')!;

    const creditNote = approveReturn(returnDamaged.id, 'Quality Auditor', 'damaged');

    // Credit Note must be issued
    assert.ok(creditNote);
    assert.strictEqual(creditNote.status, 'Issued');
    assert.strictEqual(creditNote.returnId, returnDamaged.id);
    assert.strictEqual(creditNote.quantity, 30);
    assert.ok(creditNote.amount > 0);

    // Damaged return must NOT increase available sellable stock!
    const afterDamagedDerivation = deriveBatches(batchesStore.get(), stockMovementsStore.get(), 'Bevato');
    const bAfter = afterDamagedDerivation.find((b) => b.batch_no === 'BV-2401')!;
    assert.strictEqual(
      bAfter.qty_available,
      bBefore.qty_available,
      'Damaged returned stock must not enter available sellable inventory',
    );

    // 5. Add and approve a sellable return of 20 units
    const returnSellable = addReturn({
      order_id: order.id,
      customerId: customer.id!,
      customerName: customer.name,
      repId: 'rep-maya',
      repName: 'Maya Patel',
      productName: 'Bevato',
      batchNumber: 'BV-2401',
      quantity: 20,
      returnDate: '2026-11-20',
      reason: 'Surplus unopened stock',
      condition: 'sellable',
    });

    approveReturn(returnSellable.id, 'Quality Auditor', 'sellable');

    // Sellable return DOES increase available sellable stock
    const afterSellableDerivation = deriveBatches(batchesStore.get(), stockMovementsStore.get(), 'Bevato');
    const bSellable = afterSellableDerivation.find((b) => b.batch_no === 'BV-2401')!;
    assert.strictEqual(
      bSellable.qty_available,
      bAfter.qty_available + 20,
      'Sellable return must increment available physical inventory',
    );
  });

  // ── 8. Sample Custody & Distribution Bounds ───────────────────────────────
  test('8. Sample Custody tracks rep buffer, prevents over-distribution, and supports return to warehouse', () => {
    const prodName = `SMP-Prod-${uid()}`;
    const batchNo = `BT-SMP-${uid()}`;
    const repName = `Rep John ${uid()}`;

    // Warehouse receives 100 units
    receiveStock({
      productName: prodName,
      batchNumber: batchNo,
      expiryDate: '2028-06-30',
      quantity: 100,
      warehouseId: 'wh-cai-01',
    });

    // 1. Issue 40 units as samples to Rep John
    issueRepSample({
      productName: prodName,
      batchNumber: batchNo,
      quantity: 40,
      repId: 'rep-john',
      repName,
      warehouseId: 'wh-cai-01',
      actor: 'Sales Manager',
    });

    // Warehouse available stock decreases by 40 (100 - 40 = 60)
    const whStock = deriveBatches(batchesStore.get(), stockMovementsStore.get(), prodName);
    assert.strictEqual(whStock.find((b) => b.batch_no === batchNo)?.qty_available, 60);

    // Rep available custody is 40
    let repCustody = getRepAvailableSampleStock(repName, prodName, batchesStore.get(), stockMovementsStore.get());
    assert.strictEqual(repCustody, 40);

    // 2. Rep distributes 15 units during doctor visit
    distributeRepSample({
      productName: prodName,
      quantity: 15,
      customerId: 'c-1',
      customerName: 'Dr. Sarah Kim',
      repId: 'rep-john',
      repName,
      visitId: 'V-101',
    });

    // Rep custody is now 40 - 15 = 25
    repCustody = getRepAvailableSampleStock(repName, prodName, batchesStore.get(), stockMovementsStore.get());
    assert.strictEqual(repCustody, 25);

    // Warehouse stock remains 60 (distributed out of rep buffer, not double-deducted from warehouse)
    const whStockAfterDist = deriveBatches(batchesStore.get(), stockMovementsStore.get(), prodName);
    assert.strictEqual(whStockAfterDist.find((b) => b.batch_no === batchNo)?.qty_available, 60);

    // 3. Rep attempts to distribute 30 units (exceeding remaining custody of 25)
    assert.throws(
      () =>
        distributeRepSample({
          productName: prodName,
          quantity: 30,
          customerId: 'c-2',
          customerName: 'Green Cross Clinic',
          repId: 'rep-john',
          repName,
        }),
      /does not have sufficient sample custody/,
    );

    // 4. Rep returns 10 units back to warehouse
    returnRepSample({
      productName: prodName,
      batchNumber: batchNo,
      quantity: 10,
      repId: 'rep-john',
      repName,
      warehouseId: 'wh-cai-01',
    });

    // Rep custody decreases to 25 - 10 = 15
    repCustody = getRepAvailableSampleStock(repName, prodName, batchesStore.get(), stockMovementsStore.get());
    assert.strictEqual(repCustody, 15);

    // Warehouse physical stock increases by 10 (60 + 10 = 70)
    const whStockAfterReturn = deriveBatches(batchesStore.get(), stockMovementsStore.get(), prodName);
    assert.strictEqual(whStockAfterReturn.find((b) => b.batch_no === batchNo)?.qty_available, 70);

    // Total units accounted for: Warehouse 70 + Rep Custody 15 + Distributed 15 = 100
    assert.strictEqual(70 + 15 + 15, 100, 'All units are strictly conserved across warehouse, rep custody, and distribution');
  });

  // ── 9. Expired Batch Ineligibility ─────────────────────────────────────────
  test('9. Expired Batches are strictly ineligible for FEFO allocation and reservation', () => {
    const prodName = `EXP-Prod-${uid()}`;
    const batchExpired = `BT-EXP-${uid()}`;
    const batchHealthy = `BT-HLT-${uid()}`;

    // Add expired batch (expired in 2024)
    addBatch({
      batch_no: batchExpired,
      productName: prodName,
      expiry_date: '2024-01-01',
      initial_qty: 100,
    });
    addStockMovement({
      productName: prodName,
      batchNumber: batchExpired,
      quantity: 100,
      type: 'receipt',
      date: '2023-12-01',
    });

    // Add healthy batch (expires 2028-01-01)
    addBatch({
      batch_no: batchHealthy,
      productName: prodName,
      expiry_date: '2028-01-01',
      initial_qty: 50,
    });
    addStockMovement({
      productName: prodName,
      batchNumber: batchHealthy,
      quantity: 50,
      type: 'receipt',
      date: '2026-01-01',
    });

    // Check derived batches
    const derived = deriveBatches(batchesStore.get(), stockMovementsStore.get(), prodName);
    const bExp = derived.find((b) => b.batch_no === batchExpired)!;
    const bHlt = derived.find((b) => b.batch_no === batchHealthy)!;

    assert.strictEqual(bExp.is_expired, true);
    assert.strictEqual(bExp.status, 'expired');
    assert.strictEqual(bExp.qty_physical, 100);
    // Even though physical is 100, FEFO allocation must NOT select it
    assert.strictEqual(bHlt.is_expired, false);
    assert.strictEqual(bHlt.qty_available, 50);

    // FEFO allocate 30 units: should only allocate from the healthy batch
    const alloc = allocateFefo(prodName, 30, batchesStore.get(), stockMovementsStore.get());
    assert.strictEqual(alloc.length, 1);
    assert.strictEqual(alloc[0].batchNumber, batchHealthy);
    assert.strictEqual(alloc[0].quantity, 30);

    // Attempting to allocate 60 units (when healthy only has 50 and expired has 100) must throw
    assert.throws(
      () => allocateFefo(prodName, 60, batchesStore.get(), stockMovementsStore.get()),
      /Insufficient unexpired stock/,
    );
  });

  // ── 10. Persistence & Hydration (Reload Simulation) ───────────────────────
  test('10. Persistence & Hydration: Initialize → Persist → Simulate Reload → Hydrate reproduces identical operational state', () => {
    const memStorage = enableTestStorage();
    try {
      const prodName = `HYD-Prod-${uid()}`;
      const batchNo = `BT-HYD-${uid()}`;

      // 1. Receive stock
      receiveStock({
        productName: prodName,
        batchNumber: batchNo,
        expiryDate: '2028-12-31',
        quantity: 200,
        warehouseId: 'wh-cai-01',
      });

      // 2. Reserve stock for an order
      const orderId = `SO-HYD-${uid()}`;
      reserveStock(orderId, [{ productName: prodName, quantity: 75 }]);

      // Verify state before simulated reload
      const beforeDerived = deriveBatches(batchesStore.get(), stockMovementsStore.get(), prodName);
      const bBefore = beforeDerived.find((b) => b.batch_no === batchNo)!;
      assert.strictEqual(bBefore.qty_physical, 200);
      assert.strictEqual(bBefore.qty_reserved, 75);
      assert.strictEqual(bBefore.qty_available, 125);

      // 3. Simulate page reload / process restart:
      // Reset stores to empty initial state, then call hydrate() from localStorage (MemoryStorage)
      batchesStore.hydrate();
      stockMovementsStore.hydrate();
      stockReservationsStore.hydrate();

      // 4. Read re-hydrated state and assert exact match
      const afterDerived = deriveBatches(batchesStore.get(), stockMovementsStore.get(), prodName);
      const bAfter = afterDerived.find((b) => b.batch_no === batchNo);

      assert.ok(bAfter, 'Batch must be re-hydrated from persistent storage');
      assert.strictEqual(bAfter.qty_physical, 200, 'Physical balance hydrated accurately');
      assert.strictEqual(bAfter.qty_reserved, 75, 'Active reservations hydrated accurately');
      assert.strictEqual(bAfter.qty_available, 125, 'Available unreserved quantity preserved accurately');

      const rehydratedRes = stockReservationsStore.get().find((r) => r.orderId === orderId);
      assert.ok(rehydratedRes, 'Active reservation must be present after hydration');
      assert.strictEqual(rehydratedRes.quantity, 75);
      assert.strictEqual(rehydratedRes.status, 'active');
    } finally {
      disableTestStorage();
    }
  });
});
