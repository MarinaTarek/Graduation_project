/**
 * hierarchy-location-roles.test.ts
 *
 * Verification suite for Navigen CRM:
 * 1. Doctor Visit Location (First Visit Registration, 100m Geofencing, Multiple Clinics, Accuracy, Offline Queue & Sync)
 * 2. Management Roles & Hierarchy (5 Roles, Reporting Validation, Anti-Self-Management, Anti-Circular, Permission Sanitization)
 * 3. Hierarchical Data Visibility & Scoping (Rep, FLM, BUM, Marketing, Admin Scoping & Sell-out Performance Aggregations)
 */

import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'

import {
  doctorLocationsStore,
  registerDoctorClinicLocation,
  validateVisitGeofence,
  calculateHaversineDistanceMeters,
  locationConfigStore,
  offlineVisitsQueueStore,
  recordVisitLocally,
  syncOfflineVisits,
  getDoctorClinicLocations,
  type DoctorClinicLocation,
} from '../src/data/mock/locations'

import {
  getDefaultPermissions,
  sanitizeRolePermissions,
  ROLE_ALLOWED_PAGES,
} from '../src/lib/auth/permissions'

import {
  ROLE_LABELS,
  validateReportingHierarchy,
  getAuthorizedScope,
  filterCustomersByScope,
  filterVisitsByScope,
  filterVisitPlansByScope,
  filterWarehouseSellOutByScope,
  filterTargetsByScope,
  calculateTeamSellOutPerformance,
} from '../src/data/mock/dataScope'

import type { UserRole } from '../src/lib/auth/types'
import type { Customer } from '../src/data/mock/customers'
import type { StoredVisit } from '../src/data/mock/visits'
import type { VisitPlan } from '../src/data/mock/visit-plans'
import type { WarehouseSellOutReport } from '../src/data/mock/sell-out'
import type { SalesTarget } from '../src/data/mock/targets'
import type { StoredAdminUser } from '../src/data/mock/users'

// ── Mock Test Users Hierarchy ────────────────────────────────────────────────
const MOCK_USERS_HIERARCHY: StoredAdminUser[] = [
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
    id: 'u-bum-1',
    name: 'Dr. Khaled Fawzy',
    email: 'khaled@navigen.com',
    role: 'Business Unit Manager',
    roleType: 'business_unit_manager',
    region: 'Cairo',
    businessUnit: 'Cardio-Metabolic',
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
    id: 'u-mkt-1',
    name: 'Laila Mostafa',
    email: 'laila@navigen.com',
    role: 'Marketing Manager',
    roleType: 'marketing_manager',
    region: 'Cairo',
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
  {
    id: 'u-rep-maya',
    name: 'Maya Patel',
    email: 'maya@navigen.com',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'Cairo',
    managerId: 'u-admin-1',
    businessUnit: 'Respiratory',
    status: 'active',
  },
]

describe('Group 1: Doctor Visit Location & Offline Recording', () => {
  beforeEach(() => {
    // Reset locations store to seed
    doctorLocationsStore.set([])
    offlineVisitsQueueStore.set([])
  })

  test('1. First visit registers confirmed doctor clinic location', () => {
    const loc = registerDoctorClinicLocation({
      customerId: 'doc-t1',
      customerName: 'Dr. Tariq Zaki',
      clinicName: 'Zaki Specialty Center',
      latitude: 30.0444,
      longitude: 31.2357,
      accuracy: 12,
      confirmedBy: 'Ahmed Samir',
    })

    assert.ok(loc)
    assert.strictEqual(loc.clinicName, 'Zaki Specialty Center')
    assert.strictEqual(loc.customerId, 'doc-t1')
    assert.ok(loc.confirmedAt)

    const locations = getDoctorClinicLocations('doc-t1')
    assert.strictEqual(locations.length, 1)
    assert.strictEqual(locations[0].latitude, 30.0444)
    assert.strictEqual(locations[0].longitude, 31.2357)
  })

  test('2. Subsequent visit within 100m accepted (verified)', () => {
    // Register reference location (Downtown Cairo: 30.0444, 31.2357)
    registerDoctorClinicLocation({
      customerId: 'doc-t2',
      customerName: 'Dr. Mona Tarek',
      clinicName: 'Main Clinic',
      latitude: 30.0444,
      longitude: 31.2357,
      accuracy: 10,
      confirmedBy: 'Ahmed Samir',
    })

    // Rep coordinates ~40m away (lat + 0.0003, lon + 0.0003)
    const distance = calculateHaversineDistanceMeters(30.0444, 31.2357, 30.0447, 31.2360)
    assert.ok(distance < 100, `Distance should be < 100m, was ${distance}m`)

    const validation = validateVisitGeofence({
      customerId: 'doc-t2',
      latitude: 30.0447,
      longitude: 31.2360,
      accuracy: 15,
    })

    assert.strictEqual(validation.status, 'verified')
    assert.strictEqual(validation.isWithinGeofence, true)
    assert.ok(validation.distanceMeters !== undefined && validation.distanceMeters < 100)
  })

  test('3. Subsequent visit outside 100m rejected (out_of_range)', () => {
    registerDoctorClinicLocation({
      customerId: 'doc-t3',
      customerName: 'Dr. Hany Adel',
      clinicName: 'Adel Clinic',
      latitude: 30.0444,
      longitude: 31.2357,
      accuracy: 10,
      confirmedBy: 'Ahmed Samir',
    })

    // Rep coordinates ~1.8km away (30.0550, 31.2500)
    const validation = validateVisitGeofence({
      customerId: 'doc-t3',
      latitude: 30.055,
      longitude: 31.25,
      accuracy: 15,
    })

    assert.strictEqual(validation.status, 'out_of_range')
    assert.strictEqual(validation.isWithinGeofence, false)
    assert.ok(validation.distanceMeters !== undefined && validation.distanceMeters > 100)
    assert.ok(validation.messageEn.includes('100'))
  })

  test('4. Different doctors have independent reference locations', () => {
    // Doctor A in Cairo
    registerDoctorClinicLocation({
      customerId: 'doc-cairo',
      customerName: 'Dr. Cairo',
      clinicName: 'Cairo Heart Center',
      latitude: 30.0444,
      longitude: 31.2357,
      accuracy: 10,
      confirmedBy: 'Ahmed Samir',
    })

    // Doctor B in Alexandria
    registerDoctorClinicLocation({
      customerId: 'doc-alex',
      customerName: 'Dr. Alex',
      clinicName: 'Alexandria Clinic',
      latitude: 31.2001,
      longitude: 29.9187,
      accuracy: 10,
      confirmedBy: 'Ahmed Samir',
    })

    // Validation at Cairo coords for Doctor Alex must fail
    const alexVal = validateVisitGeofence({
      customerId: 'doc-alex',
      latitude: 30.0444,
      longitude: 31.2357,
      accuracy: 10,
    })
    assert.strictEqual(alexVal.status, 'out_of_range')

    // Validation at Cairo coords for Doctor Cairo must pass
    const cairoVal = validateVisitGeofence({
      customerId: 'doc-cairo',
      latitude: 30.0444,
      longitude: 31.2357,
      accuracy: 10,
    })
    assert.strictEqual(cairoVal.status, 'verified')
  })

  test('5. Multiple clinic locations supported for one doctor', () => {
    // Clinic 1: Heliopolis
    const c1 = registerDoctorClinicLocation({
      customerId: 'doc-multi',
      customerName: 'Dr. Sameh',
      clinicId: 'cl-helio',
      clinicName: 'Heliopolis Branch',
      latitude: 30.0888,
      longitude: 31.3211,
      accuracy: 10,
      confirmedBy: 'Ahmed Samir',
    })

    // Clinic 2: Maadi
    const c2 = registerDoctorClinicLocation({
      customerId: 'doc-multi',
      customerName: 'Dr. Sameh',
      clinicId: 'cl-maadi',
      clinicName: 'Maadi Branch',
      latitude: 29.9602,
      longitude: 31.2568,
      accuracy: 10,
      confirmedBy: 'Ahmed Samir',
    })

    const locations = getDoctorClinicLocations('doc-multi')
    assert.strictEqual(locations.length, 2)

    // Rep visiting Maadi branch specifically (30m away)
    const maadiVal = validateVisitGeofence({
      customerId: 'doc-multi',
      clinicId: 'cl-maadi',
      latitude: 29.9603,
      longitude: 31.2569,
      accuracy: 15,
    })
    assert.strictEqual(maadiVal.status, 'verified')
    assert.strictEqual(maadiVal.clinicLocation?.clinicName, 'Maadi Branch')
  })

  test('6. Existing reference locations not overwritten automatically', () => {
    registerDoctorClinicLocation({
      customerId: 'doc-protect',
      customerName: 'Dr. Protected',
      clinicName: 'Prime Clinic',
      latitude: 30.0444,
      longitude: 31.2357,
      accuracy: 10,
      confirmedBy: 'Ahmed Samir',
    })

    // Attempt to register again with same clinic without allowUpdate
    assert.throws(
      () =>
        registerDoctorClinicLocation({
          customerId: 'doc-protect',
          customerName: 'Dr. Protected',
          clinicName: 'Prime Clinic',
          latitude: 30.1,
          longitude: 31.4,
          accuracy: 10,
          confirmedBy: 'Ahmed Samir',
          allowUpdate: false,
        }),
      /already exists/
    )

    // Verify coordinates did not change
    const loc = getDoctorClinicLocations('doc-protect')[0]
    assert.strictEqual(loc.latitude, 30.0444)
  })

  test('7. Insufficient GPS accuracy (>50m) requires another reading (inaccurate_gps)', () => {
    registerDoctorClinicLocation({
      customerId: 'doc-gps',
      customerName: 'Dr. GPS Test',
      clinicName: 'Test Clinic',
      latitude: 30.0444,
      longitude: 31.2357,
      accuracy: 10,
      confirmedBy: 'Ahmed Samir',
    })

    // Accurate distance (0m), but GPS accuracy reading is 75m (>50m threshold)
    const val = validateVisitGeofence({
      customerId: 'doc-gps',
      latitude: 30.0444,
      longitude: 31.2357,
      accuracy: 75,
    })

    assert.strictEqual(val.status, 'inaccurate_gps')
    assert.strictEqual(val.isWithinGeofence, false)
    assert.ok(val.messageEn.includes('50m'))
  })

  test('8. Missing GPS coordinates does not silently bypass validation (unavailable)', () => {
    registerDoctorClinicLocation({
      customerId: 'doc-coords',
      customerName: 'Dr. Coordinates',
      clinicName: 'Coords Clinic',
      latitude: 30.0444,
      longitude: 31.2357,
      accuracy: 10,
      confirmedBy: 'Ahmed Samir',
    })

    const val = validateVisitGeofence({
      customerId: 'doc-coords',
      latitude: undefined,
      longitude: undefined,
    })

    assert.strictEqual(val.status, 'unavailable')
    assert.strictEqual(val.isWithinGeofence, false)
    assert.ok(val.messageEn.includes('Unable to detect'))
  })

  test('9. Offline visits saved locally as Pending Sync', () => {
    const offlineRecord = recordVisitLocally(
      {
        clientName: 'Dr. Offline',
        repName: 'Ahmed Samir',
        date: '2026-11-23',
        time: '10:00 AM',
        detail: 'Discussed portfolio',
        status: 'Completed',
        productsPresented: ['Bevato'],
        samplesQuantity: 2,
        reactionEmoji: '👍',
        reactionLabel: 'Positive',
        notes: 'Recorded in weak signal area',
        nextVisitDate: '2026-12-01',
        gpsVerified: false,
        clinicName: 'Offline Practice',
        locationStatus: 'Location Pending',
      },
      true // isOffline
    )

    assert.strictEqual(offlineRecord.syncStatus, 'Pending Sync')
    assert.strictEqual(offlineRecord.locationStatus, 'Location Pending')

    const queue = offlineVisitsQueueStore.get()
    assert.strictEqual(queue.length, 1)
    assert.strictEqual(queue[0].id, offlineRecord.id)
  })

  test('10. Repeated synchronization does not create duplicate visits', () => {
    const offlineRecord = recordVisitLocally(
      {
        clientName: 'Dr. Sync Test',
        repName: 'Ahmed Samir',
        date: '2026-11-23',
        time: '11:00 AM',
        detail: 'Successful meeting',
        status: 'Completed',
        productsPresented: ['Bevato'],
        samplesQuantity: 1,
        reactionEmoji: '👍',
        reactionLabel: 'Positive',
        notes: 'First offline entry',
        nextVisitDate: '2026-12-01',
        gpsVerified: true,
        clinicName: 'Sync Clinic',
        locationStatus: 'Location Verified',
      },
      true // isOffline
    )

    // First sync
    const firstSync = syncOfflineVisits()
    assert.strictEqual(firstSync.syncedCount, 1)
    assert.strictEqual(firstSync.syncedIds.length, 1)

    // Queue is cleared upon sync
    const queueAfterFirst = offlineVisitsQueueStore.get()
    assert.strictEqual(queueAfterFirst.length, 0)

    // Second sync: queue is empty, should NOT re-sync or create duplicate
    const secondSync = syncOfflineVisits()
    assert.strictEqual(secondSync.syncedCount, 0)
  })
})

describe('Group 2: Role Management & Hierarchy', () => {
  test('11. All 5 roles supported in ROLE_LABELS and ROLE_ALLOWED_PAGES', () => {
    const expectedRoles: UserRole[] = [
      'admin',
      'first_line_manager',
      'business_unit_manager',
      'marketing_manager',
      'rep',
    ]

    expectedRoles.forEach((role) => {
      assert.ok(ROLE_LABELS[role], `ROLE_LABELS must define label for ${role}`)
      assert.ok(ROLE_ALLOWED_PAGES[role], `ROLE_ALLOWED_PAGES must define pages for ${role}`)
    })
  })

  test('12. New roles appear with correct default permissions', () => {
    const flmPerms = getDefaultPermissions('first_line_manager')
    const bumPerms = getDefaultPermissions('business_unit_manager')
    const mktPerms = getDefaultPermissions('marketing_manager')

    // FLM permissions
    assert.strictEqual(flmPerms.pages.includes('Clients'), true)
    assert.strictEqual(flmPerms.pages.includes('Visits'), true)
    assert.strictEqual(flmPerms.pages.includes('Visit plan'), true)
    assert.strictEqual(flmPerms.pages.includes('Settings'), false)
    assert.strictEqual(flmPerms.canDeleteData, false)

    // BUM permissions
    assert.strictEqual(bumPerms.pages.includes('Performance Analytics'), true)
    assert.strictEqual(bumPerms.pages.includes('Territories'), true)
    assert.strictEqual(bumPerms.canApproveInvoices, false) // Consolidate to admin only per Task 3
    assert.strictEqual(bumPerms.pages.includes('Settings'), false)
    assert.strictEqual(bumPerms.canDeleteData, false)

    // Marketing Manager permissions
    assert.strictEqual(mktPerms.pages.includes('Performance Analytics'), true)
    assert.strictEqual(mktPerms.pages.includes('Products & Batches'), true)
    assert.strictEqual(mktPerms.pages.includes('Visits'), false)
    assert.strictEqual(mktPerms.pages.includes('Clients'), false)
    assert.strictEqual(mktPerms.pages.includes('Settings'), false)
  })

  test('13. Changing roles updates permissions and sanitizes unauthorized pages/actions', () => {
    // Start with admin permissions
    const adminPerms = getDefaultPermissions('admin')
    assert.strictEqual(adminPerms.pages.includes('Settings'), true)
    assert.strictEqual(adminPerms.canDeleteData, true)
    assert.strictEqual(adminPerms.canEditPrices, true)

    // Sanitize to rep role
    const sanitizedRep = sanitizeRolePermissions('rep', adminPerms)
    assert.strictEqual(sanitizedRep.pages.includes('Settings'), false)
    assert.strictEqual(sanitizedRep.canDeleteData, false)
    assert.strictEqual(sanitizedRep.canEditPrices, false)
    assert.strictEqual(sanitizedRep.pages.includes('Clients'), true)
    assert.strictEqual(sanitizedRep.pages.includes('Visits'), true)
  })

  test('14. Lower-privilege role does not retain unauthorized permissions from higher-privilege role', () => {
    // Start with admin permissions and downgrade to first_line_manager
    const adminPerms = getDefaultPermissions('admin')
    const sanitizedFLM = sanitizeRolePermissions('first_line_manager', adminPerms)

    // FLM does NOT retain admin settings or delete privileges
    assert.strictEqual(sanitizedFLM.pages.includes('Settings'), false)
    assert.strictEqual(sanitizedFLM.canDeleteData, false)
    assert.strictEqual(sanitizedFLM.canEditPrices, false)

    // Retains FLM capabilities
    assert.strictEqual(sanitizedFLM.pages.includes('Visit plan'), true)
    assert.strictEqual(sanitizedFLM.pages.includes('Sell-out'), true)
    assert.strictEqual(sanitizedFLM.canExport, true)
  })

  test('15. Self-management prevented by validateReportingHierarchy', () => {
    const result = validateReportingHierarchy('u-rep-1', 'u-rep-1', MOCK_USERS_HIERARCHY)
    assert.strictEqual(result.valid, false)
    assert.ok(result.error?.includes('own manager'))
  })

  test('16. Circular reporting relationship detected and prevented', () => {
    // Existing hierarchy:
    // u-flm-1 reports to u-bum-1
    // If u-bum-1 is set to report to u-flm-1, that forms a cycle (bum -> flm -> bum)
    const result = validateReportingHierarchy('u-bum-1', 'u-flm-1', MOCK_USERS_HIERARCHY)
    assert.strictEqual(result.valid, false)
    assert.ok(result.error?.includes('Circular reporting'))
  })
})

describe('Group 3: Hierarchical Data Visibility & Scoping', () => {
  const sampleCustomers: Customer[] = [
    {
      id: 'c-1',
      name: 'Dr. Tarek Cardiology',
      type: 'doctor',
      specialty: 'Cardiology',
      classification: 'Class A',
      meta: 'Cardiology Specialist',
      status: 'active',
      region: 'Cairo',
      rep_id: 'u-rep-1',
      repName: 'Ahmed Samir',
    },
    {
      id: 'c-2',
      name: 'Dr. Sara Clinic',
      type: 'doctor',
      specialty: 'Endocrinology',
      classification: 'Class B',
      meta: 'Endocrinology Specialist',
      status: 'active',
      region: 'Cairo',
      rep_id: 'u-rep-2',
      repName: 'Sara Ali',
    },
    {
      id: 'c-3',
      name: 'Dr. Olivia Practice',
      type: 'doctor',
      specialty: 'Cardiology',
      classification: 'Class A',
      meta: 'Cardiology Specialist',
      status: 'active',
      region: 'Cairo',
      rep_id: 'u-rep-olivia',
      repName: 'Olivia Martin',
    },
    {
      id: 'c-4',
      name: 'Dr. Maya Pulmonary',
      type: 'doctor',
      specialty: 'Pulmonology',
      classification: 'Class A',
      meta: 'Pulmonary Specialist',
      status: 'active',
      region: 'Giza',
      rep_id: 'u-rep-maya',
      repName: 'Maya Patel',
    },
  ]

  const sampleWarehouseSellOut: WarehouseSellOutReport[] = [
    {
      id: 'SO-01',
      warehouseId: 'WH-01',
      warehouseCode: 'CAI-01',
      warehouseName: 'Cairo Central',
      area: 'Nasr City',
      governorate: 'Cairo',
      repId: 'u-rep-1',
      repName: 'Ahmed Samir',
      reportingMonth: '2026-10',
      submissionDate: '2026-10-15',
      items: [{ productName: 'Bevato', quantity: 2000 }],
    },
    {
      id: 'SO-02',
      warehouseId: 'WH-01',
      warehouseCode: 'CAI-01',
      warehouseName: 'Cairo Central',
      area: 'Maadi',
      governorate: 'Cairo',
      repId: 'u-rep-2',
      repName: 'Sara Ali',
      reportingMonth: '2026-10',
      submissionDate: '2026-10-16',
      items: [{ productName: 'Bevato', quantity: 1500 }],
    },
    {
      id: 'SO-03',
      warehouseId: 'WH-02',
      warehouseCode: 'CAI-02',
      warehouseName: 'Heliopolis Depot',
      area: 'Heliopolis',
      governorate: 'Cairo',
      repId: 'u-rep-olivia',
      repName: 'Olivia Martin',
      reportingMonth: '2026-10',
      submissionDate: '2026-10-17',
      items: [{ productName: 'Bevato', quantity: 3000 }],
    },
    {
      id: 'SO-04',
      warehouseId: 'WH-03',
      warehouseCode: 'GIZ-01',
      warehouseName: 'Giza Depot',
      area: 'Mohandessin',
      governorate: 'Giza',
      repId: 'u-rep-maya',
      repName: 'Maya Patel',
      reportingMonth: '2026-10',
      submissionDate: '2026-10-18',
      items: [{ productName: 'RespiClear', quantity: 4000 }],
    },
  ]

  const sampleTargets: SalesTarget[] = [
    {
      id: 'tgt-1',
      name: 'Ahmed October Target',
      repId: 'u-rep-1',
      repName: 'Ahmed Samir',
      period: 'Monthly',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      targetValue: 60000, // 3000 units
      createdAt: '2026-10-01',
    },
    {
      id: 'tgt-2',
      name: 'Sara October Target',
      repId: 'u-rep-2',
      repName: 'Sara Ali',
      period: 'Monthly',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      targetValue: 40000, // 2000 units
      createdAt: '2026-10-01',
    },
    {
      id: 'tgt-3',
      name: 'Olivia October Target',
      repId: 'u-rep-olivia',
      repName: 'Olivia Martin',
      period: 'Monthly',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      targetValue: 80000, // 4000 units
      createdAt: '2026-10-01',
    },
  ]

  test('17. Medical Rep cannot access another reps customers', () => {
    const repUser = { id: 'u-rep-1', name: 'Ahmed Samir', role: 'rep' }
    const visibleCustomers = filterCustomersByScope(sampleCustomers, repUser, MOCK_USERS_HIERARCHY)

    assert.strictEqual(visibleCustomers.length, 1)
    assert.strictEqual(visibleCustomers[0].name, 'Dr. Tarek Cardiology')
    assert.strictEqual(visibleCustomers[0].rep_id, 'u-rep-1')
  })

  test('18. Medical Rep cannot access another reps Sell-out', () => {
    const repUser = { id: 'u-rep-1', name: 'Ahmed Samir', role: 'rep' }
    const visibleReports = filterWarehouseSellOutByScope(sampleWarehouseSellOut, repUser, MOCK_USERS_HIERARCHY)

    assert.strictEqual(visibleReports.length, 1)
    assert.strictEqual(visibleReports[0].repId, 'u-rep-1')
    assert.strictEqual(visibleReports[0].items[0].quantity, 2000)
  })

  test('19. First Line Manager accesses direct reports customers, visits, and sell-out', () => {
    // Mona Mansour manages Sara Ali (u-rep-2) and Olivia Martin (u-rep-olivia)
    const flmUser = { id: 'u-flm-1', name: 'Mona Mansour', role: 'first_line_manager' }

    const visibleCustomers = filterCustomersByScope(sampleCustomers, flmUser, MOCK_USERS_HIERARCHY)
    assert.strictEqual(visibleCustomers.length, 2)
    const customerReps = visibleCustomers.map((c) => c.rep_id)
    assert.ok(customerReps.includes('u-rep-2'))
    assert.ok(customerReps.includes('u-rep-olivia'))

    const visibleReports = filterWarehouseSellOutByScope(sampleWarehouseSellOut, flmUser, MOCK_USERS_HIERARCHY)
    assert.strictEqual(visibleReports.length, 2)
    const reportReps = visibleReports.map((r) => r.repId)
    assert.ok(reportReps.includes('u-rep-2'))
    assert.ok(reportReps.includes('u-rep-olivia'))
  })

  test('20. First Line Manager cannot access unrelated reps', () => {
    const flmUser = { id: 'u-flm-1', name: 'Mona Mansour', role: 'first_line_manager' }
    const visibleReports = filterWarehouseSellOutByScope(sampleWarehouseSellOut, flmUser, MOCK_USERS_HIERARCHY)

    // Ahmed Samir reports to Admin, Maya Patel is in another BU
    const repIds = visibleReports.map((r) => r.repId)
    assert.strictEqual(repIds.includes('u-rep-1'), false)
    assert.strictEqual(repIds.includes('u-rep-maya'), false)
  })

  test('21. Business Unit Manager accesses all reps in assigned Business Unit', () => {
    // Dr. Khaled Fawzy manages Cardio-Metabolic BU
    const bumUser = {
      id: 'u-bum-1',
      name: 'Dr. Khaled Fawzy',
      role: 'business_unit_manager',
      businessUnit: 'Cardio-Metabolic',
    }

    const visibleReports = filterWarehouseSellOutByScope(sampleWarehouseSellOut, bumUser, MOCK_USERS_HIERARCHY)
    // Cardio-Metabolic reps: Ahmed Samir (u-rep-1), Sara Ali (u-rep-2), Olivia Martin (u-rep-olivia)
    assert.strictEqual(visibleReports.length, 3)
    const repIds = visibleReports.map((r) => r.repId)
    assert.ok(repIds.includes('u-rep-1'))
    assert.ok(repIds.includes('u-rep-2'))
    assert.ok(repIds.includes('u-rep-olivia'))
  })

  test('22. Business Unit Manager cannot access unrelated Business Units', () => {
    const bumUser = {
      id: 'u-bum-1',
      name: 'Dr. Khaled Fawzy',
      role: 'business_unit_manager',
      businessUnit: 'Cardio-Metabolic',
    }

    const visibleReports = filterWarehouseSellOutByScope(sampleWarehouseSellOut, bumUser, MOCK_USERS_HIERARCHY)
    // Maya Patel is in 'Respiratory', must NOT be visible
    const hasRespiratoryRep = visibleReports.some((r) => r.repId === 'u-rep-maya')
    assert.strictEqual(hasRespiratoryRep, false)
  })

  test('23. Marketing Manager cannot access commercial rep records or customers', () => {
    const mktUser = {
      id: 'u-mkt-1',
      name: 'Laila Mostafa',
      role: 'marketing_manager',
      businessUnit: 'Cardio-Metabolic',
    }

    const visibleCustomers = filterCustomersByScope(sampleCustomers, mktUser, MOCK_USERS_HIERARCHY)
    assert.strictEqual(visibleCustomers.length, 0)

    const visibleReports = filterWarehouseSellOutByScope(sampleWarehouseSellOut, mktUser, MOCK_USERS_HIERARCHY)
    assert.strictEqual(visibleReports.length, 0)
  })

  test('24. Admin retains company-wide access across all entities', () => {
    const adminUser = { id: 'u-admin-1', name: 'Alex Morgan', role: 'admin' }

    const visibleCustomers = filterCustomersByScope(sampleCustomers, adminUser, MOCK_USERS_HIERARCHY)
    assert.strictEqual(visibleCustomers.length, sampleCustomers.length)

    const visibleReports = filterWarehouseSellOutByScope(sampleWarehouseSellOut, adminUser, MOCK_USERS_HIERARCHY)
    assert.strictEqual(visibleReports.length, sampleWarehouseSellOut.length)
  })

  test('25. Team Sell-out calculation computes correct individual and team totals for FLM', () => {
    const flmUser = { id: 'u-flm-1', name: 'Mona Mansour', role: 'first_line_manager' }

    const teamPerformance = calculateTeamSellOutPerformance(
      flmUser,
      sampleWarehouseSellOut,
      sampleTargets,
      MOCK_USERS_HIERARCHY
    )

    // Mona's reps are Sara (1500 units actual, 2000 target) and Olivia (3000 units actual, 4000 target)
    assert.strictEqual(teamPerformance.reps.length, 2)

    const saraPerf = teamPerformance.reps.find((r) => r.repId === 'u-rep-2')
    assert.ok(saraPerf)
    assert.strictEqual(saraPerf.actualUnits, 1500)
    assert.strictEqual(saraPerf.targetUnits, 2000)
    assert.strictEqual(saraPerf.achievementRate, 75)
    assert.strictEqual(saraPerf.remainingUnits, 500)

    const oliviaPerf = teamPerformance.reps.find((r) => r.repId === 'u-rep-olivia')
    assert.ok(oliviaPerf)
    assert.strictEqual(oliviaPerf.actualUnits, 3000)
    assert.strictEqual(oliviaPerf.targetUnits, 4000)
    assert.strictEqual(oliviaPerf.achievementRate, 75)

    // Team aggregated totals
    assert.strictEqual(teamPerformance.totalActual, 4500)
    assert.strictEqual(teamPerformance.totalTarget, 6000)
    assert.strictEqual(teamPerformance.totalAchievementRate, 75)
    assert.strictEqual(teamPerformance.totalRemaining, 1500)
  })

  test('26. Scope filtering applies consistently to visit plans and targets', () => {
    const samplePlans: VisitPlan[] = [
      {
        id: 'vp-1',
        name: 'Ahmed Plan',
        repId: 'u-rep-1',
        repName: 'Ahmed Samir',
        status: 'Active',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        frequency: 'Bi-weekly',
        targetClients: ['c-1'],
        plannedProducts: ['Bevato'],
        stops: [],
      },
      {
        id: 'vp-2',
        name: 'Sara Plan',
        repId: 'u-rep-2',
        repName: 'Sara Ali',
        status: 'Pending Approval',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        frequency: 'Monthly',
        targetClients: ['c-2'],
        plannedProducts: ['Bevato'],
        stops: [],
      },
    ]

    // Rep Ahmed Samir sees only his plan
    const repPlans = filterVisitPlansByScope(samplePlans, { id: 'u-rep-1', name: 'Ahmed Samir', role: 'rep' }, MOCK_USERS_HIERARCHY)
    assert.strictEqual(repPlans.length, 1)
    assert.strictEqual(repPlans[0].id, 'vp-1')

    // FLM Mona Mansour sees Sara's plan (direct report) but not Ahmed's plan
    const flmPlans = filterVisitPlansByScope(samplePlans, { id: 'u-flm-1', name: 'Mona Mansour', role: 'first_line_manager' }, MOCK_USERS_HIERARCHY)
    assert.strictEqual(flmPlans.length, 1)
    assert.strictEqual(flmPlans[0].id, 'vp-2')

    // Targets filtering for FLM
    const flmTargets = filterTargetsByScope(sampleTargets, { id: 'u-flm-1', name: 'Mona Mansour', role: 'first_line_manager' }, MOCK_USERS_HIERARCHY)
    // Mona manages Sara and Olivia
    assert.strictEqual(flmTargets.length, 2)
    const targetRepIds = flmTargets.map((t) => t.repId)
    assert.ok(targetRepIds.includes('u-rep-2'))
    assert.ok(targetRepIds.includes('u-rep-olivia'))
    assert.strictEqual(targetRepIds.includes('u-rep-1'), false)
  })
})
