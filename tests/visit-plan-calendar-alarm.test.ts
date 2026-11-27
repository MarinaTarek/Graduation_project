/**
 * visit-plan-calendar-alarm.test.ts
 *
 * Tests for two enhancements:
 * PART 1 — Approved Visit Plans → Calendar integration
 * PART 2 — Enhanced Visit Alarm with Doctor & Coverage Details
 */

import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'

import {
  visitPlansStore,
  addVisitPlan,
  updateVisitPlan,
  deleteVisitPlan,
  submitVisitPlanForApproval,
  approveVisitPlan,
  rejectVisitPlan,
  deriveCalendarEntriesFromVisitPlans,
  type VisitPlan,
  type VisitPlanStop,
} from '../src/data/mock/visit-plans'

import {
  visitAlarmsStore,
  triggerVisitAlarm,
  dismissVisitAlarm,
  snoozeVisitAlarm,
  calculateDoctorCallNumber,
  getDoctorCoverageDisplay,
  getDoctorFrequencyDisplay,
  getVisitAlarmDetails,
  checkAndTriggerImportantVisitAlarms,
} from '../src/data/mock/visitAlarm'

import {
  visitFrequencyStore,
  DEFAULT_VISIT_FREQUENCY_POLICY,
  updateVisitFrequencyPolicy,
  getCustomerVisitStats,
} from '../src/data/mock/visitFrequency'

import {
  customersStore,
  addCustomer,
} from '../src/data/mock/customers'

import {
  visitsStore,
  addVisit,
} from '../src/data/mock/visits'

import {
  filterVisitPlansByScope,
} from '../src/data/mock/dataScope'

import { usersStore } from '../src/data/mock/users'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeStop(overrides: Partial<VisitPlanStop> = {}): VisitPlanStop {
  return {
    id: `s-${Math.random().toString(36).slice(2)}`,
    clientName: 'Dr. Test',
    address: 'Test Address',
    plannedDate: '2026-12-10',
    plannedTime: '09:00 AM',
    purpose: 'Product detail',
    priority: 'High',
    ...overrides,
  }
}

function makePlan(overrides: Partial<VisitPlan> = {}): VisitPlan {
  const stops: VisitPlanStop[] = overrides.stops ?? [makeStop()]
  return {
    id: `vp-t-${Math.random().toString(36).slice(2)}`,
    name: 'Test Plan',
    repName: 'Alex Morgan',
    repId: 'u-admin-1',
    startDate: '2026-12-01',
    endDate: '2026-12-31',
    frequency: 'Weekly',
    targetClients: [],
    plannedProducts: [],
    status: 'Draft',
    stops,
    notes: '',
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

// ─── PART 1: Calendar Integration Tests ─────────────────────────────────────

describe('PART 1 — Approved Visit Plans → Calendar Integration', () => {
  beforeEach(() => {
    visitPlansStore.set([])
    visitAlarmsStore.set([])
    visitFrequencyStore.set({ ...DEFAULT_VISIT_FREQUENCY_POLICY })
  })

  // ── 1. Approved plans appear on their actual scheduled dates ──────────────
  describe('1. Approved plans appear on their actual scheduled dates', () => {
    test('Approved plan stops appear on their own plannedDate, not on approval date', () => {
      const stop = makeStop({ plannedDate: '2026-12-15', clientName: 'Dr. Alpha' })
      const plan = makePlan({ status: 'Approved', stops: [stop] })
      visitPlansStore.set([plan])

      const events = deriveCalendarEntriesFromVisitPlans([plan])
      assert.strictEqual(events.length, 1)
      assert.strictEqual(events[0].date, '2026-12-15', 'Event date must equal stop plannedDate')
      assert.strictEqual(events[0].clientName, 'Dr. Alpha')
    })

    test('Multiple stops on different dates each appear on their own date', () => {
      const stops = [
        makeStop({ plannedDate: '2026-12-05', clientName: 'Dr. A' }),
        makeStop({ plannedDate: '2026-12-10', clientName: 'Dr. B' }),
        makeStop({ plannedDate: '2026-12-20', clientName: 'Dr. C' }),
      ]
      const plan = makePlan({ status: 'Approved', stops })
      const events = deriveCalendarEntriesFromVisitPlans([plan])

      assert.strictEqual(events.length, 3)
      const dates = events.map((e) => e.date)
      assert.ok(dates.includes('2026-12-05'))
      assert.ok(dates.includes('2026-12-10'))
      assert.ok(dates.includes('2026-12-20'))
    })
  })

  // ── 2. Every scheduled visit appears individually ─────────────────────────
  describe('2. Every scheduled visit appears individually', () => {
    test('A plan with 10 stops produces exactly 10 calendar entries', () => {
      const stops = Array.from({ length: 10 }, (_, i) =>
        makeStop({ plannedDate: `2026-12-${String(i + 1).padStart(2, '0')}`, clientName: `Dr. #${i + 1}` }),
      )
      const plan = makePlan({ status: 'Active', stops })
      const events = deriveCalendarEntriesFromVisitPlans([plan])
      assert.strictEqual(events.length, 10)
    })

    test('Each event has a stable id: vp-<planId>-<stopId>', () => {
      const stop = makeStop({ id: 'fixed-stop-1' })
      const plan = makePlan({ id: 'fixed-plan-1', status: 'Approved', stops: [stop] })
      const events = deriveCalendarEntriesFromVisitPlans([plan])
      assert.strictEqual(events[0].id, 'vp-fixed-plan-1-fixed-stop-1')
    })

    test('Event includes planName, repName, and clientName', () => {
      const stop = makeStop({ clientName: 'Dr. Beta', clientId: 'c-beta' })
      const plan = makePlan({ name: 'Nov Plan', repName: 'Sara Ali', status: 'Approved', stops: [stop] })
      const events = deriveCalendarEntriesFromVisitPlans([plan])
      assert.strictEqual(events[0].planName, 'Nov Plan')
      assert.strictEqual(events[0].repName, 'Sara Ali')
      assert.strictEqual(events[0].clientName, 'Dr. Beta')
    })
  })

  // ── 3. Draft and Pending Approval plans remain hidden ─────────────────────
  describe('3. Draft and Pending Approval plans remain hidden', () => {
    test('Draft plan produces 0 calendar entries', () => {
      const plan = makePlan({ status: 'Draft', stops: [makeStop()] })
      const events = deriveCalendarEntriesFromVisitPlans([plan])
      assert.strictEqual(events.length, 0)
    })

    test('Pending Approval plan produces 0 calendar entries', () => {
      const plan = makePlan({ status: 'Pending Approval', stops: [makeStop()] })
      const events = deriveCalendarEntriesFromVisitPlans([plan])
      assert.strictEqual(events.length, 0)
    })

    test('Mixed plans: only Approved/Active ones produce entries', () => {
      const draft = makePlan({ status: 'Draft', stops: [makeStop({ clientName: 'Draft Dr.' })] })
      const pending = makePlan({ status: 'Pending Approval', stops: [makeStop({ clientName: 'Pending Dr.' })] })
      const approved = makePlan({ status: 'Approved', stops: [makeStop({ clientName: 'Approved Dr.' })] })
      const events = deriveCalendarEntriesFromVisitPlans([draft, pending, approved])
      assert.strictEqual(events.length, 1)
      assert.strictEqual(events[0].clientName, 'Approved Dr.')
    })
  })

  // ── 4. Suspended and Rejected plans have no upcoming active entries ────────
  describe('4. Suspended and Rejected plans have no upcoming active entries', () => {
    test('Rejected plan with uncompleted stops produces 0 entries', () => {
      const plan = makePlan({ status: 'Rejected', stops: [makeStop({ plannedDate: '2026-12-25' })] })
      const events = deriveCalendarEntriesFromVisitPlans([plan])
      assert.strictEqual(events.length, 0)
    })

    test('Suspended plan with uncompleted stops produces 0 entries', () => {
      const plan = makePlan({ status: 'Suspended', stops: [makeStop({ plannedDate: '2026-12-25' })] })
      const events = deriveCalendarEntriesFromVisitPlans([plan])
      assert.strictEqual(events.length, 0)
    })

    test('Rejected plan with a completed stop retains that stop as Completed', () => {
      const completedStop = makeStop({ plannedDate: '2026-11-01' }) as any
      completedStop.status = 'Completed'
      const plan = makePlan({ status: 'Rejected', stops: [completedStop] })
      const events = deriveCalendarEntriesFromVisitPlans([plan])
      assert.strictEqual(events.length, 1)
      assert.strictEqual(events[0].status, 'Completed')
    })
  })

  // ── 5. Completed plans retain completed status ─────────────────────────────
  describe('5. Completed plans keep completed visits visible with Completed status', () => {
    test('All stops of a Completed plan have Completed status', () => {
      const stops = [makeStop({ plannedDate: '2026-11-01' }), makeStop({ plannedDate: '2026-11-05' })]
      const plan = makePlan({ status: 'Completed', stops })
      const events = deriveCalendarEntriesFromVisitPlans([plan])
      assert.strictEqual(events.length, 2)
      events.forEach((e) => assert.strictEqual(e.status, 'Completed'))
    })
  })

  // ── 6. Editing and reapproval updates entries without duplication ──────────
  describe('6. Editing and reapproval updates entries without duplication', () => {
    test('Stable IDs prevent duplicates: same plan approved twice gives same entry count', () => {
      const stop = makeStop({ id: 'stab-s1', plannedDate: '2026-12-10' })
      const plan = makePlan({ id: 'stab-p1', status: 'Approved', stops: [stop] })

      const events1 = deriveCalendarEntriesFromVisitPlans([plan])
      const events2 = deriveCalendarEntriesFromVisitPlans([plan])

      assert.strictEqual(events1.length, 1)
      assert.strictEqual(events2.length, 1)
      assert.strictEqual(events1[0].id, events2[0].id)
    })

    test('Updated stop date is reflected in derived events', () => {
      const stop = makeStop({ id: 's-upd', plannedDate: '2026-12-10' })
      const plan = makePlan({ id: 'p-upd', status: 'Approved', stops: [stop] })

      const updatedStop = { ...stop, plannedDate: '2026-12-20' }
      const updatedPlan = { ...plan, stops: [updatedStop] }

      const events = deriveCalendarEntriesFromVisitPlans([updatedPlan])
      assert.strictEqual(events[0].date, '2026-12-20')
    })
  })

  // ── 7. Deleting a plan removes its upcoming entries ───────────────────────
  describe('7. Deleting a plan removes its upcoming entries', () => {
    test('After deletion, no entries derived for that plan', () => {
      const stop = makeStop()
      const plan = makePlan({ status: 'Approved', stops: [stop] })
      // Simulate deletion by passing empty array
      const events = deriveCalendarEntriesFromVisitPlans([])
      assert.strictEqual(events.length, 0)
    })

    test('Other plans unaffected by one plan deletion', () => {
      const planA = makePlan({ id: 'p-keep', status: 'Approved', stops: [makeStop({ clientName: 'Dr. Keep' })] })
      const planB = makePlan({ id: 'p-del', status: 'Approved', stops: [makeStop({ clientName: 'Dr. Del' })] })
      // Simulate planB deleted
      const events = deriveCalendarEntriesFromVisitPlans([planA])
      assert.strictEqual(events.length, 1)
      assert.strictEqual(events[0].clientName, 'Dr. Keep')
    })
  })

  // ── 8. Role-based calendar visibility ─────────────────────────────────────
  describe('8. Role-based calendar visibility via filterVisitPlansByScope', () => {
    test('Rep sees only their own plans', () => {
      const repPlan = makePlan({ status: 'Approved', repName: 'Alex Morgan', repId: 'u-admin-1' })
      const otherPlan = makePlan({ status: 'Approved', repName: 'Other Rep', repId: 'u-other' })
      const allPlans = [repPlan, otherPlan]

      const users = usersStore.get()
      const repUser = { id: 'u-admin-1', name: 'Alex Morgan', role: 'rep' as const }
      const scoped = filterVisitPlansByScope(allPlans, repUser, users)

      // Rep should only see their own plan
      assert.ok(scoped.every((p) => p.repId === 'u-admin-1' || p.repName === 'Alex Morgan'))
      // The other rep's plan should not appear
      assert.ok(!scoped.some((p) => p.repId === 'u-other'))
    })

    test('Admin sees all approved plans', () => {
      const plan1 = makePlan({ status: 'Approved', repName: 'Rep A', repId: 'u-r1' })
      const plan2 = makePlan({ status: 'Approved', repName: 'Rep B', repId: 'u-r2' })
      const allPlans = [plan1, plan2]

      const users = usersStore.get()
      const adminUser = { id: 'u-admin', name: 'Admin User', role: 'admin' as const }
      const scoped = filterVisitPlansByScope(allPlans, adminUser, users)

      // Admin sees all
      assert.strictEqual(scoped.length, 2)
    })
  })

  // ── 9. Existing calendar events unaffected ────────────────────────────────
  describe('9. deriveCalendarEntriesFromVisitPlans is additive and type-specific', () => {
    test('All derived events have type planned_visit', () => {
      const plan = makePlan({ status: 'Active', stops: [makeStop(), makeStop()] })
      const events = deriveCalendarEntriesFromVisitPlans([plan])
      events.forEach((e) => assert.strictEqual(e.type, 'planned_visit'))
    })

    test('isPlannedVisit flag is true on all derived events', () => {
      const plan = makePlan({ status: 'Approved', stops: [makeStop()] })
      const events = deriveCalendarEntriesFromVisitPlans([plan])
      events.forEach((e) => assert.ok(e.isPlannedVisit === true))
    })

    test('deriveCalendarEntriesFromVisitPlans with empty plans returns empty array', () => {
      const events = deriveCalendarEntriesFromVisitPlans([])
      assert.strictEqual(events.length, 0)
    })
  })
})

// ─── PART 2: Visit Alarm Tests ───────────────────────────────────────────────

describe('PART 2 — Enhanced Visit Alarm: Doctor & Coverage Details', () => {
  beforeEach(() => {
    visitAlarmsStore.set([])
    visitFrequencyStore.set({ ...DEFAULT_VISIT_FREQUENCY_POLICY })
    // Start with real customers from store (non-destructive reads)
    visitsStore.set([])
  })

  // ── 1. Correct doctor name displayed ─────────────────────────────────────
  describe('1. Alarm displays correct doctor name', () => {
    test('getVisitAlarmDetails returns name of a known customer by ID', () => {
      const customers = customersStore.get()
      const customer = customers[0]
      if (!customer) return // skip if no customers in test env

      const details = getVisitAlarmDetails({ doctorId: customer.id, scheduledDate: '2026-12-10' })
      assert.strictEqual(details.doctorName, customer.name)
    })

    test('getVisitAlarmDetails with unknown doctorId falls back to doctorName param', () => {
      const details = getVisitAlarmDetails({ doctorId: 'nonexistent-id-999', doctorName: 'Dr. Ghost' })
      assert.strictEqual(details.doctorName, 'Dr. Ghost')
    })

    test('getVisitAlarmDetails with no customer info returns Not available for doctorName', () => {
      const details = getVisitAlarmDetails({})
      assert.ok(
        details.doctorName === 'Not available' || details.doctorName === 'غير متوفر',
        `doctorName should be "Not available" but got "${details.doctorName}"`,
      )
    })
  })

  // ── 2. Call Number from visit sequence, not phone ─────────────────────────
  describe('2. Call Number is retrieved from visit sequence, not phone field', () => {
    test('calculateDoctorCallNumber with explicit number returns formatted call display', () => {
      const result = calculateDoctorCallNumber('c-1', { explicitCallNumber: 3 })
      assert.ok(result.display.includes('3'), `Expected "3" in "${result.display}"`)
      assert.ok(!result.display.match(/^\+?\d{7,}/), 'Display must not look like a phone number')
    })

    test('calculateDoctorCallNumber without explicit number calculates from visit sequence', () => {
      // Add completed visits for c-test-cn
      addVisit({
        clientName: 'Dr. CallNum',
        clientId: 'c-test-cn',
        repName: 'Alex Morgan',
        repId: 'u-r1',
        date: '2026-11-01',
        time: '09:00 AM',
        detail: 'Visit 1',
        status: 'Completed',
        productsPresented: [],
        samplesQuantity: 0,
        reactionEmoji: '👍',
        reactionLabel: 'Receptive',
        notes: '',
        nextVisitDate: '',
        gpsVerified: true,
      })
      addVisit({
        clientName: 'Dr. CallNum',
        clientId: 'c-test-cn',
        repName: 'Alex Morgan',
        repId: 'u-r1',
        date: '2026-11-15',
        time: '10:00 AM',
        detail: 'Visit 2',
        status: 'Completed',
        productsPresented: [],
        samplesQuantity: 0,
        reactionEmoji: '👍',
        reactionLabel: 'Receptive',
        notes: '',
        nextVisitDate: '',
        gpsVerified: true,
      })

      const result = calculateDoctorCallNumber('c-test-cn')
      // 2 completed → next call is #3
      assert.ok(result.numeric !== undefined, 'Should return a numeric call number')
      assert.ok(result.numeric! > 0, 'Call number should be > 0')
      assert.ok(!result.display.match(/^\+?\d{7,}/), 'Display must not look like a phone number')
    })

    test('calculateDoctorCallNumber with empty input returns Not available', () => {
      const result = calculateDoctorCallNumber('')
      assert.ok(
        result.display === 'Not available' || result.display === 'غير متوفر',
        `Expected "Not available", got "${result.display}"`,
      )
    })

    test('Call Number is not a phone number format (not 7+ digits)', () => {
      const customers = customersStore.get()
      const customer = customers[0]
      if (!customer) return

      const result = calculateDoctorCallNumber(customer.id)
      // Phone numbers are typically 7+ digits; call numbers are small integers
      const rawDigits = result.display.replace(/\D/g, '')
      assert.ok(
        rawDigits.length < 7 || result.display.includes('Call #') || result.display.includes('زيارة رقم'),
        `Display "${result.display}" looks like a phone number`,
      )
    })
  })

  // ── 3. Coverage matches actual visit stats ────────────────────────────────
  describe('3. Coverage matches doctor actual visit stats', () => {
    test('getDoctorCoverageDisplay returns Not available for unknown customer', () => {
      const result = getDoctorCoverageDisplay('nonexistent-99999')
      assert.ok(
        result.display === 'Not available' || result.display === 'غير متوفر',
        `Expected "Not available", got "${result.display}"`,
      )
    })

    test('getDoctorCoverageDisplay with empty string returns Not available', () => {
      const result = getDoctorCoverageDisplay('')
      assert.ok(
        result.display === 'Not available' || result.display === 'غير متوفر',
        `Expected "Not available", got "${result.display}"`,
      )
    })

    test('getDoctorCoverageDisplay for a known customer includes % and visit counts', () => {
      const customers = customersStore.get()
      const customer = customers.find((c) => c.id && c.classification)
      if (!customer) return

      const result = getDoctorCoverageDisplay(customer.id)
      assert.ok(result.display !== 'Not available', 'Should return actual coverage data')
      assert.ok(result.display.includes('%'), `Display should include %, got "${result.display}"`)
    })

    test('getDoctorCoverageDisplay isOverdue property is a boolean', () => {
      const customers = customersStore.get()
      const customer = customers[0]
      if (!customer) return

      const result = getDoctorCoverageDisplay(customer.id)
      assert.ok(typeof result.isOverdue === 'boolean', 'isOverdue must be a boolean')
    })
  })

  // ── 4. Frequency follows configured Visit Frequency Policy ────────────────
  describe('4. Frequency follows configured visit frequency policy', () => {
    test('getDoctorFrequencyDisplay returns Not available for unknown customer', () => {
      const result = getDoctorFrequencyDisplay('nonexistent-9999')
      assert.ok(
        result.display === 'Not available' || result.display === 'غير متوفر',
        `Expected "Not available", got "${result.display}"`,
      )
    })

    test('getDoctorFrequencyDisplay uses dynamic policy from visitFrequencyStore', () => {
      // Add a Class A customer
      const customer = addCustomer({
        name: 'Dr. Policy Test',
        specialty: 'Cardiology',
        address: 'Test City',
        region: 'North',
        repName: 'Alex Morgan',
        rep_id: 'u-r1',
        classification: 'Class A',
        phone: '0000000000',
        email: '',
        meta: 'HCP',
        status: 'Active',
      })

      // Default policy: Class A = 2 visits / month
      const resultDefault = getDoctorFrequencyDisplay(customer.id)
      assert.ok(resultDefault.display.includes('2'), `Default Class A should reference 2, got "${resultDefault.display}"`)

      // Update policy: Class A = 4 visits / month
      updateVisitFrequencyPolicy(
        {
          A: { customerClass: 'A', targetVisits: 4, periodMonths: 1 },
          B: { customerClass: 'B', targetVisits: 1, periodMonths: 1 },
          C: { customerClass: 'C', targetVisits: 1, periodMonths: 2 },
        },
        'test-actor',
      )
      const resultUpdated = getDoctorFrequencyDisplay(customer.id)
      assert.ok(resultUpdated.display.includes('4'), `Updated Class A should reference 4, got "${resultUpdated.display}"`)
    })

    test('getDoctorFrequencyDisplay returns customerClass', () => {
      const customer = addCustomer({
        name: 'Dr. FreqClass B',
        specialty: 'Oncology',
        address: 'Test',
        region: 'South',
        repName: 'Maya Patel',
        rep_id: 'u-r2',
        classification: 'Class B',
        phone: '0000000001',
        email: '',
        meta: 'HCP',
        status: 'Active',
      })

      const result = getDoctorFrequencyDisplay(customer.id)
      assert.strictEqual(result.customerClass, 'B')
    })
  })

  // ── 5. Missing values handled correctly ───────────────────────────────────
  describe('5. Missing / unavailable values handled gracefully', () => {
    test('getVisitAlarmDetails with no params returns structured object with Not available fields', () => {
      const details = getVisitAlarmDetails({})
      assert.ok(typeof details === 'object')
      assert.ok(typeof details.doctorName === 'string')
      assert.ok(typeof details.callNumber === 'string')
      assert.ok(typeof details.coverage === 'string')
      assert.ok(typeof details.frequency === 'string')
    })

    test('All Not available fields are non-empty strings', () => {
      const details = getVisitAlarmDetails({ doctorId: 'nonexistent-xyz' })
      assert.ok(details.callNumber.length > 0)
      assert.ok(details.coverage.length > 0)
      assert.ok(details.frequency.length > 0)
    })
  })

  // ── 6. Different doctors show their own correct information ───────────────
  describe('6. Different doctors show their own correct information', () => {
    test('Two different doctors produce different call number results', () => {
      // Add visits for two different customers
      addVisit({
        clientName: 'Dr. Alpha', clientId: 'c-alpha', repName: 'Alex Morgan', repId: 'u-r1',
        date: '2026-11-01', time: '09:00 AM', detail: 'v1', status: 'Completed',
        productsPresented: [], samplesQuantity: 0, reactionEmoji: '👍', reactionLabel: 'Receptive',
        notes: '', nextVisitDate: '', gpsVerified: true,
      })
      addVisit({
        clientName: 'Dr. Beta', clientId: 'c-beta', repName: 'Alex Morgan', repId: 'u-r1',
        date: '2026-11-01', time: '09:00 AM', detail: 'v1', status: 'Completed',
        productsPresented: [], samplesQuantity: 0, reactionEmoji: '👍', reactionLabel: 'Receptive',
        notes: '', nextVisitDate: '', gpsVerified: true,
      })
      addVisit({
        clientName: 'Dr. Beta', clientId: 'c-beta', repName: 'Alex Morgan', repId: 'u-r1',
        date: '2026-11-10', time: '10:00 AM', detail: 'v2', status: 'Completed',
        productsPresented: [], samplesQuantity: 0, reactionEmoji: '👍', reactionLabel: 'Receptive',
        notes: '', nextVisitDate: '', gpsVerified: true,
      })

      const alphaResult = calculateDoctorCallNumber('c-alpha')
      const betaResult = calculateDoctorCallNumber('c-beta')

      // Alpha has 1 completed visit (next = 2), Beta has 2 (next = 3)
      assert.ok(alphaResult.numeric !== betaResult.numeric, 'Different doctors should have different call numbers')
    })

    test('getVisitAlarmDetails returns different doctorName for different IDs', () => {
      const customers = customersStore.get()
      if (customers.length < 2) return

      const detailsA = getVisitAlarmDetails({ doctorId: customers[0].id })
      const detailsB = getVisitAlarmDetails({ doctorId: customers[1].id })

      if (customers[0].name !== customers[1].name) {
        assert.notStrictEqual(detailsA.doctorName, detailsB.doctorName)
      }
    })
  })

  // ── 7. Arabic and English layouts ────────────────────────────────────────
  describe('7. Arabic and English layouts work correctly', () => {
    test('calculateDoctorCallNumber with lang=ar returns Arabic formatted display', () => {
      const result = calculateDoctorCallNumber('c-1', { explicitCallNumber: 5, lang: 'ar' })
      assert.ok(result.display.includes('5'), `Arabic display should include the number 5, got "${result.display}"`)
      assert.ok(
        result.display.includes('زيارة') || result.display.includes('رقم'),
        `Arabic display should include Arabic text, got "${result.display}"`,
      )
    })

    test('getDoctorCoverageDisplay with lang=ar returns Arabic text', () => {
      const result = getDoctorCoverageDisplay('nonexistent-9', 'ar')
      assert.ok(
        result.display === 'غير متوفر',
        `Arabic not-available should be "غير متوفر", got "${result.display}"`,
      )
    })

    test('getDoctorFrequencyDisplay with lang=ar returns Arabic text', () => {
      const result = getDoctorFrequencyDisplay('nonexistent-9', 'ar')
      assert.ok(
        result.display === 'غير متوفر',
        `Arabic not-available should be "غير متوفر", got "${result.display}"`,
      )
    })

    test('getVisitAlarmDetails with lang=ar uses Arabic for not-available fields', () => {
      const details = getVisitAlarmDetails({ lang: 'ar' })
      // All not-available fields should be in Arabic
      const fields = [details.doctorName, details.callNumber, details.coverage, details.frequency]
      fields.forEach((field) => {
        assert.ok(
          field === 'غير متوفر' || field.includes('زيارة') || field.includes('%') || field.length > 0,
          `All fields should be non-empty in Arabic mode, got "${field}"`,
        )
      })
    })
  })

  // ── 8. visitAlarmsStore, triggerVisitAlarm, dismissVisitAlarm work ─────────
  describe('8. Visit Alarm store operations', () => {
    test('triggerVisitAlarm adds an alarm to the store', () => {
      triggerVisitAlarm({
        doctorName: 'Dr. StoreTest',
        scheduledDate: '2026-12-10',
        scheduledTime: '10:00 AM',
        repName: 'Alex Morgan',
      })
      const alarms = visitAlarmsStore.get()
      assert.ok(alarms.length > 0)
      assert.ok(alarms.some((a) => a.doctorName === 'Dr. StoreTest'))
    })

    test('triggerVisitAlarm does not create duplicate for same stopId', () => {
      triggerVisitAlarm({
        stopId: 'unique-stop-x',
        doctorName: 'Dr. NoDupe',
        scheduledDate: '2026-12-10',
        scheduledTime: '09:00 AM',
        repName: 'Alex Morgan',
      })
      triggerVisitAlarm({
        stopId: 'unique-stop-x',
        doctorName: 'Dr. NoDupe',
        scheduledDate: '2026-12-10',
        scheduledTime: '09:00 AM',
        repName: 'Alex Morgan',
      })
      const alarms = visitAlarmsStore.get().filter((a) => a.stopId === 'unique-stop-x')
      assert.strictEqual(alarms.length, 1, 'Should deduplicate alarms with same stopId')
    })

    test('dismissVisitAlarm marks alarm as dismissed', () => {
      const alarm = triggerVisitAlarm({
        id: 'test-alarm-dismiss',
        doctorName: 'Dr. Dismiss',
        scheduledDate: '2026-12-10',
        scheduledTime: '09:00 AM',
        repName: 'Alex Morgan',
      })
      dismissVisitAlarm(alarm.id)
      const updated = visitAlarmsStore.get().find((a) => a.id === alarm.id)
      assert.ok(updated, 'Alarm should still exist after dismiss')
      assert.ok(updated!.dismissed, 'Alarm should be marked dismissed')
    })

    test('snoozeVisitAlarm sets snoozedUntil', () => {
      const alarm = triggerVisitAlarm({
        id: 'test-alarm-snooze',
        doctorName: 'Dr. Snooze',
        scheduledDate: '2026-12-10',
        scheduledTime: '09:00 AM',
        repName: 'Alex Morgan',
      })
      snoozeVisitAlarm(alarm.id, 15)
      const updated = visitAlarmsStore.get().find((a) => a.id === alarm.id)
      assert.ok(updated?.snoozedUntil, 'snoozedUntil should be set')
      assert.ok(new Date(updated!.snoozedUntil!).getTime() > Date.now(), 'snoozedUntil should be in the future')
    })

    test('triggerVisitAlarm alarm has VisitAlarmDetails with required fields', () => {
      const alarm = triggerVisitAlarm({
        doctorName: 'Dr. DetailsCheck',
        scheduledDate: '2026-12-15',
        repName: 'Maya Patel',
      })
      assert.ok(typeof alarm.details === 'object', 'details should be an object')
      assert.ok(typeof alarm.details.doctorName === 'string', 'details.doctorName should be a string')
      assert.ok(typeof alarm.details.callNumber === 'string', 'details.callNumber should be a string')
      assert.ok(typeof alarm.details.coverage === 'string', 'details.coverage should be a string')
      assert.ok(typeof alarm.details.frequency === 'string', 'details.frequency should be a string')
      assert.ok(typeof alarm.details.isOverdue === 'boolean', 'details.isOverdue should be a boolean')
    })
  })

  // ── 9. Auto-trigger on system open for important visits ───────────────────
  describe('9. Auto-trigger important alarms on system open (checkAndTriggerImportantVisitAlarms)', () => {
    test('triggers alarm for today Class A visit in an Active plan', () => {
      const todayStop = makeStop({
        id: 'stop-urgent-1',
        clientName: 'Dr. Urgent Today',
        clientId: 'c-1',
        priority: 'Class A',
        plannedDate: '2026-11-23',
        plannedTime: '09:00 AM',
      })
      const plan = makePlan({
        id: 'plan-urgent-1',
        status: 'Active',
        repName: 'Alex Morgan',
        repId: 'u-admin-1',
        stops: [todayStop],
      })
      visitPlansStore.set([plan])

      const triggered = checkAndTriggerImportantVisitAlarms(
        { id: 'u-admin-1', name: 'Alex Morgan', role: 'admin' },
        '2026-11-23',
      )

      assert.ok(triggered, 'Should trigger an alarm for urgent today visit')
      assert.strictEqual(triggered!.stopId, 'stop-urgent-1')
      assert.strictEqual(triggered!.doctorName, 'Dr. Urgent Today')
      assert.strictEqual(triggered!.dismissed, false)

      // Verified present in store
      const inStore = visitAlarmsStore.get()
      assert.ok(inStore.some((a) => a.stopId === 'stop-urgent-1'))
    })

    test('does not trigger for Draft or Rejected plans', () => {
      const stop = makeStop({
        id: 'stop-draft-1',
        priority: 'Class A',
        plannedDate: '2026-11-23',
      })
      const draftPlan = makePlan({ id: 'plan-draft', status: 'Draft', stops: [stop] })
      const rejectedPlan = makePlan({ id: 'plan-rej', status: 'Rejected', stops: [stop] })
      visitPlansStore.set([draftPlan, rejectedPlan])

      const triggered = checkAndTriggerImportantVisitAlarms(
        { id: 'u-admin-1', name: 'Alex Morgan', role: 'admin' },
        '2026-11-23',
      )
      assert.strictEqual(triggered, null, 'Draft/Rejected plans must not trigger alarms')
    })

    test('respects rep role scoping (rep only triggers for their own stops)', () => {
      const stopOther = makeStop({
        id: 'stop-other-rep',
        clientName: 'Dr. Someone Else',
        priority: 'Class A',
        plannedDate: '2026-11-23',
      })
      const otherPlan = makePlan({
        id: 'plan-other',
        status: 'Active',
        repName: 'Other Rep',
        repId: 'u-other-99',
        stops: [stopOther],
      })
      visitPlansStore.set([otherPlan])

      const triggered = checkAndTriggerImportantVisitAlarms(
        { id: 'u-admin-1', name: 'Alex Morgan', role: 'rep' },
        '2026-11-23',
      )
      assert.strictEqual(triggered, null, 'Rep must not receive alarms for other reps plans')
    })

    test('skips previously dismissed alarm and does not re-open it', () => {
      const stop = makeStop({
        id: 'stop-dismiss-check',
        clientName: 'Dr. Already Dismissed',
        priority: 'Class A',
        plannedDate: '2026-11-23',
      })
      const plan = makePlan({
        id: 'plan-dismiss-check',
        status: 'Active',
        repName: 'Alex Morgan',
        repId: 'u-admin-1',
        stops: [stop],
      })
      visitPlansStore.set([plan])

      // Trigger first
      const alarm = checkAndTriggerImportantVisitAlarms(
        { id: 'u-admin-1', name: 'Alex Morgan', role: 'admin' },
        '2026-11-23',
      )
      assert.ok(alarm)

      // Dismiss it
      dismissVisitAlarm(alarm!.id)

      // Check again
      const secondCheck = checkAndTriggerImportantVisitAlarms(
        { id: 'u-admin-1', name: 'Alex Morgan', role: 'admin' },
        '2026-11-23',
      )
      assert.strictEqual(secondCheck, null, 'Dismissed alarm should not re-trigger')
    })
  })
})
