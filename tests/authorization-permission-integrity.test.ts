import test, { describe } from 'node:test'
import assert from 'node:assert'
import {
  vacationsStore,
  addVacationRequest,
  approveVacation,
  rejectVacation,
} from '../src/data/mock/vacations'
import {
  visitPlansStore,
  addVisitPlan,
  updateVisitPlan,
  approveVisitPlan,
  rejectVisitPlan,
  submitVisitPlanForApproval,
  isMaterialPlanChange,
} from '../src/data/mock/visit-plans'
import {
  invoicesStore,
  addInvoice,
} from '../src/data/mock/invoices'
import {
  customersStore,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} from '../src/data/mock/customers'
import {
  visitsStore,
  addVisit,
  updateVisit,
  updateVisitStatus,
} from '../src/data/mock/visits'
import {
  targetsStore,
  createTarget,
  updateTarget,
  deleteTarget,
} from '../src/data/mock/targets'
import {
  collectionsStore,
  voidCollectionPayment,
} from '../src/data/mock/cash-in'
import {
  productsStore,
  addProductRecord,
  updateProduct,
} from '../src/data/mock/products'
import {
  usersStore,
  addUser,
  updateUser,
} from '../src/data/mock/users'
import {
  getAuthoritativeSalesPerformance,
  getAuthoritativeVisitCoverage,
  getAuthoritativeRepScorecard,
  getAuthoritativeInvoicesApprovalsSummary,
} from '../src/data/mock/reportingAnalytics'
import {
  validateExportPermission,
  exportReportToExcel,
} from '../src/lib/export/reportExport'
import { DEVELOPMENT_TEST_USERS } from '../src/lib/auth/mock-users'

describe('Navigen — Authorization & Permission Integrity Test Suite (Phase 1)', () => {
  // ── 1. Vacation Approval Security ──────────────────────────────────────────
  describe('1. Vacation Approval Security', () => {
    test('Self-approval attempt is strictly rejected by ID and Name', () => {
      const { vacation } = addVacationRequest({
        employeeName: 'Test Rep Sara',
        employeeId: 'u-test-rep-sara',
        startDate: '2026-12-01',
        endDate: '2026-12-05',
        vacationType: 'Annual',
        reason: 'Personal vacation',
      })

      // Rep tries to approve their own vacation
      assert.throws(
        () => approveVacation(vacation.id, { id: 'u-test-rep-sara', name: 'Test Rep Sara', role: 'rep' }),
        /Self-approval prohibited/i
      )

      assert.throws(
        () => approveVacation(vacation.id, 'Test Rep Sara'),
        /Self-approval prohibited/i
      )
    })

    test('Self-rejection attempt is strictly rejected', () => {
      const { vacation } = addVacationRequest({
        employeeName: 'Test Rep Sara',
        employeeId: 'u-test-rep-sara',
        startDate: '2026-12-10',
        endDate: '2026-12-12',
        vacationType: 'Sick',
        reason: 'Rest',
      })

      assert.throws(
        () => rejectVacation(vacation.id, 'No', { id: 'u-test-rep-sara', name: 'Test Rep Sara', role: 'rep' }),
        /Self-action prohibited/i
      )
    })

    test('Unauthorized manager from another branch / BU cannot approve vacation', () => {
      // Rep Sara is Cardio, her manager is FLM Cardio
      const { vacation } = addVacationRequest({
        employeeName: 'Test Rep Sara',
        employeeId: 'u-test-rep-sara',
        startDate: '2026-12-15',
        endDate: '2026-12-18',
        vacationType: 'Annual',
        reason: 'Holiday',
      })

      // FLM Respiratory tries to approve Cardio Rep's vacation
      assert.throws(
        () => approveVacation(vacation.id, { id: 'u-test-flm-resp', name: 'Test FLM Respiratory', role: 'first_line_manager' }),
        /Unauthorized/i
      )
    })

    test('Rejection requires a non-empty reason', () => {
      const { vacation } = addVacationRequest({
        employeeName: 'Test Rep Sara',
        employeeId: 'u-test-rep-sara',
        startDate: '2026-12-20',
        endDate: '2026-12-22',
        vacationType: 'Annual',
        reason: 'Family trip',
      })

      assert.throws(
        () => rejectVacation(vacation.id, '   ', { id: 'u-test-flm-cardio', name: 'Test FLM Cardio', role: 'first_line_manager' }),
        /rejection reason is required/i
      )
    })

    test('Authorized direct manager (FLM Cardio) successfully approves vacation', () => {
      const { vacation } = addVacationRequest({
        employeeName: 'Test Rep Sara',
        employeeId: 'u-test-rep-sara',
        startDate: '2026-12-25',
        endDate: '2026-12-28',
        vacationType: 'Annual',
        reason: 'End of year leave',
      })

      const res = approveVacation(vacation.id, { id: 'u-test-flm-cardio', name: 'Test FLM Cardio', role: 'first_line_manager' })
      assert.ok(res)
      const stored = vacationsStore.get().find((v) => v.id === vacation.id)
      assert.strictEqual(stored?.status, 'Approved')
      assert.strictEqual(stored?.approvedBy, 'Test FLM Cardio')
    })
  })

  // ── 2. Approved Medical Plan Modification ──────────────────────────────────
  describe('2. Approved Medical Plan Modification', () => {
    test('Material modifications on Approved plan automatically return status to Pending Approval and record history', () => {
      const plan = addVisitPlan({
        name: 'Sara Cardio Target Plan Q4',
        repName: 'Test Rep Sara',
        repId: 'u-test-rep-sara',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        frequency: 'Weekly',
        targetClients: ['Green Cross Pharmacy'],
        plannedProducts: ['Bevato'],
        status: 'Draft',
        stops: [
          {
            id: 'stop-sara-1',
            clientName: 'Green Cross Pharmacy',
            address: 'Cairo',
            priority: 'Class A',
            purpose: 'Product review',
            plannedTime: '10:00 AM',
            plannedDate: '2026-10-15',
          },
        ],
      })

      // Submit and approve by direct manager
      submitVisitPlanForApproval(plan.id, { id: 'u-test-rep-sara', name: 'Test Rep Sara', role: 'rep' })
      approveVisitPlan(plan.id, { id: 'u-test-flm-cardio', name: 'Test FLM Cardio', role: 'first_line_manager' })

      const approvedSnapshot = visitPlansStore.get().find((p) => p.id === plan.id)
      assert.strictEqual(approvedSnapshot?.status, 'Approved')

      // Rep makes material change (adding another client)
      const updated = updateVisitPlan(
        plan.id,
        {
          targetClients: ['Green Cross Pharmacy', 'Nile Hospital'],
        },
        { id: 'u-test-rep-sara', name: 'Test Rep Sara', role: 'rep' }
      )

      assert.strictEqual(updated.status, 'Pending Approval')
      assert.strictEqual(updated.reviewedAt, undefined)
      assert.strictEqual(updated.assignedApproverId, 'u-test-flm-cardio')

      // Check approval history contains 'Returned to Pending'
      const returnedEntry = updated.approvalHistory?.find((h) => h.action === 'Returned to Pending')
      assert.ok(returnedEntry)
      assert.strictEqual(returnedEntry?.previousStatus, 'Approved')
      assert.strictEqual(returnedEntry?.newStatus, 'Pending Approval')
    })

    test('Non-material modification (notes only) preserves Approved status', () => {
      const plan = addVisitPlan({
        name: 'Sara Preserved Plan Q4',
        repName: 'Test Rep Sara',
        repId: 'u-test-rep-sara',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        frequency: 'Weekly',
        targetClients: ['Green Cross Pharmacy'],
        plannedProducts: ['Bevato'],
        status: 'Draft',
        stops: [
          {
            id: 'stop-pres-1',
            clientName: 'Green Cross Pharmacy',
            address: 'Cairo',
            priority: 'Class A',
            purpose: 'Review',
            plannedTime: '10:00 AM',
            plannedDate: '2026-10-15',
          },
        ],
      })

      submitVisitPlanForApproval(plan.id, { id: 'u-test-rep-sara', name: 'Test Rep Sara', role: 'rep' })
      approveVisitPlan(plan.id, { id: 'u-test-flm-cardio', name: 'Test FLM Cardio', role: 'first_line_manager' })

      // Non-material edit: updating notes only
      const updated = updateVisitPlan(
        plan.id,
        {
          notes: 'Updated personal reminder notes for parking.',
        },
        { id: 'u-test-rep-sara', name: 'Test Rep Sara', role: 'rep' }
      )

      assert.strictEqual(updated.status, 'Approved')
      assert.strictEqual(updated.notes, 'Updated personal reminder notes for parking.')
    })

    test('Unauthorized user cannot escalate status to Approved directly', () => {
      const plan = addVisitPlan({
        name: 'Sara Draft Plan Direct Escalate',
        repName: 'Test Rep Sara',
        repId: 'u-test-rep-sara',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        frequency: 'Weekly',
        targetClients: ['Green Cross Pharmacy'],
        plannedProducts: ['Bevato'],
        status: 'Draft',
        stops: [],
      })

      // Rep tries to directly pass status: 'Approved' via updateVisitPlan
      assert.throws(
        () =>
          updateVisitPlan(
            plan.id,
            { status: 'Approved' },
            { id: 'u-test-rep-sara', name: 'Test Rep Sara', role: 'rep' }
          ),
        /Unauthorized status update/i
      )
    })

    test('Rep cannot edit another representative visit plan', () => {
      const plan = addVisitPlan({
        name: 'Sara Private Plan',
        repName: 'Test Rep Sara',
        repId: 'u-test-rep-sara',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        frequency: 'Weekly',
        targetClients: ['Green Cross Pharmacy'],
        plannedProducts: ['Bevato'],
        status: 'Draft',
        stops: [],
      })

      // Rep Olivia tries to edit Sara's plan
      assert.throws(
        () =>
          updateVisitPlan(
            plan.id,
            { name: 'Hijacked Plan' },
            { id: 'u-test-rep-olivia', name: 'Test Rep Olivia', role: 'rep' }
          ),
        /Medical Representatives can only edit their own visit plans/i
      )
    })
  })

  // ── 3. Invoice Upload Authorization ────────────────────────────────────────
  describe('3. Invoice Upload Authorization', () => {
    test('Rep cannot upload or create an invoice for another representative', () => {
      assert.throws(
        () =>
          addInvoice(
            {
              customerId: 'c-1',
              customerName: 'Dr. Sarah Kim',
              originalAmount: 5000,
              repId: 'u-test-rep-olivia',
              repName: 'Test Rep Olivia',
            },
            { id: 'u-test-rep-sara', name: 'Test Rep Sara', role: 'rep' }
          ),
        /Medical Representatives can only upload invoices for themselves/i
      )
    })

    test('Rep successfully uploads invoice for themselves', () => {
      const inv = addInvoice(
        {
          customerId: 'c-1',
          customerName: 'Dr. Sarah Kim',
          originalAmount: 5000,
          repId: 'u-test-rep-sara',
          repName: 'Test Rep Sara',
        },
        { id: 'u-test-rep-sara', name: 'Test Rep Sara', role: 'rep' }
      )

      assert.ok(inv)
      assert.strictEqual(inv.repId, 'u-test-rep-sara')
      assert.strictEqual(inv.repName, 'Test Rep Sara')
    })

    test('Marketing Manager and BUM cannot upload invoices', () => {
      assert.throws(
        () =>
          addInvoice(
            {
              customerId: 'c-1',
              customerName: 'Dr. Sarah Kim',
              originalAmount: 5000,
            },
            { id: 'u-test-mkt', name: 'Test Marketing Manager', role: 'marketing_manager' }
          ),
        /Marketing Managers cannot upload or create commercial invoices/i
      )

      assert.throws(
        () =>
          addInvoice(
            {
              customerId: 'c-1',
              customerName: 'Dr. Sarah Kim',
              originalAmount: 5000,
            },
            { id: 'u-test-bum-cardio', name: 'Test BUM Cardio', role: 'business_unit_manager' }
          ),
        /not authorized to create or upload invoices/i
      )
    })
  })

  // ── 4. Customer and Visit Mutation Guards ───────────────────────────────────
  describe('4. Customer and Visit Mutation Guards', () => {
    test('Marketing Manager cannot mutate customer records', () => {
      assert.throws(
        () =>
          addCustomer(
            {
              name: 'Dr. Marketing Clinic',
              repName: 'Test Marketing Manager',
              region: 'Central',
              status: 'Active',
              meta: 'Clinic',
              specialty: 'Cardiology',
              classification: 'Class A',
            },
            { id: 'u-test-mkt', name: 'Test Marketing Manager', role: 'marketing_manager' }
          ),
        /Marketing Managers are restricted/i
      )
    })

    test('Rep cannot mutate another representative customer', () => {
      const customer = addCustomer({
        name: 'Dr. Olivia Exclusive Doctor',
        rep_id: 'u-test-rep-olivia',
        repName: 'Test Rep Olivia',
        region: 'North',
        status: 'Active',
        meta: 'Clinic',
        specialty: 'Cardiology',
        classification: 'Class A',
      })

      // Rep Sara tries to update Olivia's customer
      assert.throws(
        () =>
          updateCustomer(
            customer.id!,
            { name: 'Dr. Stolen Doctor' },
            { id: 'u-test-rep-sara', name: 'Test Rep Sara', role: 'rep' }
          ),
        /Medical Representatives can only edit their own assigned customers/i
      )
    })

    test('Cross-FLM-team customer mutation is rejected', () => {
      const customer = addCustomer({
        name: 'Dr. Resp Specialist',
        rep_id: 'u-test-rep-maya', // reports to FLM Respiratory
        repName: 'Test Rep Maya',
        region: 'West',
        status: 'Active',
        meta: 'Clinic',
        specialty: 'Pulmonology',
        classification: 'Class A',
      })

      // FLM Cardio tries to update FLM Respiratory's customer
      assert.throws(
        () =>
          updateCustomer(
            customer.id!,
            { notes: 'Cross team update' },
            { id: 'u-test-flm-cardio', name: 'Test FLM Cardio', role: 'first_line_manager' }
          ),
        /outside their authorized organizational scope/i
      )
    })

    test('Marketing Manager cannot mutate visit records', () => {
      assert.throws(
        () =>
          addVisit(
            {
              clientName: 'Green Cross Pharmacy',
              repName: 'Test Marketing Manager',
              repId: 'u-test-mkt',
              date: '2026-11-28',
              time: '11:00 AM',
              status: 'Planned',
              detail: 'Marketing promo visit',
              notes: 'None',
              productsPresented: ['Bevato'],
              samplesQuantity: 0,
              reactionEmoji: '👍',
              reactionLabel: 'Positive',
              nextVisitDate: '2026-12-05',
              gpsVerified: true,
            },
            { id: 'u-test-mkt', name: 'Test Marketing Manager', role: 'marketing_manager' }
          ),
        /Marketing Managers are restricted/i
      )
    })

    test('Rep cannot mutate another rep visit record', () => {
      const visit = addVisit({
        clientName: 'Green Cross Pharmacy',
        repName: 'Test Rep Olivia',
        repId: 'u-test-rep-olivia',
        date: '2026-11-28',
        time: '11:00 AM',
        status: 'Planned',
        detail: 'Olivia visit',
        notes: 'None',
        productsPresented: ['Bevato'],
        samplesQuantity: 0,
        reactionEmoji: '👍',
        reactionLabel: 'Positive',
        nextVisitDate: '2026-12-05',
        gpsVerified: true,
      })

      assert.throws(
        () =>
          updateVisit(
            visit.id,
            { detail: 'Sara changed this' },
            { id: 'u-test-rep-sara', name: 'Test Rep Sara', role: 'rep' }
          ),
        /Medical Representatives can only edit their own scheduled or joint visits/i
      )
    })
  })

  // ── 5. Reports and Export Authorization ────────────────────────────────────
  describe('5. Reports and Export Authorization', () => {
    test('Marketing Manager receives authorization error on commercial reports', () => {
      const mktUser = {
        id: 'u-test-mkt',
        name: 'Test Marketing Manager',
        role: 'marketing_manager',
      }

      assert.throws(
        () => getAuthoritativeSalesPerformance(undefined, mktUser),
        /Marketing Managers do not have commercial access/i
      )

      assert.throws(
        () => getAuthoritativeVisitCoverage(undefined, mktUser),
        /Marketing Managers do not have access/i
      )

      assert.throws(
        () => getAuthoritativeRepScorecard('u-test-rep-sara', mktUser),
        /Marketing Managers do not have access/i
      )

      assert.throws(
        () => getAuthoritativeInvoicesApprovalsSummary(mktUser),
        /does not have access to Invoices & Approvals reporting/i
      )
    })

    test('Rep attempting to view another rep scorecard is blocked', () => {
      const repSara = {
        id: 'u-test-rep-sara',
        name: 'Test Rep Sara',
        role: 'rep',
      }

      assert.throws(
        () => getAuthoritativeRepScorecard('u-test-rep-olivia', repSara),
        /Medical Representatives can only view their own performance scorecard/i
      )
    })

    test('Export authorization denies Rep from exporting by default', () => {
      const auth = validateExportPermission(
        {
          id: 'u-test-rep-sara',
          name: 'Test Rep Sara',
          role: 'rep',
        },
        'sales-performance'
      )

      assert.strictEqual(auth.allowed, false)
      assert.match(auth.error || '', /not authorized to access or export|not permitted to export/i)
    })

    test('Export authorization denies Marketing from exporting commercial report', () => {
      const auth = validateExportPermission(
        {
          id: 'u-test-mkt',
          name: 'Test Marketing Manager',
          role: 'marketing_manager',
        },
        'sales-performance'
      )

      assert.strictEqual(auth.allowed, false)
      assert.match(auth.error || '', /not authorized to access or export report/i)
    })

    test('Export authorization allows Marketing on sell-in-vs-sell-out', () => {
      const auth = validateExportPermission(
        {
          id: 'u-test-mkt',
          name: 'Test Marketing Manager',
          role: 'marketing_manager',
        },
        'sell-in-vs-sell-out'
      )

      assert.strictEqual(auth.allowed, true)
    })
  })

  // ── 6. Store-Level Sensitive Mutation Guards ────────────────────────────────
  describe('6. Store-Level Sensitive Mutation Guards', () => {
    test('Rep or Marketing cannot create or delete targets', () => {
      assert.throws(
        () =>
          createTarget(
            {
              name: 'Unauthorized Target',
              repId: 'u-test-rep-sara',
              repName: 'Test Rep Sara',
              period: 'Monthly',
              startDate: '2026-11-01',
              endDate: '2026-11-30',
              targetValue: 50000,
            },
            { id: 'u-test-rep-sara', name: 'Test Rep Sara', role: 'rep' }
          ),
        /cannot create sales targets/i
      )

      assert.throws(
        () =>
          createTarget(
            {
              name: 'Mkt Target',
              repId: 'u-test-rep-sara',
              repName: 'Test Rep Sara',
              period: 'Monthly',
              startDate: '2026-11-01',
              endDate: '2026-11-30',
              targetValue: 50000,
            },
            { id: 'u-test-mkt', name: 'Test Marketing Manager', role: 'marketing_manager' }
          ),
        /cannot create sales targets/i
      )
    })

    test('Rep cannot void collection payment records', () => {
      assert.throws(
        () => voidCollectionPayment('REC-2026-083', 'Accidental receipt', 'u-test-rep-sara'),
        /cannot void collection payment records/i
      )
    })

    test('Non-admin cannot add or modify catalog products', () => {
      assert.throws(
        () =>
          addProductRecord(
            {
              code: 'PROD-NEW-99',
              name: 'Unauthorized Drug',
              category: 'Cardio',
              price: 200,
              status: 'Active',
              standardPack: '30 tablets / box',
            },
            'u-test-rep-sara'
          ),
        /cannot perform product management operations/i
      )
    })

    test('Non-admin cannot add or modify administrative users', () => {
      assert.throws(
        () =>
          addUser(
            {
              id: 'u-hacked-99',
              name: 'Hacked User',
              email: 'hacked@navigenpharma.net',
              role: 'Rep',
              roleType: 'rep',
              region: 'Cairo',
              status: 'Active',
            },
            'u-test-rep-sara'
          ),
        /cannot perform administrative user management/i
      )
    })
  })
})
