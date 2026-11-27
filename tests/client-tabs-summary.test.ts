/**
 * client-tabs-summary.test.ts
 *
 * Verification suite for HCPs & HCOs Page:
 * 1. Dynamic Tab Counts (All Clients = HCPs + HCOs)
 * 2. Automatic updates on customer addition, edition, deletion, and filtering
 * 3. Role-based scoping of counts (Medical Rep vs Manager vs Admin)
 * 4. Summary Cards & Category / Status Breakdowns
 */

import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'

import {
  customersStore,
  addCustomer,
  updateCustomer,
  type Customer,
} from '../src/data/mock/customers'

import { filterCustomersByScope } from '../src/data/mock/dataScope'
import type { StoredAdminUser } from '../src/data/mock/users'

// ── Helpers matching clients/index.tsx ──────────────────────────────────────
const isHcoClient = (client: Customer): boolean =>
  client.clientCategory ? client.clientCategory === 'hco' : client.type === 'pharmacy'

const isHcpClient = (client: Customer): boolean => !isHcoClient(client)

function computeClientCounts(clients: Customer[]) {
  const hcpCount = clients.filter(isHcpClient).length
  const hcoCount = clients.filter(isHcoClient).length
  const allCount = hcpCount + hcoCount

  let activeCount = 0
  let classACount = 0
  let classBCount = 0
  let doctorCount = 0
  let pharmacistCount = 0
  let hospitalCount = 0
  let pharmacyCount = 0

  clients.forEach((c) => {
    const isHco = isHcoClient(c)
    if (isHco) {
      if (c.hcoType === 'hospital') hospitalCount++
      else if (c.hcoType === 'pharmacy' || c.type === 'pharmacy') pharmacyCount++
    } else {
      if (c.hcpType === 'pharmacist') pharmacistCount++
      else doctorCount++
    }

    const isActive = c.active !== false && c.status?.toLowerCase() !== 'inactive'
    if (isActive) activeCount++

    if (c.classification === 'Class A') classACount++
    else if (c.classification === 'Class B') classBCount++
  })

  const activePct = allCount > 0 ? Math.round((activeCount / allCount) * 100) : 0
  const inactiveCount = allCount - activeCount

  return {
    allCount,
    hcpCount,
    hcoCount,
    activeCount,
    inactiveCount,
    activePct,
    classACount,
    classBCount,
    doctorCount,
    pharmacistCount,
    hospitalCount,
    pharmacyCount,
  }
}

// ── Mock Test Hierarchy ──────────────────────────────────────────────────────
const MOCK_USERS: StoredAdminUser[] = [
  {
    id: 'u-admin-1',
    name: 'Alex Morgan',
    email: 'alex@navigen.com',
    role: 'Administrator',
    roleType: 'admin',
    region: 'Cairo',
    status: 'active',
  },
  {
    id: 'u-flm-1',
    name: 'Mona Mansour',
    email: 'mona@navigen.com',
    role: 'First Line Manager',
    roleType: 'first_line_manager',
    region: 'Cairo',
    managerId: 'u-bum-1',
    businessUnit: 'Cardio-Metabolic',
    status: 'active',
  },
  {
    id: 'u-rep-1',
    name: 'Ahmed Samir',
    email: 'ahmed@navigen.com',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'Cairo',
    managerId: 'u-admin-1',
    businessUnit: 'Cardio-Metabolic',
    status: 'active',
  },
  {
    id: 'u-rep-2',
    name: 'Sara Ali',
    email: 'sara@navigen.com',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'Cairo',
    managerId: 'u-flm-1',
    businessUnit: 'Cardio-Metabolic',
    status: 'active',
  },
  {
    id: 'u-rep-olivia',
    name: 'Olivia Martin',
    email: 'olivia@navigen.com',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'Cairo',
    managerId: 'u-flm-1',
    businessUnit: 'Cardio-Metabolic',
    status: 'active',
  },
]

describe('HCPs & HCOs — Dynamic Tab Counts & Summary Cards', () => {
  const initialCustomers: Customer[] = [
    {
      id: 'c-test-1',
      name: 'Dr. Sarah Kim',
      type: 'doctor',
      specialty: 'Cardiology',
      classification: 'Class A',
      status: 'Active',
      active: true,
      region: 'Cairo',
      repName: 'Ahmed Samir',
      rep_id: 'u-rep-1',
      clientCategory: 'hcp',
      hcpType: 'doctor',
      meta: 'Cardiology Specialist',
    },
    {
      id: 'c-test-2',
      name: 'Green Cross Pharmacy',
      type: 'pharmacy',
      specialty: 'Pharmacy',
      classification: 'Class A',
      status: 'Active',
      active: true,
      region: 'Cairo',
      repName: 'Ahmed Samir',
      rep_id: 'u-rep-1',
      clientCategory: 'hco',
      hcoType: 'pharmacy',
      meta: 'Pharmacy Partner',
    },
    {
      id: 'c-test-3',
      name: 'Dr. Marcus Lee',
      type: 'doctor',
      specialty: 'Cardiology',
      classification: 'Class B',
      status: 'Overdue',
      active: true,
      region: 'Cairo',
      repName: 'Sara Ali',
      rep_id: 'u-rep-2',
      clientCategory: 'hcp',
      hcpType: 'doctor',
      meta: 'Cardiology Clinic',
    },
    {
      id: 'c-test-4',
      name: 'Nile Hospital',
      type: 'doctor',
      specialty: 'General Medicine',
      classification: 'Class A',
      status: 'Active',
      active: true,
      region: 'Cairo',
      repName: 'Sara Ali',
      rep_id: 'u-rep-2',
      clientCategory: 'hco',
      hcoType: 'hospital',
      meta: 'Tertiary Hospital',
    },
    {
      id: 'c-test-5',
      name: 'Pharm. Tarek Youssef',
      type: 'pharmacy',
      specialty: 'Pharmacy',
      classification: 'Class A',
      status: 'Active',
      active: true,
      region: 'Cairo',
      repName: 'Olivia Martin',
      rep_id: 'u-rep-olivia',
      clientCategory: 'hcp',
      hcpType: 'pharmacist',
      meta: 'Lead Pharmacist',
    },
    {
      id: 'c-test-6',
      name: 'Dr. Youssef Nabil',
      type: 'doctor',
      specialty: 'General Medicine',
      classification: 'Class B',
      status: 'Inactive',
      active: false,
      region: 'Cairo',
      repName: 'Olivia Martin',
      rep_id: 'u-rep-olivia',
      clientCategory: 'hcp',
      hcpType: 'other',
      meta: 'Sabbatical',
    },
  ]

  beforeEach(() => {
    // Reset customersStore to test set
    customersStore.set(JSON.parse(JSON.stringify(initialCustomers)))
  })

  test('1. Dynamic Tab Counts: All Clients strictly equals HCP count + HCO count', () => {
    const activeClients = customersStore.get().filter((c) => !c.deleted_at)
    const counts = computeClientCounts(activeClients)

    // In initial set: 4 HCPs (Sarah Kim, Marcus Lee, Tarek Youssef, Youssef Nabil)
    // 2 HCOs (Green Cross Pharmacy, Nile Hospital)
    assert.strictEqual(counts.hcpCount, 4)
    assert.strictEqual(counts.hcoCount, 2)
    assert.strictEqual(counts.allCount, 6)
    assert.strictEqual(counts.allCount, counts.hcpCount + counts.hcoCount)
  })

  test('2. Dynamic updates: Adding an HCP increments HCP and All Clients, leaving HCO intact', () => {
    const before = computeClientCounts(customersStore.get().filter((c) => !c.deleted_at))

    addCustomer({
      name: 'Dr. New Doctor',
      type: 'doctor',
      specialty: 'Pediatrics',
      classification: 'Class A',
      status: 'Active',
      active: true,
      region: 'Cairo',
      repName: 'Ahmed Samir',
      clientCategory: 'hcp',
      hcpType: 'doctor',
      meta: 'New Pediatrician',
    })

    const after = computeClientCounts(customersStore.get().filter((c) => !c.deleted_at))
    assert.strictEqual(after.hcpCount, before.hcpCount + 1)
    assert.strictEqual(after.allCount, before.allCount + 1)
    assert.strictEqual(after.hcoCount, before.hcoCount)
    assert.strictEqual(after.allCount, after.hcpCount + after.hcoCount)
  })

  test('3. Dynamic updates: Adding an HCO increments HCO and All Clients, leaving HCP intact', () => {
    const before = computeClientCounts(customersStore.get().filter((c) => !c.deleted_at))

    addCustomer({
      name: 'Al Salam Polyclinic',
      type: 'doctor',
      specialty: 'General Medicine',
      classification: 'Class B',
      status: 'Active',
      active: true,
      region: 'Cairo',
      repName: 'Ahmed Samir',
      clientCategory: 'hco',
      hcoType: 'clinic',
      meta: 'Specialized Medical Center',
    })

    const after = computeClientCounts(customersStore.get().filter((c) => !c.deleted_at))
    assert.strictEqual(after.hcoCount, before.hcoCount + 1)
    assert.strictEqual(after.allCount, before.allCount + 1)
    assert.strictEqual(after.hcpCount, before.hcpCount)
    assert.strictEqual(after.allCount, after.hcpCount + after.hcoCount)
  })

  test('4. Dynamic updates: Soft-deleting a customer decrements counts immediately', () => {
    const before = computeClientCounts(customersStore.get().filter((c) => !c.deleted_at))

    // Soft delete c-test-1 (Dr. Sarah Kim - HCP)
    updateCustomer('c-test-1', { deleted_at: new Date().toISOString() })

    const after = computeClientCounts(customersStore.get().filter((c) => !c.deleted_at))
    assert.strictEqual(after.hcpCount, before.hcpCount - 1)
    assert.strictEqual(after.allCount, before.allCount - 1)
    assert.strictEqual(after.hcoCount, before.hcoCount)
    assert.strictEqual(after.allCount, after.hcpCount + after.hcoCount)
  })

  test('5. Summary Cards: Active Clients correctly identifies active vs inactive records', () => {
    const activeClients = customersStore.get().filter((c) => !c.deleted_at)
    const counts = computeClientCounts(activeClients)

    // c-test-6 is inactive (active: false, status: Inactive)
    // 5 active clients, 1 inactive client
    assert.strictEqual(counts.activeCount, 5)
    assert.strictEqual(counts.inactiveCount, 1)
    assert.strictEqual(counts.allCount, 6)
    assert.strictEqual(counts.activePct, Math.round((5 / 6) * 100)) // 83%
  })

  test('6. Summary Cards: Subcategory breakdowns (Doctors, Pharmacists, Hospitals, Pharmacies)', () => {
    const activeClients = customersStore.get().filter((c) => !c.deleted_at)
    const counts = computeClientCounts(activeClients)

    // HCP breakdown: 3 doctors + 1 pharmacist (Tarek Youssef)
    assert.strictEqual(counts.doctorCount, 3)
    assert.strictEqual(counts.pharmacistCount, 1)
    assert.strictEqual(counts.doctorCount + counts.pharmacistCount, 4)

    // HCO breakdown: 1 hospital (Nile Hospital) + 1 pharmacy (Green Cross)
    assert.strictEqual(counts.hospitalCount, 1)
    assert.strictEqual(counts.pharmacyCount, 1)
    assert.strictEqual(counts.hospitalCount + counts.pharmacyCount, 2)
  })

  test('7. Role Scoping: Medical Rep sees counts derived ONLY from their assigned records', () => {
    const activeClients = customersStore.get().filter((c) => !c.deleted_at)
    const repUser = { id: 'u-rep-1', name: 'Ahmed Samir', role: 'rep' }

    const repScoped = filterCustomersByScope(activeClients, repUser, MOCK_USERS)
    const repCounts = computeClientCounts(repScoped)

    // Ahmed Samir has c-test-1 (HCP) and c-test-2 (HCO)
    assert.strictEqual(repCounts.allCount, 2)
    assert.strictEqual(repCounts.hcpCount, 1)
    assert.strictEqual(repCounts.hcoCount, 1)
    assert.strictEqual(repCounts.activeCount, 2)
    assert.strictEqual(repCounts.allCount, repCounts.hcpCount + repCounts.hcoCount)
  })

  test('8. Role Scoping: First Line Manager sees aggregated counts for all direct reports', () => {
    const activeClients = customersStore.get().filter((c) => !c.deleted_at)
    const flmUser = { id: 'u-flm-1', name: 'Mona Mansour', role: 'first_line_manager' }

    const flmScoped = filterCustomersByScope(activeClients, flmUser, MOCK_USERS)
    const flmCounts = computeClientCounts(flmScoped)

    // Mona manages Sara Ali (c-test-3, c-test-4) and Olivia Martin (c-test-5, c-test-6)
    // 4 clients total: 3 HCPs + 1 HCO
    assert.strictEqual(flmCounts.allCount, 4)
    const clientIds = flmScoped.map((c) => c.id)
    assert.ok(clientIds.includes('c-test-3'))
    assert.ok(clientIds.includes('c-test-4'))
    assert.ok(clientIds.includes('c-test-5'))
    assert.ok(clientIds.includes('c-test-6'))
    assert.strictEqual(clientIds.includes('c-test-1'), false) // Ahmed Samir's client
    assert.strictEqual(flmCounts.hcpCount, 3)
    assert.strictEqual(flmCounts.hcoCount, 1)
    assert.strictEqual(flmCounts.allCount, flmCounts.hcpCount + flmCounts.hcoCount)
  })

  test('9. Role Scoping: Administrator sees company-wide totals across all reps', () => {
    const activeClients = customersStore.get().filter((c) => !c.deleted_at)
    const adminUser = { id: 'u-admin-1', name: 'Alex Morgan', role: 'admin' }

    const adminScoped = filterCustomersByScope(activeClients, adminUser, MOCK_USERS)
    const adminCounts = computeClientCounts(adminScoped)

    assert.strictEqual(adminCounts.allCount, 6)
    assert.strictEqual(adminCounts.hcpCount, 4)
    assert.strictEqual(adminCounts.hcoCount, 2)
    assert.strictEqual(adminCounts.allCount, adminCounts.hcpCount + adminCounts.hcoCount)
  })

  test('10. Filtered State: Tab counts accurately reflect secondary filter criteria', () => {
    const activeClients = customersStore.get().filter((c) => !c.deleted_at)

    // Filter by Class A
    const classAClients = activeClients.filter((c) => c.classification === 'Class A')
    const classACounts = computeClientCounts(classAClients)

    // In Class A: Sarah Kim (HCP), Green Cross (HCO), Nile Hospital (HCO), Tarek Youssef (HCP)
    // 2 HCPs + 2 HCOs = 4 total
    assert.strictEqual(classACounts.hcpCount, 2)
    assert.strictEqual(classACounts.hcoCount, 2)
    assert.strictEqual(classACounts.allCount, 4)
    assert.strictEqual(classACounts.allCount, classACounts.hcpCount + classACounts.hcoCount)
  })
})
