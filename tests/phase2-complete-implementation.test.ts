import { describe, test, beforeEach } from 'node:test'
import assert from 'node:assert'

import {
  doctorQuotaPoliciesStore,
  doctorQuotaReservationsStore,
  sampleQuotaOverridesStore,
  sampleDistributionRequestsStore,
  upsertDoctorQuotaPolicy,
  getDoctorQuotaStatus,
  submitSampleDistributionRequest,
  reviewQuotaOverride,
  confirmSampleDistribution,
  cancelSampleDistributionRequest,
} from '../src/data/mock/sampleQuota'
import {
  batchesStore,
  stockMovementsStore,
  addStockMovement,
  deriveBatches,
} from '../src/data/mock/stockDerived'
import {
  usersStore,
  storedUsersStore,
  approveSignUpRequest,
  rejectSignUpRequest,
  addUser,
} from '../src/data/mock/users'
import {
  visitPlansStore,
  addVisitPlan,
  updateVisitPlan,
  submitVisitPlanForApproval,
  reassignRepresentativeManager,
  deriveCalendarEntriesFromVisitPlans,
} from '../src/data/mock/visit-plans'
import {
  productsStore,
  updateProduct,
} from '../src/data/mock/products'
import { findAuthoritativeUser } from '../src/lib/approval/approvalEngine'

describe('Navigen — Phase 2 Comprehensive Test Suite', () => {

  // =========================================================================
  // PART 1: Core Integrity Fixes
  // =========================================================================
  describe('1. Phase 1 Core Integrity Fixes', () => {
    test('1.1 Centralized sign-up approval creates canonical user and synchronizes auth status', () => {
      const email = `signup.test.${Date.now()}@navigenpharma.net`
      const id = `u-signup-${Date.now()}`

      // Stage pending request in storedUsersStore
      storedUsersStore.update((list: any[]) => [
        {
          id,
          name: 'Dr. Test Candidate',
          email,
          role: 'rep',
          region: 'Delta region',
          status: 'pending',
          emailVerified: false,
          permissions: {} as any,
          passwordHash: 'Pass123!',
        },
        ...list,
      ])

      const approved = approveSignUpRequest(
        id,
        {
          role: 'rep',
          region: 'Delta region',
          managerId: 'u-flm-1',
        },
        'u-admin-1'
      )

      assert.strictEqual(approved.id, id)
      assert.strictEqual(approved.status, 'Active')
      assert.strictEqual(approved.managerId, 'u-flm-1')

      // Verify in usersStore
      const inAdmin = usersStore.get().find((u) => u.id === id)
      assert.ok(inAdmin, 'Must exist in usersStore')
      assert.strictEqual(inAdmin?.status, 'Active')

      // Verify in storedUsersStore
      const inAuth = storedUsersStore.get().find((u: any) => u.id === id)
      assert.ok(inAuth, 'Must exist in storedUsersStore')
      assert.strictEqual(inAuth?.status, 'active')
      assert.strictEqual(inAuth?.emailVerified, true)
    })

    test('1.2 Duplicate sign-up approval is rejected', () => {
      const id = `u-rep-maya` // Already active
      assert.throws(
        () => approveSignUpRequest(id, { role: 'rep' }, 'u-admin-1'),
        /is not pending/,
        'Cannot approve non-pending user'
      )
    })

    test('1.3 Unauthorized sign-up approval throws error', () => {
      const id = `u-test-unauth-${Date.now()}`
      storedUsersStore.update((list: any[]) => [
        {
          id,
          name: 'Unauth Candidate',
          email: `${id}@test.com`,
          role: 'rep',
          region: 'West',
          status: 'pending',
          emailVerified: false,
          permissions: {} as any,
          passwordHash: 'P!',
        },
        ...list,
      ])

      assert.throws(
        () => approveSignUpRequest(id, {}, { id: 'u-rep-maya', role: 'rep' }),
        /cannot perform administrative user management/,
        'Rep cannot approve sign-up requests'
      )
    })

    test('1.4 Product rename preserves historical stock movement snapshot productName', () => {
      const canonCode = 'PRD-01'
      const originalProd = productsStore.get().find((p) => p.code === canonCode)
      assert.ok(originalProd, 'PRD-01 must exist')
      const origName = originalProd.name

      // Create a test movement with historical snapshot name
      const testSmId = `sm-hist-snap-${Date.now()}`
      stockMovementsStore.update((list) => [
        {
          id: testSmId,
          product_id: canonCode,
          productName: origName,
          quantity: 10,
          type: 'sample',
          batchNumber: 'BV-2401',
          date: '2026-09-01',
          customer_id: 'c-1',
          customerName: 'Dr. Sarah Kim',
          rep_id: 'u-admin-1',
          repName: 'Alex Morgan',
        },
        ...list,
      ])

      // Rename product
      const tempNewName = `Bevato Cardio Renamed ${Date.now()}`
      updateProduct(canonCode, { name: tempNewName }, 'Admin')

      // Verify movement snapshot name was NOT rewritten
      const movement = stockMovementsStore.get().find((m) => m.id === testSmId)
      assert.strictEqual(
        movement?.productName,
        origName,
        'Historical movement must retain its original recorded snapshot productName'
      )
      assert.strictEqual(
        movement?.product_id,
        canonCode,
        'Historical movement must retain stable product_id'
      )

      // Restore original name
      updateProduct(canonCode, { name: origName }, 'Admin')
    })

    test('1.5 Outbound movement creating negative physical stock is blocked pre-transaction', () => {
      // Find a batch with known physical stock
      const batches = batchesStore.get()
      const targetBatch = batches[0]
      const derived = deriveBatches([targetBatch], stockMovementsStore.get())[0]
      const excessiveQty = derived.qty_physical + 50000

      assert.throws(
        () =>
          addStockMovement({
            product_id: targetBatch.product_id || 'PRD-01',
            productName: targetBatch.productName,
            batchNumber: targetBatch.batch_no,
            batch_id: targetBatch.id,
            quantity: excessiveQty,
            type: 'dispatch',
          }),
        /Insufficient physical stock in batch/,
        'Must block transaction that induces negative physical stock'
      )
    })
  })

  // =========================================================================
  // PART 2: Doctor Sample Quotas & Rep Custody
  // =========================================================================
  describe('2. Doctor Sample Quotas & Rep Custody Architecture', () => {
    test('2.1 Doctor quota is calculated separately per product and shared across representatives', () => {
      const docId = 'c-1' // Dr. Sarah Kim
      const quotaP1 = getDoctorQuotaStatus(docId, 'PRD-01') // Bevato
      const quotaP2 = getDoctorQuotaStatus(docId, 'PRD-02') // Naviro D3 50k

      assert.ok(quotaP1.hasPolicy, 'Dr. Sarah Kim must have Bevato policy')
      assert.ok(quotaP2.hasPolicy, 'Dr. Sarah Kim must have Naviro policy')
      assert.notStrictEqual(
        quotaP1.allowedQuota,
        quotaP2.allowedQuota,
        'Different products must have independent quota amounts'
      )
      assert.strictEqual(quotaP1.productId, 'PRD-01')
      assert.strictEqual(quotaP2.productId, 'PRD-02')
    })

    test('2.2 Admin configures custom quota policy and prevents overlapping active policies', () => {
      const testDoc = 'c-7'
      const testProd = 'PRD-03'

      const policy = upsertDoctorQuotaPolicy(
        {
          doctorId: testDoc,
          doctorName: 'St. Jude Medical',
          productId: testProd,
          allowedQuantity: 15,
          periodType: 'monthly',
          startDate: '2026-10-01',
          endDate: '2026-12-31',
          status: 'active',
          createdBy: 'u-admin-1',
        },
        'u-admin-1'
      )

      assert.strictEqual(policy.allowedQuantity, 15)
      assert.strictEqual(policy.periodType, 'monthly')

      // Attempting to add an overlapping active policy must throw
      assert.throws(
        () =>
          upsertDoctorQuotaPolicy(
            {
              doctorId: testDoc,
              doctorName: 'St. Jude Medical',
              productId: testProd,
              allowedQuantity: 30,
              periodType: 'monthly',
              startDate: '2026-11-01',
              endDate: '2026-12-31',
              status: 'active',
              createdBy: 'u-admin-1',
            },
            'u-admin-1'
          ),
        /An active quota policy already exists/,
        'Must prevent overlapping active quota policies for same doctor and product'
      )
    })

    test('2.3 Non-admin cannot configure doctor quota policies', () => {
      assert.throws(
        () =>
          upsertDoctorQuotaPolicy(
            {
              doctorId: 'c-2',
              productId: 'PRD-01',
              allowedQuantity: 50,
              periodType: 'monthly',
              startDate: '2026-10-01',
              status: 'active',
              createdBy: 'u-rep-maya',
            },
            { id: 'u-rep-maya', role: 'rep' }
          ),
        /Unauthorized/,
        'Only Admin can configure doctor quota policies'
      )
    })
  })

  // =========================================================================
  // PART 3: Quota Reservations & Admin Overrides
  // =========================================================================
  describe('3. Quota Reservations, Admin Overrides & Distribution Lifecycle', () => {
    test('3.1 Request within doctor quota reserves quota and auto-approves', () => {
      // Ensure rep has sample custody for test
      const testRepId = 'u-admin-1'
      const testDocId = 'c-1'
      const testProd = 'PRD-01'

      // Give rep sample custody in stock movements
      stockMovementsStore.update((list) => [
        {
          id: `sm-custody-test-${Date.now()}`,
          product_id: testProd,
          productName: 'Bevato',
          batchNumber: 'BV-2401',
          batch_id: 'b-01',
          quantity: 100,
          type: 'transfer_rep',
          date: '2026-10-01',
          rep_id: testRepId,
          repName: 'Alex Morgan',
        },
        ...list,
      ])

      const request = submitSampleDistributionRequest(
        {
          doctorId: testDocId,
          doctorName: 'Dr. Sarah Kim',
          repId: testRepId,
          repName: 'Alex Morgan',
          items: [{ productId: testProd, quantity: 2 }],
        },
        testRepId
      )

      assert.strictEqual(request.status, 'approved')
      assert.strictEqual(request.requiresOverride, false)

      // Verify reservation was created
      const reservations = doctorQuotaReservationsStore.get()
      const res = reservations.find((r) => r.requestId === request.id)
      assert.ok(res, 'Reservation must exist')
      assert.strictEqual(res?.quantity, 2)
      assert.strictEqual(res?.status, 'reserved')
    })

    test('3.2 Distribution exceeding Doctor quota generates pending override and reserves remaining quota', () => {
      const testDoc = 'c-1'
      const testProd = 'PRD-01'
      const testRep = 'u-admin-1'

      const statusBefore = getDoctorQuotaStatus(testDoc, testProd)
      const excessQty = statusBefore.remainingQuota + 5

      const request = submitSampleDistributionRequest(
        {
          doctorId: testDoc,
          doctorName: 'Dr. Sarah Kim',
          repId: testRep,
          repName: 'Alex Morgan',
          items: [{ productId: testProd, quantity: excessQty }],
          notes: 'Special clinical trial requirement',
        },
        testRep
      )

      assert.strictEqual(request.status, 'pending_override')
      assert.strictEqual(request.requiresOverride, true)
      assert.ok(request.overrideIds && request.overrideIds.length > 0)

      const override = sampleQuotaOverridesStore.get().find((o) => o.id === request.overrideIds![0])
      assert.ok(override, 'Override record must exist')
      assert.strictEqual(override?.status, 'pending')
      assert.strictEqual(override?.approvedExcessQuantity, 5)
    })

    test('3.3 Admin approves override; request moves to approved and executes physical distribution', () => {
      const pending = sampleQuotaOverridesStore.get().find((o) => o.status === 'pending')
      if (pending) {
        // Approve override
        const approved = reviewQuotaOverride(pending.id, 'approve', 'u-admin-1', 'Approved for trial')
        assert.strictEqual(approved.status, 'approved')

        // Confirm distribution
        const distributed = confirmSampleDistribution(pending.requestId, 'u-admin-1')
        assert.strictEqual(distributed.status, 'distributed')
        assert.ok(distributed.distributed_at)

        // Verify reservations are consumed
        const resList = doctorQuotaReservationsStore.get().filter((r) => r.requestId === pending.requestId)
        assert.ok(resList.every((r) => r.status === 'consumed'), 'All reservations must be consumed')
      }
    })

    test('3.4 Insufficient Rep custody blocks distribution regardless of doctor quota override', () => {
      const testDoc = 'c-1'
      const testProd = 'PRD-01'
      const unstockedRep = 'u-rep-sofia' // Zero custody for PRD-01

      assert.throws(
        () =>
          submitSampleDistributionRequest(
            {
              doctorId: testDoc,
              repId: unstockedRep,
              repName: 'Sofia Rodriguez',
              items: [{ productId: testProd, quantity: 50 }],
            },
            unstockedRep
          ),
        /Insufficient representative custody/,
        'Must block request when representative custody is insufficient'
      )
    })

    test('3.5 Cancelling request releases quota reservations', () => {
      const testRep = 'u-admin-1'
      const req = submitSampleDistributionRequest(
        {
          doctorId: 'c-5',
          doctorName: 'Dr. Emily Watson',
          repId: testRep,
          repName: 'Alex Morgan',
          items: [{ productId: 'PRD-01', quantity: 1 }],
        },
        testRep
      )

      const cancelled = cancelSampleDistributionRequest(req.id, testRep, 'Doctor unavailable')
      assert.strictEqual(cancelled.status, 'cancelled')

      const reservations = doctorQuotaReservationsStore.get().filter((r) => r.requestId === req.id)
      assert.ok(reservations.every((r) => r.status === 'released'), 'All reservations must be released upon cancellation')
    })
  })

  // =========================================================================
  // PART 4: Medical Plan Manager Reassignment & Calendar Sync
  // =========================================================================
  describe('4. Medical Plan Manager Reassignment & Calendar Synchronization', () => {
    test('4.1 Admin reassigns representative manager and routes pending plans with history preserved', () => {
      const testRepId = `u-rep-transfer-${Date.now()}`
      addUser(
        {
          id: testRepId,
          name: 'Transfer Rep',
          email: `${testRepId}@navigen.eg`,
          role: 'Medical Representative',
          roleType: 'rep',
          region: 'Delta region',
          status: 'Active',
          managerId: 'u-flm-1', // Initially Mona Mansour
        },
        'Admin'
      )

      // Create a pending visit plan
      const plan = addVisitPlan({
        name: 'Transferred Rep Plan',
        repName: 'Transfer Rep',
        repId: testRepId,
        startDate: '2026-12-01',
        endDate: '2026-12-31',
        frequency: 'Monthly',
        targetClients: ['c-1'],
        plannedProducts: ['Bevato'],
        status: 'Draft',
        stops: [
          {
            id: 'stop-t-1',
            clientName: 'Dr. Sarah Kim',
            clientId: 'c-1',
            address: 'Clinic',
            priority: 'Class A',
            purpose: 'Clinical update',
            plannedTime: '09:00 AM',
            plannedDate: '2026-12-05',
          },
          {
            id: 'stop-t-2',
            clientName: 'Dr. Sarah Kim',
            clientId: 'c-1',
            address: 'Clinic',
            priority: 'Class A',
            purpose: 'Follow-up',
            plannedTime: '10:00 AM',
            plannedDate: '2026-12-15',
          },
        ],
      })

      // Submit plan to current manager
      submitVisitPlanForApproval(plan.id, { id: testRepId, name: 'Transfer Rep', role: 'rep' })

      // Reassign to Dr. Khaled Fawzy (u-bum-1)
      const reassignment = reassignRepresentativeManager(
        testRepId,
        'u-bum-1',
        'u-admin-1',
        { notes: 'Promoted to direct BUM supervision' }
      )

      assert.strictEqual(reassignment.newManagerId, 'u-bum-1')
      assert.strictEqual(reassignment.previousManagerId, 'u-flm-1')
      assert.strictEqual(reassignment.reassignedPlansCount, 1)

      // Verify the pending plan approver was updated
      const updatedPlan = visitPlansStore.get().find((p) => p.id === plan.id)
      assert.strictEqual(updatedPlan?.assignedApproverId, 'u-bum-1')
      assert.strictEqual(updatedPlan?.assignedApproverName, 'Dr. Khaled Fawzy')

      // Verify approval history was appended, not deleted
      const hist = updatedPlan?.approvalHistory
      assert.ok(hist && hist.length > 0)
      const lastEntry = hist[hist.length - 1]
      assert.strictEqual(lastEntry.action, 'Manager Reassigned')
      assert.strictEqual(lastEntry.assignedApproverId, 'u-bum-1')
    })

    test('4.2 Material plan edit on Approved plan returns status to Pending Approval', () => {
      // Create and approve a plan
      const rep = findAuthoritativeUser('u-rep-maya')
      assert.ok(rep, 'Maya must exist')

      const plan = addVisitPlan({
        name: 'Editable Approved Plan',
        repName: 'Maya Patel',
        repId: 'u-rep-maya',
        startDate: '2026-12-01',
        endDate: '2026-12-31',
        frequency: 'Monthly',
        targetClients: ['c-1'],
        plannedProducts: ['Bevato'],
        status: 'Approved',
        stops: [
          {
            id: 'stop-e-1',
            clientName: 'Dr. Sarah Kim',
            clientId: 'c-1',
            address: 'Clinic',
            priority: 'Class A',
            purpose: 'Clinical',
            plannedTime: '10:00 AM',
            plannedDate: '2026-12-05',
          },
          {
            id: 'stop-e-2',
            clientName: 'Dr. Sarah Kim',
            clientId: 'c-1',
            address: 'Clinic',
            priority: 'Class A',
            purpose: 'Discussion',
            plannedTime: '11:00 AM',
            plannedDate: '2026-12-19',
          },
        ],
      })

      // Perform a non-material change (notes only)
      const nonMaterial = updateVisitPlan(plan.id, { notes: 'Updated internal note' }, 'Maya Patel')
      assert.strictEqual(nonMaterial.status, 'Approved', 'Non-material change must NOT reset approval')

      // Perform a material change (change target date of a stop)
      const material = updateVisitPlan(
        plan.id,
        {
          stops: [
            {
              id: 'stop-e-1',
              clientName: 'Dr. Sarah Kim',
              clientId: 'c-1',
              address: 'Clinic',
              priority: 'Class A',
              purpose: 'Clinical',
              plannedTime: '10:00 AM',
              plannedDate: '2026-12-08', // changed date
            },
            {
              id: 'stop-e-2',
              clientName: 'Dr. Sarah Kim',
              clientId: 'c-1',
              address: 'Clinic',
              priority: 'Class A',
              purpose: 'Discussion',
              plannedTime: '11:00 AM',
              plannedDate: '2026-12-19',
            },
          ],
        },
        'Maya Patel'
      )

      assert.strictEqual(material.status, 'Pending Approval', 'Material change must return plan to Pending Approval')
    })

    test('4.3 Calendar entries strictly include Approved plans and exclude Draft or Pending plans', () => {
      const plans = visitPlansStore.get()
      const calendarEvents = deriveCalendarEntriesFromVisitPlans(plans)

      for (const ev of calendarEvents) {
        const parentPlan = plans.find((p) => p.id === ev.planId)
        assert.ok(parentPlan, 'Parent plan must exist')
        assert.notStrictEqual(parentPlan.status, 'Draft', 'Calendar must never show Draft visits')
        assert.notStrictEqual(parentPlan.status, 'Pending Approval', 'Calendar must never show Pending visits')
      }
    })
  })
})
