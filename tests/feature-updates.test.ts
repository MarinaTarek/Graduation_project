/**
 * feature-updates.test.ts
 *
 * Verification suite for Navigen CRM Focused Feature Updates:
 * 1. Renaming Clients to HCPs & HCOs (en and ar i18n)
 * 2. Double Visit — Joint Visit Invitation & Single Customer Count
 * 3. Visit Plan — Manager Approval Workflow, Revalidation & Self-Approval Prevention
 * 4. Configurable Visit Frequency & Target Calculation
 * 5. Customer Classification verification & persistence
 */

import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'

import {
  visitsStore,
  addVisit,
  updateVisit,
  jointVisitInvitationsStore,
  createJointVisitInvitation,
  respondToJointVisitInvitation,
} from '../src/data/mock/visits'

import {
  visitPlansStore,
  addVisitPlan,
  updateVisitPlan,
  submitVisitPlanForApproval,
  approveVisitPlan,
  rejectVisitPlan,
  getDirectManagerForRep,
} from '../src/data/mock/visit-plans'

import {
  visitFrequencyStore,
  updateVisitFrequencyPolicy,
  validatePolicyConfiguration,
  getTargetPeriodBounds,
  getCustomerVisitStats,
  validateVisitPlan,
  isCustomerOverdue,
  DEFAULT_VISIT_FREQUENCY_POLICY,
  type VisitFrequencyPolicy,
} from '../src/data/mock/visitFrequency'

import {
  customersStore,
  addCustomer,
  updateCustomer,
  validateCustomerClassification,
} from '../src/data/mock/customers'

import { usersStore } from '../src/data/mock/users'

import {
  notificationsStore,
} from '../src/data/mock/notifications'

import { en } from '../src/lib/i18n/en'
import { ar } from '../src/lib/i18n/ar'

describe('Navigen CRM — Focused Feature Updates Verification Suite', () => {
  beforeEach(() => {
    // Reset stores to predictable baseline
    visitsStore.set([])
    jointVisitInvitationsStore.set([])
    visitPlansStore.set([])
    notificationsStore.set([])
    visitFrequencyStore.set({ ...DEFAULT_VISIT_FREQUENCY_POLICY })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Rename Clients to HCPs & HCOs
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Clients Renamed to HCPs & HCOs (i18n & Navigation)', () => {
    test('English i18n contains HCPs & HCOs for navigation and page title', () => {
      assert.strictEqual(en['nav.clients'], 'HCPs & HCOs')
      assert.strictEqual(en['clients.title'], 'HCPs & HCOs')
      assert.strictEqual(en['home.attention.actionOpeningOverdueClients'], 'Opening overdue HCPs & HCOs')
    })

    test('Arabic i18n contains consistent HCPs & HCOs labels for navigation and page title', () => {
      assert.ok(ar['nav.clients']?.includes('HCPs & HCOs'))
      assert.ok(ar['clients.title']?.includes('HCPs & HCOs'))
      assert.ok(ar['home.attention.actionOpeningOverdueClients']?.includes('HCPs & HCOs'))
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Double Visit — Joint Visit Invitation
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Double Visit — Joint Visit Workflow & Single Customer Count', () => {
    test('Creating a Double Visit generates a pending invitation and notification for the invited rep', () => {
      const visit = addVisit({
        clientName: 'Dr. Sarah Kim',
        clientId: 'c-test-1',
        repName: 'Ahmed Samir',
        repId: 'u-rep-1',
        date: '2026-11-04',
        time: '10:00 AM',
        detail: 'Clinical presentation',
        status: 'Completed',
        productsPresented: ['Bevato'],
        samplesQuantity: 5,
        reactionEmoji: '👍',
        reactionLabel: 'Receptive',
        notes: 'Double visit test',
        nextVisitDate: '2026-11-18',
        gpsVerified: true,
        isDoubleVisit: true,
        jointRepId: 'u-rep-2',
        jointRepName: 'Sara Ali',
        jointVisitStatus: 'Pending',
      })

      const invitation = createJointVisitInvitation({
        visitId: visit.id,
        primaryRepId: 'u-rep-1',
        primaryRepName: 'Ahmed Samir',
        invitedRepId: 'u-rep-2',
        invitedRepName: 'Sara Ali',
        clientName: 'Dr. Sarah Kim',
        date: visit.date,
        time: visit.time,
      })

      assert.strictEqual(invitation.status, 'Pending')
      assert.strictEqual(invitation.primaryRepName, 'Ahmed Samir')
      assert.strictEqual(invitation.invitedRepName, 'Sara Ali')

      // Verify notification sent to invited rep
      const notifs = notificationsStore.get()
      const invNotif = notifs.find((n) => n.title === 'Joint Visit Invitation')
      assert.ok(invNotif, 'In-app notification must be delivered to invited rep')
      assert.ok(invNotif.message.includes('Sara Ali') || invNotif.message.includes('Ahmed Samir'))
    })

    test('Invited representative can Accept invitation, updating participation status to Accepted', () => {
      const visit = addVisit({
        clientName: 'Dr. Sarah Kim',
        clientId: 'c-test-1',
        repName: 'Ahmed Samir',
        repId: 'u-rep-1',
        date: '2026-11-04',
        time: '10:00 AM',
        detail: 'Clinical presentation',
        status: 'Completed',
        productsPresented: ['Bevato'],
        samplesQuantity: 0,
        reactionEmoji: '👍',
        reactionLabel: 'Receptive',
        notes: '',
        nextVisitDate: '2026-11-18',
        gpsVerified: false,
        isDoubleVisit: true,
        jointRepId: 'u-rep-2',
        jointRepName: 'Sara Ali',
        jointVisitStatus: 'Pending',
      })

      const invitation = createJointVisitInvitation({
        visitId: visit.id,
        primaryRepId: 'u-rep-1',
        primaryRepName: 'Ahmed Samir',
        invitedRepId: 'u-rep-2',
        invitedRepName: 'Sara Ali',
        clientName: 'Dr. Sarah Kim',
        date: visit.date,
        time: visit.time,
      })

      respondToJointVisitInvitation(invitation.id, 'Accepted', 'Sara Ali')

      const updatedInv = jointVisitInvitationsStore.get().find((i) => i.id === invitation.id)
      assert.strictEqual(updatedInv?.status, 'Accepted')

      const updatedVisit = visitsStore.get().find((v) => v.id === visit.id)
      assert.strictEqual(updatedVisit?.jointVisitStatus, 'Accepted')

      // Verify primary rep receives acceptance notification
      const notifs = notificationsStore.get()
      const acceptNotif = notifs.find((n) => n.title === 'Joint Visit Accepted')
      assert.ok(acceptNotif, 'Primary rep receives acceptance notification')
    })

    test('Invited representative can Reject invitation with reason, displaying result to primary rep', () => {
      const visit = addVisit({
        clientName: 'Dr. Sarah Kim',
        clientId: 'c-test-1',
        repName: 'Ahmed Samir',
        repId: 'u-rep-1',
        date: '2026-11-04',
        time: '10:00 AM',
        detail: 'Clinical presentation',
        status: 'Completed',
        productsPresented: ['Bevato'],
        samplesQuantity: 0,
        reactionEmoji: '👍',
        reactionLabel: 'Receptive',
        notes: '',
        nextVisitDate: '2026-11-18',
        gpsVerified: false,
        isDoubleVisit: true,
        jointRepId: 'u-rep-2',
        jointRepName: 'Sara Ali',
        jointVisitStatus: 'Pending',
      })

      const invitation = createJointVisitInvitation({
        visitId: visit.id,
        primaryRepId: 'u-rep-1',
        primaryRepName: 'Ahmed Samir',
        invitedRepId: 'u-rep-2',
        invitedRepName: 'Sara Ali',
        clientName: 'Dr. Sarah Kim',
        date: visit.date,
        time: visit.time,
      })

      respondToJointVisitInvitation(invitation.id, 'Rejected', 'Sara Ali', 'Territory scheduling conflict')

      const updatedInv = jointVisitInvitationsStore.get().find((i) => i.id === invitation.id)
      assert.strictEqual(updatedInv?.status, 'Rejected')
      assert.strictEqual(updatedInv?.rejectionReason, 'Territory scheduling conflict')

      const updatedVisit = visitsStore.get().find((v) => v.id === visit.id)
      assert.strictEqual(updatedVisit?.jointVisitStatus, 'Rejected')

      // Verify notification shows rejection and reason
      const notifs = notificationsStore.get()
      const rejectNotif = notifs.find((n) => n.title === 'Joint Visit Rejected')
      assert.ok(rejectNotif?.message.includes('Territory scheduling conflict'))
    })

    test('Prevent repeated responses or re-answering already accepted/rejected invitations', () => {
      const visit = addVisit({
        clientName: 'Dr. Sarah Kim',
        clientId: 'c-test-1',
        repName: 'Ahmed Samir',
        repId: 'u-rep-1',
        date: '2026-11-04',
        time: '10:00 AM',
        detail: 'Test',
        status: 'Completed',
        productsPresented: [],
        samplesQuantity: 0,
        reactionEmoji: '👍',
        reactionLabel: 'Receptive',
        notes: '',
        nextVisitDate: '2026-11-18',
        gpsVerified: false,
        isDoubleVisit: true,
        jointRepId: 'u-rep-2',
        jointRepName: 'Sara Ali',
      })

      const invitation = createJointVisitInvitation({
        visitId: visit.id,
        primaryRepId: 'u-rep-1',
        primaryRepName: 'Ahmed Samir',
        invitedRepId: 'u-rep-2',
        invitedRepName: 'Sara Ali',
        clientName: 'Dr. Sarah Kim',
        date: visit.date,
        time: visit.time,
      })

      respondToJointVisitInvitation(invitation.id, 'Accepted', 'Sara Ali')

      assert.throws(() => {
        respondToJointVisitInvitation(invitation.id, 'Rejected', 'Sara Ali')
      }, /Repeated responses are not allowed/)
    })

    test('Double Visit counts as exactly ONE visit for the customer, not two', () => {
      customersStore.set([
        {
          id: 'c-double-count-check',
          name: 'Dr. Double Test',
          classification: 'Class A',
          specialty: 'Cardiology',
          region: 'North region',
          meta: 'Class A · Cardiology · North region',
          repName: 'Ahmed Samir',
          status: 'Active',
          active: true,
        },
      ])

      addVisit({
        clientName: 'Dr. Double Test',
        clientId: 'c-double-count-check',
        repName: 'Ahmed Samir',
        repId: 'u-rep-1',
        date: '2026-11-04',
        time: '11:00 AM',
        detail: 'Double Visit Test',
        status: 'Completed',
        productsPresented: ['Bevato'],
        samplesQuantity: 0,
        reactionEmoji: '👍',
        reactionLabel: 'Receptive',
        notes: '',
        nextVisitDate: '2026-11-18',
        gpsVerified: true,
        isDoubleVisit: true,
        jointRepId: 'u-rep-2',
        jointRepName: 'Sara Ali',
        jointVisitStatus: 'Accepted',
      })

      const stats = getCustomerVisitStats('c-double-count-check', '2026-11-04')
      assert.strictEqual(stats?.completedVisits, 1, 'Double visit must count as 1 completed visit for customer')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Configurable Visit Frequency and Monthly Targets
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Configurable Visit Frequency & Targets', () => {
    test('Default policy targets match business rules: Class A=2/month, Class B=1/month, Class C=1/2months', () => {
      const policy = visitFrequencyStore.get()
      assert.strictEqual(policy.A.targetVisits, 2)
      assert.strictEqual(policy.A.periodMonths, 1)

      assert.strictEqual(policy.B.targetVisits, 1)
      assert.strictEqual(policy.B.periodMonths, 1)

      assert.strictEqual(policy.C.targetVisits, 1)
      assert.strictEqual(policy.C.periodMonths, 2)
    })

    test('Policy validation strictly prevents non-integer or zero/negative targets and periods', () => {
      assert.strictEqual(validatePolicyConfiguration({
        A: { customerClass: 'A', targetVisits: 0, periodMonths: 1 },
        B: { customerClass: 'B', targetVisits: 1, periodMonths: 1 },
        C: { customerClass: 'C', targetVisits: 1, periodMonths: 2 },
      }).valid, false)

      assert.strictEqual(validatePolicyConfiguration({
        A: { customerClass: 'A', targetVisits: 2.5, periodMonths: 1 },
        B: { customerClass: 'B', targetVisits: 1, periodMonths: 1 },
        C: { customerClass: 'C', targetVisits: 1, periodMonths: 2 },
      }).valid, false)

      assert.strictEqual(validatePolicyConfiguration({
        A: { customerClass: 'A', targetVisits: 2, periodMonths: -1 },
        B: { customerClass: 'B', targetVisits: 1, periodMonths: 1 },
        C: { customerClass: 'C', targetVisits: 1, periodMonths: 2 },
      }).valid, false)
    })

    test('Authorized admin can update custom targets and changes persist in shared store', () => {
      const customPolicy: VisitFrequencyPolicy = {
        A: { customerClass: 'A', targetVisits: 4, periodMonths: 1 },
        B: { customerClass: 'B', targetVisits: 2, periodMonths: 1 },
        C: { customerClass: 'C', targetVisits: 2, periodMonths: 3 },
      }

      updateVisitFrequencyPolicy(customPolicy, 'Admin Alex')

      const stored = visitFrequencyStore.get()
      assert.strictEqual(stored.A.targetVisits, 4)
      assert.strictEqual(stored.B.targetVisits, 2)
      assert.strictEqual(stored.C.targetVisits, 2)
      assert.strictEqual(stored.C.periodMonths, 3)
    })

    test('Scheduling flexibility: visits on consecutive days are valid with no minimum interval enforced', () => {
      customersStore.set([
        {
          id: 'c-flexibility-test',
          name: 'Dr. Flexible',
          classification: 'Class A', // Default target: 2 visits / month
          specialty: 'Cardiology',
          region: 'North region',
          meta: 'Class A · Cardiology · North region',
          repName: 'Ahmed Samir',
          status: 'Active',
          active: true,
        },
      ])

      // Plan has 2 visits on consecutive days (2026-11-04 and 2026-11-05)
      const planValidation = validateVisitPlan({
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        targetClients: ['Dr. Flexible'],
        stops: [
          {
            id: 'stop-1',
            clientName: 'Dr. Flexible',
            clientId: 'c-flexibility-test',
            address: 'Clinic',
            priority: 'Class A',
            purpose: 'Intro',
            plannedTime: '10:00 AM',
            plannedDate: '2026-11-04',
          },
          {
            id: 'stop-2',
            clientName: 'Dr. Flexible',
            clientId: 'c-flexibility-test',
            address: 'Clinic',
            priority: 'Class A',
            purpose: 'Follow-up',
            plannedTime: '10:00 AM',
            plannedDate: '2026-11-05', // consecutive day!
          },
        ],
      })

      assert.strictEqual(planValidation.isValid, true, 'Consecutive day visits must be valid without spacing restrictions')
    })

    test('Excludes cancelled and rejected visits from visit count', () => {
      customersStore.set([
        {
          id: 'c-cancelled-check',
          name: 'Dr. Cancelled Test',
          classification: 'Class B', // Target: 1 visit / month
          specialty: 'General Medicine',
          region: 'North region',
          meta: 'Class B · General Medicine · North region',
          repName: 'Alex Morgan',
          status: 'Active',
          active: true,
        },
      ])

      // Add a cancelled visit and a draft visit
      addVisit({
        clientName: 'Dr. Cancelled Test',
        clientId: 'c-cancelled-check',
        repName: 'Alex Morgan',
        date: '2026-11-04',
        time: '09:00 AM',
        detail: 'Test',
        status: 'Cancelled',
        productsPresented: [],
        samplesQuantity: 0,
        reactionEmoji: '👍',
        reactionLabel: 'N/A',
        notes: '',
        nextVisitDate: '2026-11-18',
        gpsVerified: false,
      })

      const stats = getCustomerVisitStats('c-cancelled-check', '2026-11-04')
      assert.strictEqual(stats?.completedVisits, 0, 'Cancelled visits must not count towards target')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Visit Plan — Manager Approval Workflow
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Visit Plan — Approval Workflow & Validation Rules', () => {
    test('Submission is blocked if plan violates visit frequency targets (under-target or over-target)', () => {
      customersStore.set([
        {
          id: 'c-target-cust',
          name: 'Dr. Target Customer',
          classification: 'Class A', // Requires 2 visits in calendar month
          specialty: 'Cardiology',
          region: 'North region',
          meta: 'Class A · Cardiology · North region',
          repName: 'Ahmed Samir',
          status: 'Active',
          active: true,
        },
      ])

      // Plan provides 1 visit instead of required 2
      const invalidPlan = addVisitPlan({
        name: 'Under-target Campaign',
        repName: 'Ahmed Samir',
        repId: 'u-rep-1',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        frequency: 'Monthly',
        status: 'Draft',
        targetClients: ['Dr. Target Customer'],
        plannedProducts: ['Bevato'],
        stops: [
          {
            id: 's-1',
            clientName: 'Dr. Target Customer',
            clientId: 'c-target-cust',
            address: 'Clinic',
            priority: 'Class A',
            purpose: 'Visit 1',
            plannedTime: '09:00 AM',
            plannedDate: '2026-11-04',
          },
        ],
      })

      // Attempting to submit under-target plan must throw error and remain Draft
      assert.throws(() => {
        submitVisitPlanForApproval(invalidPlan.id, 'Ahmed Samir')
      }, /Plan validation failed/)

      const planAfterFail = visitPlansStore.get().find((p) => p.id === invalidPlan.id)
      assert.strictEqual(planAfterFail?.status, 'Draft', 'Plan must NOT become Pending Approval when validation fails')
    })

    test('Valid plan submission transitions to Pending Approval status and notifies manager', () => {
      customersStore.set([
        {
          id: 'c-valid-cust',
          name: 'Dr. Valid Customer',
          classification: 'Class B', // Requires 1 visit in calendar month
          specialty: 'Pediatrics',
          region: 'West region',
          meta: 'Class B · Pediatrics · West region',
          repName: 'Sara Ali',
          status: 'Active',
          active: true,
        },
      ])

      const validPlan = addVisitPlan({
        name: 'Valid B Campaign',
        repName: 'Sara Ali',
        repId: 'u-rep-2',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        frequency: 'Monthly',
        status: 'Draft',
        targetClients: ['Dr. Valid Customer'],
        plannedProducts: ['Naviro D3 Drops'],
        stops: [
          {
            id: 's-10',
            clientName: 'Dr. Valid Customer',
            clientId: 'c-valid-cust',
            address: 'Clinic',
            priority: 'Class B',
            purpose: 'Quarterly review',
            plannedTime: '10:00 AM',
            plannedDate: '2026-11-10',
          },
        ],
      })

      const submitted = submitVisitPlanForApproval(validPlan.id, 'Sara Ali')
      assert.strictEqual(submitted.status, 'Pending Approval')

      const notifs = notificationsStore.get()
      const pendingNotif = notifs.find((n) => n.title.includes('Visit Plan'))
      assert.ok(pendingNotif, 'Manager notification must be dispatched')
    })

    test('Representative cannot approve their own visit plan', () => {
      const plan = addVisitPlan({
        name: 'Self-approval Test',
        repName: 'Ahmed Samir',
        repId: 'u-rep-1',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        frequency: 'Monthly',
        status: 'Pending Approval',
        targetClients: [],
        plannedProducts: [],
        stops: [],
      })

      assert.throws(() => {
        approveVisitPlan(plan.id, { name: 'Ahmed Samir', role: 'rep', id: 'u-rep-1' })
      }, /A representative cannot approve their own visit plan/)
    })

    test('Manager rejection requires a non-empty reason and marks plan Rejected', () => {
      const plan = addVisitPlan({
        name: 'Rejection Test',
        repName: 'Sara Ali',
        repId: 'u-rep-2',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        frequency: 'Monthly',
        status: 'Pending Approval',
        targetClients: [],
        plannedProducts: [],
        stops: [],
      })

      // Empty reason throws error
      assert.throws(() => {
        rejectVisitPlan(plan.id, '   ', { name: 'Alex Morgan', role: 'admin' })
      }, /A rejection reason is required/)

      // Valid rejection
      const rejected = rejectVisitPlan(plan.id, 'Insufficient product campaign focus', { name: 'Alex Morgan', role: 'admin' })
      assert.strictEqual(rejected.status, 'Rejected')
      assert.strictEqual(rejected.rejectionReason, 'Insufficient product campaign focus')

      const notifs = notificationsStore.get()
      const rejectNotif = notifs.find((n) => n.title === 'Visit Plan Rejected')
      assert.ok(rejectNotif?.message.includes('Insufficient product campaign focus'))
    })

    test('Material modifications to an approved plan automatically return it to Pending Approval', () => {
      const plan = addVisitPlan({
        name: 'Approved Plan',
        repName: 'Sara Ali',
        repId: 'u-rep-2',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        frequency: 'Monthly',
        status: 'Approved',
        targetClients: ['Customer A'],
        plannedProducts: ['Bevato'],
        stops: [],
        reviewedBy: 'Alex Morgan',
        reviewedAt: '2026-10-31T10:00:00Z',
      })

      // Material change: adding another customer to the plan
      const updated = updateVisitPlan(
        plan.id,
        {
          targetClients: ['Customer A', 'Customer B'],
        },
        'Sara Ali'
      )

      assert.strictEqual(updated.status, 'Pending Approval', 'Material change must revert status to Pending Approval')
      assert.strictEqual(updated.reviewedAt, undefined, 'Outdated approval timestamp must be cleared')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Customer Classification — Verification
  // ──────────────────────────────────────────────────────────────────────────
  describe('5. Customer Classification Form & Field Verification', () => {
    test('Customer record correctly stores and updates classification (Class A, B, C)', () => {
      const customer = addCustomer({
        name: 'Dr. Classification Test',
        classification: 'Class A',
        specialty: 'Cardiology',
        region: 'North region',
        meta: 'Class A · Cardiology · North region',
        repName: 'Alex Morgan',
        status: 'Active',
      })

      assert.strictEqual(customer.classification, 'Class A')

      // Update to Class B
      updateCustomer(customer.id!, {
        classification: 'Class B',
      })

      const storedCust = customersStore.get().find((c) => c.id === customer.id)
      assert.strictEqual(storedCust?.classification, 'Class B')

      // Available to visit-frequency validation
      const stats = getCustomerVisitStats(customer.id!, '2026-11-01')
      assert.strictEqual(stats?.customerClass, 'B')
      assert.strictEqual(stats?.targetVisits, 1)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Targeted Verification Gap Tests
  // ──────────────────────────────────────────────────────────────────────────
  describe('6. Targeted Verification Gap Tests', () => {
    test('Dashboard KPI overdue calculation uses configurable visit targets dynamically', () => {
      customersStore.set([
        {
          id: 'c-kpi-test',
          name: 'Dr. KPI Overdue Test',
          classification: 'Class A', // Default target: 2 visits/month
          specialty: 'Cardiology',
          region: 'North region',
          meta: 'Class A · Cardiology · North region',
          repName: 'Ahmed Samir',
          status: 'Active',
          active: true,
        },
      ])

      // Initial state: 0 completed visits -> overdue
      assert.strictEqual(isCustomerOverdue('c-kpi-test', '2026-11-01'), true)

      // Add 1 completed visit -> still overdue (target is 2)
      addVisit({
        clientName: 'Dr. KPI Overdue Test',
        clientId: 'c-kpi-test',
        repName: 'Ahmed Samir',
        repId: 'u-rep-1',
        date: '2026-11-04',
        time: '10:00 AM',
        detail: 'Visit 1',
        status: 'Completed',
        productsPresented: ['Bevato'],
        samplesQuantity: 0,
        reactionEmoji: '👍',
        reactionLabel: 'Receptive',
        notes: '',
        nextVisitDate: '2026-11-18',
        gpsVerified: true,
      })
      assert.strictEqual(isCustomerOverdue('c-kpi-test', '2026-11-01'), true)

      // Add 2nd completed visit -> target met, no longer overdue
      addVisit({
        clientName: 'Dr. KPI Overdue Test',
        clientId: 'c-kpi-test',
        repName: 'Ahmed Samir',
        repId: 'u-rep-1',
        date: '2026-11-12',
        time: '11:00 AM',
        detail: 'Visit 2',
        status: 'Completed',
        productsPresented: ['Bevato'],
        samplesQuantity: 0,
        reactionEmoji: '👍',
        reactionLabel: 'Receptive',
        notes: '',
        nextVisitDate: '2026-11-25',
        gpsVerified: true,
      })
      assert.strictEqual(isCustomerOverdue('c-kpi-test', '2026-11-01'), false)

      // Admin updates Class A target from 2 to 3 visits
      updateVisitFrequencyPolicy({
        ...DEFAULT_VISIT_FREQUENCY_POLICY,
        A: { customerClass: 'A', targetVisits: 3, periodMonths: 1 },
      })

      // With target = 3, 2 completed visits is now overdue again!
      assert.strictEqual(isCustomerOverdue('c-kpi-test', '2026-11-01'), true)
    })

    test('Manager lookup resolves correctly when valid managerId exists', () => {
      // Seed user u-rep-1 (Ahmed Samir) has managerId: 'u-admin-1' (Alex Morgan)
      const managerById = getDirectManagerForRep('u-rep-1')
      assert.ok(managerById, 'Manager must be found for rep with managerId')
      assert.strictEqual(managerById?.id, 'u-admin-1')
      assert.strictEqual(managerById?.name, 'Alex Morgan')

      // Resolves by name as well
      const managerByName = getDirectManagerForRep('Ahmed Samir')
      assert.ok(managerByName, 'Manager must be found when resolved by rep name')
      assert.strictEqual(managerByName?.id, 'u-admin-1')
    })

    test('Manager lookup returns null when no managerId exists', () => {
      // Seed user u-rep-james (James Wilson) has no managerId assigned
      const manager = getDirectManagerForRep('u-rep-james')
      assert.strictEqual(manager, null, 'Must return null when rep has no managerId')

      const unknownManager = getDirectManagerForRep('Nonexistent User')
      assert.strictEqual(unknownManager, null, 'Must return null for unknown rep')
    })

    test('Self-approval prevention uses user IDs, allowing approval across users with identical first names', () => {
      // Rep plan created with repId: 'u-rep-alex', repName: 'Alex Taylor'
      const plan = addVisitPlan({
        name: 'Alex Taylor November Campaign',
        repName: 'Alex Taylor',
        repId: 'u-rep-alex',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        frequency: 'Monthly',
        status: 'Pending Approval',
        targetClients: ['Dr. Sarah Kim'],
        plannedProducts: ['Bevato'],
        stops: [
          {
            id: 'stop-alex-1',
            clientName: 'Dr. Sarah Kim',
            clientId: 'c-1',
            address: 'Clinic',
            priority: 'Class A',
            purpose: 'Detailing',
            plannedTime: '09:00 AM',
            plannedDate: '2026-11-04',
          },
          {
            id: 'stop-alex-2',
            clientName: 'Dr. Sarah Kim',
            clientId: 'c-1',
            address: 'Clinic',
            priority: 'Class A',
            purpose: 'Follow-up',
            plannedTime: '10:00 AM',
            plannedDate: '2026-11-18',
          },
        ],
      })

      // Self-approval attempt: rep Alex Taylor (id: 'u-rep-alex') tries to approve own plan -> BLOCKED
      assert.throws(() => {
        approveVisitPlan(plan.id, { id: 'u-rep-alex', name: 'Alex Taylor', role: 'rep' })
      }, /A representative cannot approve their own visit plan/)

      // Manager Alex Morgan (id: 'u-admin-1') shares the first name 'Alex' but has different ID -> ALLOWED
      const approved = approveVisitPlan(plan.id, { id: 'u-admin-1', name: 'Alex Morgan', role: 'admin' })
      assert.strictEqual(approved.status, 'Approved')
      assert.strictEqual(approved.reviewedBy, 'Alex Morgan')
    })

    test('Pharmacy classification required validation blocks empty or invalid classification', () => {
      // Empty string -> invalid
      const emptyCheck = validateCustomerClassification('')
      assert.strictEqual(emptyCheck.valid, false)
      assert.strictEqual(emptyCheck.error, 'Classification is required')

      // Whitespace -> invalid
      const spaceCheck = validateCustomerClassification('   ')
      assert.strictEqual(spaceCheck.valid, false)

      // Invalid class name -> invalid
      const invalidCheck = validateCustomerClassification('Class Z')
      assert.strictEqual(invalidCheck.valid, false)

      // Valid classes -> pass
      assert.strictEqual(validateCustomerClassification('Class A').valid, true)
      assert.strictEqual(validateCustomerClassification('Class B').valid, true)
      assert.strictEqual(validateCustomerClassification('Class C').valid, true)

      // Add pharmacy with classification and verify persistence
      const pharmacy = addCustomer({
        name: 'El-Ezaby Pharmacy Nasr City',
        clientCategory: 'hco',
        classification: 'Class A',
        specialty: 'Pharmacy',
        region: 'North region',
        meta: 'Community Pharmacy · North region · Class A',
        repName: 'Alex Morgan',
        status: 'Active',
      })

      assert.strictEqual(pharmacy.classification, 'Class A')
      const stored = customersStore.get().find((c) => c.id === pharmacy.id)
      assert.strictEqual(stored?.classification, 'Class A')
    })
  })
})
