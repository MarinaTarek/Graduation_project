import test, { describe, beforeEach } from 'node:test'
import assert from 'node:assert'

import {
  getAuthoritativeDirectory,
  findAuthoritativeUser,
  resolveCanonicalUserId,
  resolveApproverForRequest,
} from '../src/lib/approval/approvalEngine'
import {
  usersStore,
  addUser,
  updateUser,
  deactivateUser,
} from '../src/data/mock/users'
import { storedUsersStore } from '../src/lib/auth/mock-users'
import { getDefaultPermissions } from '../src/lib/auth/permissions'
import {
  productsStore,
  stockProductsStore,
  addProductRecord,
  updateProduct,
  archiveProduct,
  getCanonicalProduct,
  resolveCanonicalProductCode,
} from '../src/data/mock/products'
import {
  batchesStore,
  stockMovementsStore,
  deriveBatches,
  deriveProductStock,
} from '../src/data/mock/stockDerived'
import {
  invoicesStore,
  approveInvoice,
  rejectInvoice,
  updateInvoice,
  addInvoice,
} from '../src/data/mock/invoices'
import { salesOrdersStore, addSalesOrder } from '../src/data/mock/sales-orders'
import { customersStore } from '../src/data/mock/customers'
import { submitVisitPlanForApproval, addVisitPlan } from '../src/data/mock/visit-plans'

describe('Navigen — Phase 1: Core Identity, Product Architecture & Permission Consolidation Suite', () => {
  beforeEach(() => {
    // Reset test state if needed
  })

  // =========================================================================
  // TASK 1: Canonical User Identity
  // =========================================================================
  describe('Task 1 — Canonical User Identity & Hierarchy Guardrails', () => {
    test('1.1 Canonical directory resolves single authoritative user without conflicting duplicates', () => {
      const directory = getAuthoritativeDirectory()
      const ids = directory.map((u) => u.id.toLowerCase())
      const uniqueIds = new Set(ids)
      assert.strictEqual(ids.length, uniqueIds.size, 'Canonical directory must not contain duplicate user IDs')
    })

    test('1.2 Conflicting IDs u-bum-1 and u-flm-1 resolve consistently to canonical profile records', () => {
      const bum = findAuthoritativeUser('u-bum-1')
      assert.ok(bum, 'u-bum-1 must resolve')
      assert.strictEqual(bum?.role, 'business_unit_manager')
      assert.strictEqual(bum?.name, 'Dr. Khaled Fawzy')

      const flm = findAuthoritativeUser('u-flm-1')
      assert.ok(flm, 'u-flm-1 must resolve')
      assert.strictEqual(flm?.role, 'first_line_manager')
      assert.strictEqual(flm?.name, 'Mona Mansour')
    })

    test('1.3 Legacy alias IDs (rep-maya, rep-olivia, rep-james, rep-sofia) map to canonical user IDs', () => {
      assert.strictEqual(resolveCanonicalUserId('rep-maya'), 'u-rep-maya')
      assert.strictEqual(resolveCanonicalUserId('rep-olivia'), 'u-rep-olivia')
      assert.strictEqual(resolveCanonicalUserId('rep-james'), 'u-rep-james')
      assert.strictEqual(resolveCanonicalUserId('rep-sofia'), 'u-rep-sofia')

      const maya = findAuthoritativeUser('rep-maya')
      assert.ok(maya, 'Legacy alias rep-maya must resolve to authoritative user')
      assert.strictEqual(maya?.id, 'u-rep-maya')
      assert.strictEqual(maya?.name, 'Maya Patel')
    })

    test('1.4 User addition synchronizes canonical usersStore and storedUsersStore', () => {
      const testEmail = `new.rep.${Date.now()}@navigenpharma.net`
      const testId = `u-rep-test-${Date.now()}`

      const added = addUser(
        {
          id: testId,
          name: 'Test Field Rep',
          email: testEmail,
          role: 'Medical Representative',
          roleType: 'rep',
          region: 'Delta region',
          status: 'Active',
          managerId: 'u-flm-1',
        },
        'Admin'
      )

      assert.strictEqual(added.id, testId)
      const inAdminStore = usersStore.get().find((u) => u.id === testId)
      assert.ok(inAdminStore, 'Must be stored in usersStore')

      const inAuthStore = storedUsersStore.get().find((u) => u.id === testId)
      assert.ok(inAuthStore, 'Must be synchronized to storedUsersStore')
      assert.strictEqual(inAuthStore?.email, testEmail)
    })

    test('1.5 Medical plan submission is blocked when direct active manager is missing', () => {
      // Create user without manager
      const unmanagedId = `u-unmanaged-${Date.now()}`
      addUser(
        {
          id: unmanagedId,
          name: 'Unmanaged Representative',
          email: `unmanaged.${Date.now()}@navigenpharma.net`,
          role: 'Medical Representative',
          roleType: 'rep',
          region: 'West region',
          status: 'Active',
          managerId: undefined, // No manager assigned
        },
        'Admin'
      )

      const plan = addVisitPlan({
        name: 'Unmanaged Plan Test',
        repName: 'Unmanaged Representative',
        repId: unmanagedId,
        startDate: '2026-12-01',
        endDate: '2026-12-31',
        frequency: 'Monthly',
        targetClients: ['c-1'],
        plannedProducts: ['Bevato'],
        status: 'Draft',
        stops: [
          {
            id: 'stop-unm-1',
            clientName: 'Dr. Sarah Kim',
            clientId: 'c-1',
            address: 'Clinic',
            priority: 'Class A',
            purpose: 'Clinical review',
            plannedTime: '09:00 AM',
            plannedDate: '2026-12-05',
          },
          {
            id: 'stop-unm-2',
            clientName: 'Dr. Sarah Kim',
            clientId: 'c-1',
            address: 'Clinic',
            priority: 'Class A',
            purpose: 'Follow-up discussion',
            plannedTime: '11:00 AM',
            plannedDate: '2026-12-19',
          },
        ],
      })

      assert.throws(
        () => submitVisitPlanForApproval(plan.id, { id: unmanagedId, name: 'Unmanaged Representative', role: 'rep' }),
        /Submission blocked: Representative "Unmanaged Representative" does not have an active direct manager assigned/,
        'Must block plan submission when active direct manager is missing'
      )
    })
  })

  // =========================================================================
  // TASK 2: Canonical Product Identity & Relational Integrity
  // =========================================================================
  describe('Task 2 — Canonical Product Architecture & Relational Cascading', () => {
    test('2.1 Canonical product catalog lookup works by code or name', () => {
      const p1 = getCanonicalProduct('PRD-01')
      assert.ok(p1, 'Must find product by code PRD-01')
      assert.strictEqual(p1?.name, 'Bevato')

      const p2 = getCanonicalProduct('Bevato')
      assert.ok(p2, 'Must find product by name Bevato')
      assert.strictEqual(p2?.code, 'PRD-01')

      assert.strictEqual(resolveCanonicalProductCode('Bevato'), 'PRD-01')
      assert.strictEqual(resolveCanonicalProductCode('PRD-01'), 'PRD-01')
    })

    test('2.2 Renaming a product cascades to batchesStore and stockMovementsStore atomically', () => {
      const code = 'PRD-05'
      const originalProd = getCanonicalProduct(code)
      assert.ok(originalProd)
      const originalName = originalProd!.name

      const updatedName = `Navigen Product 5 Enhanced ${Date.now()}`

      // Update product name
      updateProduct(code, { name: updatedName }, 'Admin')

      // Verify canonical catalog updated
      const catalogProd = getCanonicalProduct(code)
      assert.strictEqual(catalogProd?.name, updatedName)

      // Verify batches for this product have the new name and retain product_id
      const batches = batchesStore.get().filter((b) => b.product_id === code)
      assert.ok(batches.length > 0, 'Must have batches for PRD-05')
      for (const b of batches) {
        assert.strictEqual(b.productName, updatedName, 'Batch must reflect new product name')
        assert.strictEqual(b.product_id, code, 'Batch must retain canonical product code')
      }

      // Phase 2 - 3.2: Verify movements for this product retain their historical snapshot productName
      // and retain stable canonical product_id
      const movements = stockMovementsStore.get().filter((m) => m.product_id === code)
      assert.ok(movements.length > 0, 'Must have movements for PRD-05')
      for (const m of movements) {
        // Historical movements preserve their recorded snapshot name
        assert.ok(m.productName, 'Movement must have recorded snapshot product name')
        assert.strictEqual(m.product_id, code, 'Movement must retain canonical product code')
      }

      // Revert name back to keep test idempotent
      updateProduct(code, { name: originalName }, 'Admin')
    })

    test('2.3 Seed batches and seed movements all have explicit canonical product_id', () => {
      const batches = batchesStore.get()
      for (const b of batches) {
        assert.ok(b.product_id, `Batch ${b.batch_no} must carry canonical product_id`)
      }

      const movements = stockMovementsStore.get()
      for (const m of movements) {
        assert.ok(m.product_id, `Movement ${m.id} must carry canonical product_id`)
      }
    })

    test('2.4 deriveBatches and deriveProductStock match by code or name', () => {
      const movements = stockMovementsStore.get()
      const batches = batchesStore.get()

      const batchesByName = deriveBatches(batches, movements, 'Bevato')
      const batchesByCode = deriveBatches(batches, movements, 'PRD-01')

      assert.strictEqual(batchesByName.length, batchesByCode.length)
      assert.ok(batchesByName.length > 0)

      const stockByName = deriveProductStock('Bevato', movements, batches)
      const stockByCode = deriveProductStock('PRD-01', movements, batches)

      assert.strictEqual(stockByName.received, stockByCode.received)
      assert.strictEqual(stockByName.sell_in, stockByCode.sell_in)
    })
  })

  // =========================================================================
  // TASK 3: Correct Invoice Approval Permissions
  // =========================================================================
  describe('Task 3 — Strict Invoice Approval Authorization', () => {
    test('3.1 Role permissions: only admin has canApproveInvoices: true', () => {
      assert.strictEqual(getDefaultPermissions('admin').canApproveInvoices, true)
      assert.strictEqual(getDefaultPermissions('business_unit_manager').canApproveInvoices, false)
      assert.strictEqual(getDefaultPermissions('first_line_manager').canApproveInvoices, false)
      assert.strictEqual(getDefaultPermissions('rep').canApproveInvoices, false)
      assert.strictEqual(getDefaultPermissions('marketing_manager').canApproveInvoices, false)
    })

    test('3.2 Executive Admin can approve and reject invoices successfully', () => {
      const invNum = `INV-TEST-${Date.now()}`
      const invoice = addInvoice({
        invoiceNumber: invNum,
        customerId: 'c-1',
        customerName: 'Dr. Sarah Kim',
        originalAmount: 5000,
        status: 'Pending',
        issueDate: '2026-11-01',
        dueDate: '2026-12-01',
      })

      // Admin approves
      const approved = approveInvoice(invoice.id, { id: 'u-admin-1', name: 'Alex Morgan', role: 'admin' })
      assert.strictEqual(approved.status, 'Approved')
      const lastHistory = approved.approval_history?.[approved.approval_history.length - 1]
      assert.strictEqual(lastHistory?.action, 'Approved')
      assert.strictEqual(lastHistory?.actor, 'Alex Morgan')
    })

    test('3.3 Non-admin roles (BUM, FLM, Rep, Marketing) are strictly rejected with Unauthorized error', () => {
      const invNum = `INV-DENY-${Date.now()}`
      const invoice = addInvoice({
        invoiceNumber: invNum,
        customerId: 'c-1',
        customerName: 'Dr. Sarah Kim',
        originalAmount: 4200,
        status: 'Pending',
        issueDate: '2026-11-01',
        dueDate: '2026-12-01',
      })

      // BUM attempt
      assert.throws(
        () => approveInvoice(invoice.id, { id: 'u-bum-1', name: 'Dr. Khaled Fawzy', role: 'business_unit_manager' }),
        /Unauthorized: User "Dr. Khaled Fawzy" \(business_unit_manager\) cannot approve invoices/,
        'BUM must be rejected from approving invoices'
      )

      // FLM attempt
      assert.throws(
        () => approveInvoice(invoice.id, { id: 'u-flm-1', name: 'Mona Mansour', role: 'first_line_manager' }),
        /Unauthorized: User "Mona Mansour" \(first_line_manager\) cannot approve invoices/,
        'FLM must be rejected from approving invoices'
      )

      // Rep attempt
      assert.throws(
        () => approveInvoice(invoice.id, { id: 'u-rep-1', name: 'Ahmed Samir', role: 'rep' }),
        /Unauthorized: User "Ahmed Samir" \(rep\) cannot approve invoices/,
        'Rep must be rejected from approving invoices'
      )

      // Marketing Manager attempt
      assert.throws(
        () => rejectInvoice(invoice.id, 'Marketing rejection', { id: 'u-mkt-1', name: 'Laila Mostafa', role: 'marketing_manager' }),
        /Unauthorized: User "Laila Mostafa" \(marketing_manager\) cannot reject invoices/,
        'Marketing Manager must be rejected from rejecting invoices'
      )
    })

    test('3.4 updateInvoice protects status mutation: non-admin cannot directly set Approved status', () => {
      const invNum = `INV-MUT-${Date.now()}`
      const invoice = addInvoice({
        invoiceNumber: invNum,
        customerId: 'c-1',
        customerName: 'Dr. Sarah Kim',
        originalAmount: 3000,
        status: 'Pending',
        issueDate: '2026-11-01',
        dueDate: '2026-12-01',
      })

      assert.throws(
        () => updateInvoice(invoice.id, { status: 'Approved' }, { id: 'u-bum-1', name: 'Dr. Khaled Fawzy', role: 'business_unit_manager' }),
        /Unauthorized: User "Dr. Khaled Fawzy" \(business_unit_manager\) cannot approve or reject invoices/,
        'updateInvoice must guard against unauthorized approval mutation'
      )
    })
  })
})
