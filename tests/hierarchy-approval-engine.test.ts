import test, { describe } from 'node:test'
import assert from 'node:assert'
import {
  resolveApproverForRequest,
  validateApprovalAuthority,
  findAuthoritativeUser,
} from '../src/lib/approval/approvalEngine'
import {
  addVisitPlan,
  submitVisitPlanForApproval,
  approveVisitPlan,
  rejectVisitPlan,
  visitPlansStore,
  deriveCalendarEntriesFromVisitPlans,
} from '../src/data/mock/visit-plans'
import { filterVisitPlansByScope } from '../src/data/mock/dataScope'
import { DEVELOPMENT_TEST_USERS } from '../src/lib/auth/mock-users'

describe('Navigen — Organizational Hierarchy, Direct Reporting & Approval Engine Suite', () => {
  describe('1. Direct Manager Hierarchy Resolution (resolveApproverForRequest)', () => {
    test('Rep Sara (Cardio) routes directly to her FLM (Test FLM Cardio)', () => {
      const resolved = resolveApproverForRequest('u-test-rep-sara', 'visit_plan')
      assert.strictEqual(resolved.approverId, 'u-test-flm-cardio')
      assert.strictEqual(resolved.approverName, 'Test FLM Cardio')
      assert.strictEqual(resolved.approverRole, 'first_line_manager')
      assert.strictEqual(resolved.escalated, false)
    })

    test('FLM Cardio routes directly to BUM Cardio (Test BUM Cardio)', () => {
      const resolved = resolveApproverForRequest('u-test-flm-cardio', 'visit_plan')
      assert.strictEqual(resolved.approverId, 'u-test-bum-cardio')
      assert.strictEqual(resolved.approverName, 'Test BUM Cardio')
      assert.strictEqual(resolved.approverRole, 'business_unit_manager')
      assert.strictEqual(resolved.escalated, false)
    })

    test('BUM Cardio routes directly to Admin (Test Admin)', () => {
      const resolved = resolveApproverForRequest('u-test-bum-cardio', 'visit_plan')
      assert.strictEqual(resolved.approverId, 'u-test-admin')
      assert.strictEqual(resolved.approverName, 'Test Admin')
      assert.strictEqual(resolved.approverRole, 'admin')
      assert.strictEqual(resolved.escalated, false)
    })

    test('Marketing Manager routes directly to Admin (bypass BUM)', () => {
      const resolved = resolveApproverForRequest('u-test-mkt', 'budget_approval')
      assert.strictEqual(resolved.approverId, 'u-test-admin')
      assert.strictEqual(resolved.approverName, 'Test Admin')
      assert.strictEqual(resolved.approverRole, 'admin')
      assert.strictEqual(resolved.escalated, false)
    })

    test('Senior Rep (u-test-rep-direct) reports directly to Admin (exception chain)', () => {
      const resolved = resolveApproverForRequest('u-test-rep-direct', 'visit_plan')
      assert.strictEqual(resolved.approverId, 'u-test-admin')
      assert.strictEqual(resolved.approverName, 'Test Admin')
      assert.strictEqual(resolved.approverRole, 'admin')
      assert.strictEqual(resolved.escalated, false)
    })

    test('Respiratory Rep routes to Respiratory FLM (Test FLM Respiratory)', () => {
      const resolved = resolveApproverForRequest('u-test-rep-maya', 'visit_plan')
      assert.strictEqual(resolved.approverId, 'u-test-flm-resp')
      assert.strictEqual(resolved.approverName, 'Test FLM Respiratory')
      assert.strictEqual(resolved.approverRole, 'first_line_manager')
      assert.strictEqual(resolved.escalated, false)
    })
  })

  describe('2. Validation & Authority Guardrails (validateApprovalAuthority)', () => {
    test('Rep cannot approve own request (self-approval prohibited)', () => {
      const check = validateApprovalAuthority(
        { id: 'u-test-rep-sara', name: 'Test Rep Sara', role: 'rep' },
        {
          createdById: 'u-test-rep-sara',
          createdByName: 'Test Rep Sara',
          assignedApproverId: 'u-test-flm-cardio',
          requestType: 'visit_plan',
        }
      )
      assert.strictEqual(check.valid, false)
      assert.match(check.error || '', /cannot approve their own visit plan/i)
    })

    test('Rep cannot approve another rep request (insufficient authority)', () => {
      const check = validateApprovalAuthority(
        { id: 'u-test-rep-sara', name: 'Test Rep Sara', role: 'rep' },
        {
          createdById: 'u-test-rep-olivia',
          createdByName: 'Test Rep Olivia',
          assignedApproverId: 'u-test-flm-cardio',
          requestType: 'visit_plan',
        }
      )
      assert.strictEqual(check.valid, false)
      assert.match(check.error || '', /does not have approval authority/i)
    })

    test('FLM can approve direct report request assigned to them', () => {
      const check = validateApprovalAuthority(
        { id: 'u-test-flm-cardio', name: 'Test FLM Cardio', role: 'first_line_manager' },
        {
          createdById: 'u-test-rep-sara',
          createdByName: 'Test Rep Sara',
          assignedApproverId: 'u-test-flm-cardio',
          requestType: 'visit_plan',
        }
      )
      assert.strictEqual(check.valid, true)
      assert.ok(check.actor)
    })

    test('Cross-branch approval blocked: Respiratory FLM cannot approve Cardio rep request', () => {
      const check = validateApprovalAuthority(
        { id: 'u-test-flm-resp', name: 'Test FLM Respiratory', role: 'first_line_manager' },
        {
          createdById: 'u-test-rep-sara',
          createdByName: 'Test Rep Sara',
          assignedApproverId: 'u-test-flm-cardio',
          requestType: 'visit_plan',
        }
      )
      assert.strictEqual(check.valid, false)
      assert.match(check.error || '', /Cross-branch approval is forbidden/i)
    })

    test('Admin override: Admin can approve any pending request across any branch', () => {
      const check = validateApprovalAuthority(
        { id: 'u-test-admin', name: 'Test Admin', role: 'admin' },
        {
          createdById: 'u-test-rep-sara',
          createdByName: 'Test Rep Sara',
          assignedApproverId: 'u-test-flm-cardio',
          requestType: 'visit_plan',
        }
      )
      assert.strictEqual(check.valid, true)
      assert.ok(check.actor)
    })
  })

  describe('3. Visit Plan End-to-End Approval Lifecycle & Calendar Derivation', () => {
    test('Rep submits visit plan with real stops -> routed to direct manager with approval history', () => {
      const plan = addVisitPlan({
        name: 'Cardio Q4 Target Routing',
        repName: 'Test Rep Sara',
        repId: 'u-test-rep-sara',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        frequency: 'Monthly',
        status: 'Draft',
        targetClients: ['Dr. Sarah Kim'],
        plannedProducts: ['Bevato'],
        stops: [
          {
            id: 'stop-101',
            clientName: 'Dr. Sarah Kim',
            clientId: 'c-1',
            address: 'Clinic Cairo',
            priority: 'Class A',
            purpose: 'Scientific Presentation',
            plannedTime: '10:00 AM',
            plannedDate: '2026-11-10',
          },
        ],
      })

      const submitted = submitVisitPlanForApproval(plan.id, {
        id: 'u-test-rep-sara',
        name: 'Test Rep Sara',
        role: 'rep',
      })

      assert.strictEqual(submitted.status, 'Pending Approval')
      assert.strictEqual(submitted.assignedApproverId, 'u-test-flm-cardio')
      assert.strictEqual(submitted.assignedApproverName, 'Test FLM Cardio')
      assert.ok(submitted.approvalHistory && submitted.approvalHistory.length > 0)
      assert.strictEqual(submitted.approvalHistory[0].action, 'Submitted')

      // Before approval, calendar derivation must NOT include Draft or Pending stops
      const draftCalendarEntries = deriveCalendarEntriesFromVisitPlans([submitted])
      assert.strictEqual(draftCalendarEntries.length, 0, 'Pending plans must not appear in Calendar')

      // FLM approves the plan
      const approved = approveVisitPlan(submitted.id, {
        id: 'u-test-flm-cardio',
        name: 'Test FLM Cardio',
        role: 'first_line_manager',
      })

      assert.strictEqual(approved.status, 'Approved')
      assert.strictEqual(approved.reviewedBy, 'Test FLM Cardio')
      assert.strictEqual(approved.approvalHistory?.length, 2)
      assert.strictEqual(approved.approvalHistory?.[1].action, 'Approved')

      // After approval, calendar derivation derives real scheduled stops
      const approvedEntries = deriveCalendarEntriesFromVisitPlans([approved])
      assert.strictEqual(approvedEntries.length, 1, 'Approved plan stops must appear in Calendar')
      assert.strictEqual(approvedEntries[0].clientName, 'Dr. Sarah Kim')
      assert.strictEqual(approvedEntries[0].time, '10:00 AM')
    })

    test('Manager rejects visit plan with mandatory reason -> marked Rejected', () => {
      const plan = addVisitPlan({
        name: 'December Future Target Plan',
        repName: 'Test Rep Sara',
        repId: 'u-test-rep-sara',
        startDate: '2026-12-01',
        endDate: '2026-12-31',
        frequency: 'Monthly',
        status: 'Draft',
        targetClients: ['Dr. Sarah Kim'],
        plannedProducts: ['Bevato'],
        stops: [
          {
            id: 'stop-102',
            clientName: 'Dr. Sarah Kim',
            clientId: 'c-1',
            address: 'Clinic Cairo',
            priority: 'Class A',
            purpose: 'Detailing',
            plannedTime: '11:00 AM',
            plannedDate: '2026-12-05',
          },
          {
            id: 'stop-103',
            clientName: 'Dr. Sarah Kim',
            clientId: 'c-1',
            address: 'Clinic Cairo',
            priority: 'Class A',
            purpose: 'Follow-up',
            plannedTime: '11:00 AM',
            plannedDate: '2026-12-19',
          },
        ],
      })

      const submitted = submitVisitPlanForApproval(plan.id, {
        id: 'u-test-rep-sara',
        name: 'Test Rep Sara',
        role: 'rep',
      })

      const rejected = rejectVisitPlan(
        submitted.id,
        'Coverage does not meet Class A frequency requirement of 2 visits/month',
        {
          id: 'u-test-flm-cardio',
          name: 'Test FLM Cardio',
          role: 'first_line_manager',
        }
      )

      assert.strictEqual(rejected.status, 'Rejected')
      assert.strictEqual(
        rejected.rejectionReason,
        'Coverage does not meet Class A frequency requirement of 2 visits/month'
      )
      assert.strictEqual(rejected.approvalHistory?.[1].action, 'Rejected')
    })
  })

  describe('4. Cross-BU and Data Scope Isolation', () => {
    test('Cardio FLM only sees Cardio plans; Respiratory FLM does not see them', () => {
      const plans = visitPlansStore.get()
      const cardioScope = filterVisitPlansByScope(plans, {
        id: 'u-test-flm-cardio',
        name: 'Test FLM Cardio',
        role: 'first_line_manager',
      })

      const respScope = filterVisitPlansByScope(plans, {
        id: 'u-test-flm-resp',
        name: 'Test FLM Respiratory',
        role: 'first_line_manager',
      })

      const saraInCardio = cardioScope.some((p) => p.repName === 'Test Rep Sara' || p.repId === 'u-test-rep-sara')
      const saraInResp = respScope.some((p) => p.repName === 'Test Rep Sara' || p.repId === 'u-test-rep-sara')

      assert.strictEqual(saraInCardio, true, 'Cardio FLM must see Test Rep Sara plans')
      assert.strictEqual(saraInResp, false, 'Respiratory FLM must not see Test Rep Sara plans')
    })

    test('All 10 Development Test Accounts exist and are properly configured in mock users directory', () => {
      assert.strictEqual(DEVELOPMENT_TEST_USERS.length, 10)
      for (const u of DEVELOPMENT_TEST_USERS) {
        const found = findAuthoritativeUser({ id: u.id })
        assert.ok(found, `User ${u.id} (${u.name}) must be found in authoritative directory`)
        assert.strictEqual(found.status, 'active')
        assert.ok(found.email.includes('@navigen'), `Email ${found.email} must belong to @navigen domain`)
      }
    })
  })
})
