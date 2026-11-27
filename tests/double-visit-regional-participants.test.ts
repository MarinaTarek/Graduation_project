/**
 * double-visit-regional-participants.test.ts
 *
 * Verification suite for Double Visit — Regional Manager Participant Selection:
 * 1. Same-region representatives appear.
 * 2. The responsible First Line Manager appears.
 * 3. Eligible Business Unit Managers appear.
 * 4. Other-region users do not appear.
 * 5. Self-invitation is blocked.
 * 6. Inactive and unapproved users are excluded.
 * 7. Managers can receive and respond to invitations.
 * 8. Existing Double Visit behavior remains intact (single customer visit count, primary rep as owner).
 */

import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'

import {
  getEligibleDoubleVisitParticipants,
  type EligibleDoubleVisitParticipant,
} from '../src/data/mock/dataScope'

import {
  usersStore,
  type StoredAdminUser,
} from '../src/data/mock/users'

import {
  visitsStore,
  addVisit,
  createJointVisitInvitation,
  respondToJointVisitInvitation,
  jointVisitInvitationsStore,
  type StoredVisit,
} from '../src/data/mock/visits'

import {
  customersStore,
  type Customer,
} from '../src/data/mock/customers'

import { notificationsStore } from '../src/data/mock/notifications'
import { getCustomerVisitStats } from '../src/data/mock/visitFrequency'

// ── Test User Hierarchy ──────────────────────────────────────────────────────
const TEST_USERS: StoredAdminUser[] = [
  {
    id: 'u-rep-ahmed',
    name: 'Ahmed Samir',
    email: 'ahmed@navigen.com',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'North region',
    businessUnit: 'Cardio-Metabolic',
    status: 'Active',
    managerId: 'u-flm-mona',
  },
  {
    id: 'u-rep-olivia',
    name: 'Olivia Martin',
    email: 'olivia@navigen.com',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'North region',
    businessUnit: 'Cardio-Metabolic',
    status: 'Active',
    managerId: 'u-flm-mona',
  },
  {
    id: 'u-rep-sara',
    name: 'Sara Ali',
    email: 'sara@navigen.com',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'West region',
    businessUnit: 'Cardio-Metabolic',
    status: 'Active',
    managerId: 'u-flm-west',
  },
  {
    id: 'u-flm-mona',
    name: 'Mona Mansour',
    email: 'mona@navigen.com',
    role: 'First Line Manager',
    roleType: 'first_line_manager',
    region: 'North region',
    businessUnit: 'Cardio-Metabolic',
    status: 'Active',
    managerId: 'u-bum-khaled',
  },
  {
    id: 'u-flm-other',
    name: 'Tarek Regional FLM',
    email: 'tarek@navigen.com',
    role: 'First Line Manager',
    roleType: 'first_line_manager',
    region: 'North region',
    businessUnit: 'Respiratory',
    status: 'Active',
    managerId: 'u-bum-other',
  },
  {
    id: 'u-flm-west',
    name: 'Hossam West FLM',
    email: 'hossam@navigen.com',
    role: 'First Line Manager',
    roleType: 'first_line_manager',
    region: 'West region',
    businessUnit: 'Cardio-Metabolic',
    status: 'Active',
  },
  {
    id: 'u-bum-khaled',
    name: 'Dr. Khaled Fawzy',
    email: 'khaled@navigen.com',
    role: 'Business Unit Manager',
    roleType: 'business_unit_manager',
    region: 'North region',
    businessUnit: 'Cardio-Metabolic',
    status: 'Active',
    managerId: 'u-admin-1',
  },
  {
    id: 'u-bum-global',
    name: 'Dr. Hazem Global BUM',
    email: 'hazem@navigen.com',
    role: 'Business Unit Manager',
    roleType: 'business_unit_manager',
    region: 'HQ - Global',
    businessUnit: 'Cardio-Metabolic',
    status: 'Active',
    managerId: 'u-admin-1',
  },
  {
    id: 'u-bum-west',
    name: 'Dr. Yasser West BUM',
    email: 'yasser@navigen.com',
    role: 'Business Unit Manager',
    roleType: 'business_unit_manager',
    region: 'West region',
    businessUnit: 'Respiratory',
    status: 'Active',
  },
  {
    id: 'u-rep-pending',
    name: 'Hany Pending Rep',
    email: 'hany@navigen.com',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'North region',
    businessUnit: 'Cardio-Metabolic',
    status: 'Pending',
  },
  {
    id: 'u-flm-inactive',
    name: 'Sameh Inactive FLM',
    email: 'sameh@navigen.com',
    role: 'First Line Manager',
    roleType: 'first_line_manager',
    region: 'North region',
    businessUnit: 'Cardio-Metabolic',
    status: 'Inactive',
  },
  {
    id: 'u-admin-1',
    name: 'Alex Morgan',
    email: 'alex@navigen.com',
    role: 'Administrator',
    roleType: 'admin',
    region: 'HQ - Global',
    status: 'Active',
  },
]

describe('Double Visit — Regional Manager Participant Selection', () => {
  beforeEach(() => {
    // Reset stores
    usersStore.set(JSON.parse(JSON.stringify(TEST_USERS)))
    jointVisitInvitationsStore.set([])
    notificationsStore.set([])
  })

  test('1. Same-region representatives appear in participant options', () => {
    const participants = getEligibleDoubleVisitParticipants(
      { name: 'Ahmed Samir', role: 'rep', region: 'North region', businessUnit: 'Cardio-Metabolic' },
      TEST_USERS
    )

    const olivia = participants.find((p) => p.name === 'Olivia Martin')
    assert.ok(olivia, 'Same-region representative (Olivia Martin) must appear in eligible participants')
    assert.strictEqual(olivia.roleType, 'rep')
    assert.strictEqual(olivia.region, 'North region')
    assert.ok(olivia.displayLabel.includes('Olivia Martin'))
    assert.ok(olivia.displayLabel.includes('Medical Representative'))
    assert.ok(olivia.displayLabel.includes('North region'))
  })

  test('2. The responsible First Line Manager appears in participant options', () => {
    const participants = getEligibleDoubleVisitParticipants(
      { name: 'Ahmed Samir', role: 'rep', region: 'North region', businessUnit: 'Cardio-Metabolic' },
      TEST_USERS
    )

    const mona = participants.find((p) => p.name === 'Mona Mansour')
    assert.ok(mona, 'Responsible First Line Manager (Mona Mansour) must appear in eligible participants')
    assert.strictEqual(mona.roleType, 'first_line_manager')
    assert.strictEqual(mona.region, 'North region')
    assert.ok(mona.displayLabel.includes('Mona Mansour'))
    assert.ok(mona.displayLabel.includes('First Line Manager'))
  })

  test('3. Eligible Business Unit Managers appear when assigned region or BU matches', () => {
    const participants = getEligibleDoubleVisitParticipants(
      { name: 'Ahmed Samir', role: 'rep', region: 'North region', businessUnit: 'Cardio-Metabolic' },
      TEST_USERS
    )

    // A. Regional BUM in same region
    const khaled = participants.find((p) => p.name === 'Dr. Khaled Fawzy')
    assert.ok(khaled, 'Same-region Business Unit Manager (Dr. Khaled Fawzy) must appear')
    assert.strictEqual(khaled.roleType, 'business_unit_manager')

    // B. Global BUM matching the rep’s Business Unit
    const hazem = participants.find((p) => p.name === 'Dr. Hazem Global BUM')
    assert.ok(hazem, 'Global BUM matching BU (Dr. Hazem Global BUM) must appear')
    assert.strictEqual(hazem.roleType, 'business_unit_manager')
  })

  test('4. Other-region users do NOT appear in participant options', () => {
    const participants = getEligibleDoubleVisitParticipants(
      { name: 'Ahmed Samir', role: 'rep', region: 'North region', businessUnit: 'Cardio-Metabolic' },
      TEST_USERS
    )

    // West region rep
    const sara = participants.find((p) => p.name === 'Sara Ali')
    assert.strictEqual(sara, undefined, 'Other-region representative (Sara Ali) must NOT appear')

    // West region FLM
    const hossam = participants.find((p) => p.name === 'Hossam West FLM')
    assert.strictEqual(hossam, undefined, 'Other-region First Line Manager (Hossam West FLM) must NOT appear')

    // West region BUM
    const yasser = participants.find((p) => p.name === 'Dr. Yasser West BUM')
    assert.strictEqual(yasser, undefined, 'Other-region Business Unit Manager (Dr. Yasser West BUM) must NOT appear')
  })

  test('5. Self-invitation is strictly blocked', () => {
    const participants = getEligibleDoubleVisitParticipants(
      { id: 'u-rep-ahmed', name: 'Ahmed Samir', role: 'rep', region: 'North region' },
      TEST_USERS
    )

    const self = participants.find((p) => p.name === 'Ahmed Samir' || p.id === 'u-rep-ahmed')
    assert.strictEqual(self, undefined, 'Logged-in representative must NOT appear in their own participant list')
  })

  test('6. Inactive, suspended, and unapproved accounts are excluded', () => {
    const participants = getEligibleDoubleVisitParticipants(
      { name: 'Ahmed Samir', role: 'rep', region: 'North region', businessUnit: 'Cardio-Metabolic' },
      TEST_USERS
    )

    const pendingUser = participants.find((p) => p.name === 'Hany Pending Rep')
    assert.strictEqual(pendingUser, undefined, 'Pending/unapproved user must NOT appear')

    const inactiveUser = participants.find((p) => p.name === 'Sameh Inactive FLM')
    assert.strictEqual(inactiveUser, undefined, 'Inactive manager must NOT appear')
  })

  test('7. Not restricted to direct reports: Other FLMs in the same region appear', () => {
    const participants = getEligibleDoubleVisitParticipants(
      { name: 'Ahmed Samir', role: 'rep', region: 'North region', businessUnit: 'Cardio-Metabolic' },
      TEST_USERS
    )

    // Tarek is an FLM in North region but manages a different team/BU
    const tarek = participants.find((p) => p.name === 'Tarek Regional FLM')
    assert.ok(tarek, 'FLM in the same region (Tarek Regional FLM) must appear even if not direct manager')
  })

  test('8. Managers can receive and Accept invitations', () => {
    // Rep Ahmed Samir invites FLM Mona Mansour to a Double Visit
    const visit = addVisit({
      clientName: 'Dr. Sarah Kim',
      clientId: 'c-test-1',
      repName: 'Ahmed Samir',
      repId: 'u-rep-ahmed',
      date: '2026-11-24',
      time: '11:00 AM',
      detail: 'Joint presentation on Bevato',
      status: 'Completed',
      productsPresented: ['Bevato'],
      samplesQuantity: 2,
      reactionEmoji: '👍',
      reactionLabel: 'Receptive',
      notes: 'Double Visit with FLM',
      nextVisitDate: '2026-12-08',
      gpsVerified: true,
      isDoubleVisit: true,
      jointRepId: 'u-flm-mona',
      jointRepName: 'Mona Mansour',
      jointVisitStatus: 'Pending',
    })

    const invitation = createJointVisitInvitation({
      visitId: visit.id,
      primaryRepId: 'u-rep-ahmed',
      primaryRepName: 'Ahmed Samir',
      invitedRepId: 'u-flm-mona',
      invitedRepName: 'Mona Mansour',
      clientName: 'Dr. Sarah Kim',
      date: visit.date,
      time: visit.time,
    })

    assert.strictEqual(invitation.status, 'Pending')

    // Manager Mona Mansour accepts the invitation
    respondToJointVisitInvitation(visit.id, 'Accepted', 'Mona Mansour')

    const updatedInv = jointVisitInvitationsStore.get().find((i) => i.id === invitation.id)
    assert.strictEqual(updatedInv?.status, 'Accepted')

    const updatedVisit = visitsStore.get().find((v) => v.id === visit.id)
    assert.strictEqual(updatedVisit?.jointVisitStatus, 'Accepted')

    // In-app notification sent back to primary representative
    const notifs = notificationsStore.get()
    const acceptNotif = notifs.find((n) => n.title === 'Joint Visit Accepted')
    assert.ok(acceptNotif, 'Primary rep must be notified when manager accepts joint visit')
    assert.ok(acceptNotif.message.includes('Mona Mansour'))
  })

  test('9. Managers can receive and Reject invitations with a reason', () => {
    // Rep Ahmed Samir invites BUM Dr. Khaled Fawzy
    const visit = addVisit({
      clientName: 'Dr. Sarah Kim',
      clientId: 'c-test-1',
      repName: 'Ahmed Samir',
      repId: 'u-rep-ahmed',
      date: '2026-11-24',
      time: '02:00 PM',
      detail: 'Strategic KOL review',
      status: 'Completed',
      productsPresented: ['Bevato'],
      samplesQuantity: 0,
      reactionEmoji: '👍',
      reactionLabel: 'Receptive',
      notes: 'Double Visit with BUM',
      nextVisitDate: '2026-12-08',
      gpsVerified: true,
      isDoubleVisit: true,
      jointRepId: 'u-bum-khaled',
      jointRepName: 'Dr. Khaled Fawzy',
      jointVisitStatus: 'Pending',
    })

    createJointVisitInvitation({
      visitId: visit.id,
      primaryRepId: 'u-rep-ahmed',
      primaryRepName: 'Ahmed Samir',
      invitedRepId: 'u-bum-khaled',
      invitedRepName: 'Dr. Khaled Fawzy',
      clientName: 'Dr. Sarah Kim',
      date: visit.date,
      time: visit.time,
    })

    // BUM rejects with specific reason
    respondToJointVisitInvitation(
      visit.id,
      'Rejected',
      'Dr. Khaled Fawzy',
      'Executive Board Strategy Meeting'
    )

    const updatedVisit = visitsStore.get().find((v) => v.id === visit.id)
    assert.strictEqual(updatedVisit?.jointVisitStatus, 'Rejected')

    const updatedInv = jointVisitInvitationsStore.get().find((i) => i.visitId === visit.id)
    assert.strictEqual(updatedInv?.status, 'Rejected')
    assert.strictEqual(updatedInv?.rejectionReason, 'Executive Board Strategy Meeting')

    const notifs = notificationsStore.get()
    const rejectNotif = notifs.find((n) => n.title === 'Joint Visit Rejected')
    assert.ok(rejectNotif, 'Primary rep must be notified when manager rejects joint visit')
    assert.ok(rejectNotif.message.includes('Executive Board Strategy Meeting'))
  })

  test('10. Double Visit counts as ONE customer visit and primary rep remains visit owner', () => {
    const customerId = 'c-test-dv-owner'
    const testCustomer: Customer = {
      id: customerId,
      name: 'Dr. Single Count Target',
      type: 'doctor',
      specialty: 'Cardiology',
      classification: 'Class A',
      status: 'Active',
      active: true,
      region: 'North region',
      repName: 'Ahmed Samir',
      rep_id: 'u-rep-ahmed',
      meta: 'Target verification',
    }

    customersStore.update((list) => [testCustomer, ...list.filter((c) => c.id !== customerId)])

    // Initial visit count
    const initialStats = getCustomerVisitStats(customerId)
    const initialCompleted = initialStats?.completedVisits || 0

    // Record completed Double Visit
    const visit = addVisit({
      clientName: 'Dr. Single Count Target',
      clientId: customerId,
      doctorId: customerId,
      repName: 'Ahmed Samir',
      repId: 'u-rep-ahmed',
      date: '2026-11-24',
      time: '03:00 PM',
      detail: 'Joint presentation',
      status: 'Completed',
      productsPresented: ['Bevato'],
      samplesQuantity: 1,
      reactionEmoji: '👍',
      reactionLabel: 'Receptive',
      notes: 'Joint visit with manager',
      nextVisitDate: '2026-12-08',
      gpsVerified: true,
      isDoubleVisit: true,
      jointRepId: 'u-flm-mona',
      jointRepName: 'Mona Mansour',
      jointVisitStatus: 'Accepted',
    })

    // Verify visit owner
    assert.strictEqual(visit.repName, 'Ahmed Samir', 'Primary representative must remain visit owner')
    assert.strictEqual(visit.repId, 'u-rep-ahmed', 'Primary repId must remain visit owner')
    assert.strictEqual(visit.jointRepName, 'Mona Mansour')

    // Verify customer completed visit count increased by exactly 1
    const finalStats = getCustomerVisitStats(customerId)
    assert.strictEqual(
      finalStats?.completedVisits,
      initialCompleted + 1,
      'Double Visit must count as exactly ONE customer visit, not two'
    )
  })
})
