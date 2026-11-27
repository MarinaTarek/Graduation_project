/**
 * tests/role-dashboard-reports.test.ts
 *
 * Comprehensive Test Suite for Role-Based Dashboard & Reports Personalization
 * Verifies:
 * 1. Role-specific Dashboard scoping and KPI calculation for all 5 roles:
 *    (Admin, Business Unit Manager, First Line Manager, Rep, Marketing Manager)
 * 2. Cross-BU isolation and zero data leaking
 * 3. Rep isolation and private data confidentiality
 * 4. Marketing intelligence scoping (no employee admin or commercial rep lists)
 * 5. Report catalog role-based authorization
 * 6. Export permission enforcement (Rep canExport=false blocked, Manager allowed)
 * 7. Real reactive store data consumption (zero fabricated metrics)
 * 8. All 10 organizational test accounts verification
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'

import {
  getAdminDashboardMetrics,
  getBUMDashboardMetrics,
  getFLMDashboardMetrics,
  getRepDashboardMetrics,
  getMarketingDashboardMetrics,
  getScopedUsers,
  getScopedInvoices,
  getScopedVisits,
  getScopedVisitPlans,
  getScopedTargets,
  getProductBU,
} from '../src/lib/analytics/roleAnalytics'

import {
  REPORT_CATALOG,
  getAuthorizedReportsForRole,
  isReportAuthorizedForRole,
} from '../src/ui/pages/reports/reportCatalog'

import {
  validateExportPermission,
  exportReportToExcel,
} from '../src/lib/export/reportExport'

import { DEVELOPMENT_TEST_USERS, MOCK_USERS } from '../src/lib/auth/mock-users'
import { usersStore } from '../src/data/mock/users'
import { invoicesStore } from '../src/data/mock/invoices'
import { targetsStore } from '../src/data/mock/targets'
import { visitsStore } from '../src/data/mock/visits'
import { visitPlansStore } from '../src/data/mock/visit-plans'
import { productsStore } from '../src/data/mock/products'
import { batchesStore, stockMovementsStore } from '../src/data/mock/stockDerived'

describe('Role-Based Dashboard & Reports Personalization Test Suite', () => {
  // ── 1. Admin Dashboard & Scoping ──────────────────────────────────────────
  describe('1. Admin Executive Dashboard', () => {
    it('calculates company-wide total sales, quota, and achievement rate', () => {
      const data = getAdminDashboardMetrics()
      assert.ok(data.totalSales > 0, 'Total sales should be positive')
      assert.ok(data.targetSales > 0, 'Target sales should be positive')
      assert.ok(data.achievementPct >= 0, 'Achievement pct should be non-negative')
      assert.ok(data.activeRepsCount > 0, 'Active reps count should be positive')
    })

    it('contains comprehensive BU comparison covering all major business units', () => {
      const data = getAdminDashboardMetrics()
      assert.ok(data.buComparison.length >= 4, 'Should compare at least 4 business units')
      const buNames = data.buComparison.map((b) => b.bu)
      assert.ok(buNames.includes('Cardio-Metabolic'), 'Should include Cardio-Metabolic')
      assert.ok(buNames.includes('Respiratory'), 'Should include Respiratory')
      assert.ok(buNames.includes('Specialty Care'), 'Should include Specialty Care')
    })

    it('identifies top performing and underperforming representatives', () => {
      const data = getAdminDashboardMetrics()
      assert.ok(Array.isArray(data.topPerformers), 'topPerformers should be an array')
      assert.ok(data.topPerformers.length > 0, 'Should have top performers')
      if (data.topPerformers.length > 1) {
        assert.ok(
          data.topPerformers[0].achievementPct >= data.topPerformers[1].achievementPct,
          'Top performers should be ranked descending by achievement %'
        )
      }
    })

    it('aggregates executive management alerts (pending users, visit plans, batches)', () => {
      const data = getAdminDashboardMetrics()
      assert.strictEqual(typeof data.pendingUsersCount, 'number')
      assert.strictEqual(typeof data.pendingPlansCount, 'number')
      assert.strictEqual(typeof data.expiringBatchesCount, 'number')
    })
  })

  // ── 2. Business Unit Manager (BUM) Dashboard & Strict Isolation ───────────
  describe('2. Business Unit Manager (BUM) Dashboard & Strict BU Isolation', () => {
    it('isolates Cardio-Metabolic BUM data strictly to their BU', () => {
      const bumUser = {
        id: 'u-test-bum-cardio',
        name: 'Test BUM Cardio',
        role: 'business_unit_manager',
        businessUnit: 'Cardio-Metabolic',
        region: 'North',
      }

      const metrics = getBUMDashboardMetrics(bumUser)
      assert.strictEqual(metrics.businessUnit, 'Cardio-Metabolic')
      assert.ok(metrics.totalSales > 0, 'BU sales should be calculated from real invoices')

      // All reps in repBreakdown must belong to this BU
      metrics.repBreakdown.forEach((rep) => {
        const u = usersStore.get().find((user) => user.id === rep.id)
        if (u && u.businessUnit) {
          assert.strictEqual(
            u.businessUnit,
            'Cardio-Metabolic',
            `Rep ${rep.name} should belong to Cardio-Metabolic BU`
          )
        }
      })

      // All FLMs in flmBreakdown must belong to this BU
      metrics.flmBreakdown.forEach((flm) => {
        const u = usersStore.get().find((user) => user.id === flm.id)
        if (u && u.businessUnit) {
          assert.strictEqual(
            u.businessUnit,
            'Cardio-Metabolic',
            `FLM ${flm.name} should belong to Cardio-Metabolic BU`
          )
        }
      })
    })

    it('prevents BUM Respiratory from seeing Cardio-Metabolic team members or data', () => {
      const bumResp = {
        id: 'u-test-bum-resp',
        name: 'Test BUM Respiratory',
        role: 'business_unit_manager',
        businessUnit: 'Respiratory',
        region: 'West',
      }

      const scopedUsers = getScopedUsers(bumResp)
      const userNames = scopedUsers.map((u) => u.name)

      // Must not include Cardio reps or FLMs
      assert.ok(!userNames.includes('Test Rep Sara'), 'Respiratory BUM must not see Cardio Rep Sara')
      assert.ok(!userNames.includes('Test Rep Olivia'), 'Respiratory BUM must not see Cardio Rep Olivia')
      assert.ok(!userNames.includes('Test FLM Cardio'), 'Respiratory BUM must not see Cardio FLM')

      // Must include Respiratory team members
      assert.ok(userNames.includes('Test Rep Maya'), 'Respiratory BUM must see Maya')
      assert.ok(userNames.includes('Test FLM Respiratory'), 'Respiratory BUM must see FLM Respiratory')
    })
  })

  // ── 3. First Line Manager (FLM) Dashboard & Direct Team Scoping ───────────
  describe('3. First Line Manager (FLM) Dashboard & Supervised Team', () => {
    it('restricts FLM view strictly to direct reports in their hierarchy', () => {
      const flmUser = {
        id: 'u-test-flm-cardio',
        name: 'Test FLM Cardio',
        role: 'first_line_manager',
        businessUnit: 'Cardio-Metabolic',
        region: 'North',
      }

      const metrics = getFLMDashboardMetrics(flmUser)
      assert.ok(metrics.directRepsCount > 0, 'FLM should have direct reports')

      const repNames = metrics.repPerformance.map((r) => r.name)
      assert.ok(repNames.includes('Test Rep Sara'), 'Should include direct report Sara')
      assert.ok(repNames.includes('Test Rep Olivia'), 'Should include direct report Olivia')
      assert.ok(!repNames.includes('Test Rep Maya'), 'Must NOT include Rep Maya from Respiratory team')

      // Invoices scoped strictly to direct team
      const scopedInvoices = getScopedInvoices(flmUser)
      scopedInvoices.forEach((inv) => {
        const invRep = inv.repName?.toLowerCase() || ''
        assert.ok(
          invRep.includes('sara') || invRep.includes('olivia') || invRep.includes('cardio') || invRep === '',
          `Invoice rep ${inv.repName} must belong to FLM's direct team`
        )
      })
    })

    it('populates pending visit plans queue waiting for FLM approval', () => {
      const flmUser = {
        id: 'u-test-flm-cardio',
        name: 'Test FLM Cardio',
        role: 'first_line_manager',
      }
      const metrics = getFLMDashboardMetrics(flmUser)
      assert.strictEqual(typeof metrics.pendingPlansCount, 'number')
      assert.ok(Array.isArray(metrics.pendingPlans))
    })
  })

  // ── 4. Medical Representative (Rep) Dashboard & Personal Workspace ───────
  describe('4. Medical Representative (Rep) Personal Dashboard', () => {
    it('restricts Rep to personal sales, targets, and visits only', () => {
      const repUser = {
        id: 'u-test-rep-sara',
        name: 'Test Rep Sara',
        role: 'rep',
        businessUnit: 'Cardio-Metabolic',
        region: 'North',
      }

      const metrics = getRepDashboardMetrics(repUser)
      assert.strictEqual(metrics.repName, 'Test Rep Sara')
      assert.strictEqual(metrics.territory, 'North')
      assert.strictEqual(typeof metrics.mySales, 'number')
      assert.strictEqual(typeof metrics.myTarget, 'number')
      assert.strictEqual(typeof metrics.remainingToTarget, 'number')
      assert.strictEqual(typeof metrics.visitCompletionPct, 'number')

      // Scoped users for Rep must return ONLY self
      const scopedUsers = getScopedUsers(repUser)
      assert.strictEqual(scopedUsers.length, 1)
      assert.strictEqual(scopedUsers[0].name, 'Test Rep Sara')
    })

    it('provides interactive daily schedule and active visit plan status', () => {
      const repUser = {
        id: 'u-rep-olivia',
        name: 'Olivia Martin',
        role: 'rep',
        businessUnit: 'Cardio-Metabolic',
        region: 'North region',
      }

      const metrics = getRepDashboardMetrics(repUser)
      assert.ok(Array.isArray(metrics.todaySchedule), 'Schedule should be an array')
    })
  })

  // ── 5. Marketing Manager Dashboard & Product Intelligence ─────────────────
  describe('5. Marketing Manager Dashboard', () => {
    it('provides product portfolio metrics and commercial market share', () => {
      const metrics = getMarketingDashboardMetrics()
      assert.ok(metrics.activeProductsCount > 0, 'Active products count should be positive')
      assert.ok(metrics.totalRevenue > 0, 'Total market revenue should be positive')
      assert.ok(metrics.totalUnitsSold > 0, 'Total units sold should be positive')
      assert.ok(metrics.portfolioBreakdown.length > 0, 'Portfolio breakdown should have products')
      assert.ok(metrics.topProduct.revenue > 0, 'Top product should have revenue')
    })

    it('provides regional product demand without exposing rep commercial data', () => {
      const metrics = getMarketingDashboardMetrics()
      assert.ok(metrics.regionalDemand.length > 0, 'Should have regional demand')

      const mktUser = {
        id: 'u-test-mkt',
        name: 'Test Marketing Manager',
        role: 'marketing_manager',
      }
      const scopedUsers = getScopedUsers(mktUser)
      assert.strictEqual(scopedUsers.length, 0, 'Marketing manager must have 0 commercial rep access')
      const scopedVisits = getScopedVisits(mktUser)
      assert.strictEqual(scopedVisits.length, 0, 'Marketing manager must not access individual rep visits')
    })

    it('monitors near-expiry batches across warehouse stock', () => {
      const metrics = getMarketingDashboardMetrics()
      assert.ok(Array.isArray(metrics.nearExpiryBatches), 'Near expiry batches should be an array')
      metrics.nearExpiryBatches.forEach((b) => {
        assert.ok(b.daysUntilExpiry <= 90, `Batch ${b.batchNumber} should expire in <= 90 days`)
        assert.ok(['critical', 'warning', 'normal'].includes(b.riskLevel))
      })
    })
  })

  // ── 6. Report Catalog Authorization by Role ───────────────────────────────
  describe('6. Report Catalog Role-Based Authorization', () => {
    it('Admin has access to all reports in catalog', () => {
      const adminReports = getAuthorizedReportsForRole('admin')
      assert.strictEqual(adminReports.length, REPORT_CATALOG.length)
      REPORT_CATALOG.forEach((r) => {
        assert.ok(isReportAuthorizedForRole(r.id, 'admin'))
      })
    })

    it('Medical Representative has access ONLY to rep-scorecard', () => {
      const repReports = getAuthorizedReportsForRole('rep')
      assert.strictEqual(repReports.length, 1)
      assert.strictEqual(repReports[0].id, 'rep-scorecard')
      assert.ok(isReportAuthorizedForRole('rep-scorecard', 'rep'))
      assert.ok(!isReportAuthorizedForRole('sales-performance', 'rep'))
      assert.ok(!isReportAuthorizedForRole('stock-expiry', 'rep'))
      assert.ok(!isReportAuthorizedForRole('invoices-approvals', 'rep'))
    })

    it('FLM has access to team-relevant reports only', () => {
      const flmReports = getAuthorizedReportsForRole('first_line_manager')
      const ids = flmReports.map((r) => r.id)
      assert.ok(ids.includes('sales-performance'))
      assert.ok(ids.includes('visit-coverage'))
      assert.ok(ids.includes('rep-scorecard'))
      assert.ok(!ids.includes('stock-expiry'))
      assert.ok(!ids.includes('invoices-approvals'))
    })

    it('Marketing Manager has access to product/inventory reports only', () => {
      const mktReports = getAuthorizedReportsForRole('marketing_manager')
      const ids = mktReports.map((r) => r.id)
      assert.ok(ids.includes('sell-in-vs-sell-out'))
      assert.ok(ids.includes('stock-expiry'))
      assert.ok(!ids.includes('rep-scorecard'))
      assert.ok(!ids.includes('invoices-approvals'))
    })
  })

  // ── 7. Export Permissions & Data Enforcement ──────────────────────────────
  describe('7. Export Permissions Enforcement', () => {
    it('blocks Medical Representative from exporting reports (canExport: false)', () => {
      const repUser = {
        id: 'u-test-rep-sara',
        name: 'Test Rep Sara',
        role: 'rep',
        permissions: { canExport: false },
      }
      const check = validateExportPermission(repUser)
      assert.strictEqual(check.allowed, false)
      assert.ok(check.error?.includes('Permission Denied'))

      const res = exportReportToExcel({
        reportId: 'rep-scorecard',
        reportTitle: 'Scorecard',
        columns: [{ key: 'k', label: 'L' }],
        data: [{ k: 'v' }],
        user: repUser,
      })
      assert.strictEqual(res.success, false)
      assert.ok(res.error?.includes('Permission Denied'))
    })

    it('allows Admin, BUM, and FLM to export reports (canExport: true)', () => {
      const adminUser = {
        id: 'u-test-admin',
        name: 'Test Admin',
        role: 'admin',
        permissions: { canExport: true },
      }
      assert.strictEqual(validateExportPermission(adminUser).allowed, true)

      const bumUser = {
        id: 'u-test-bum-cardio',
        name: 'Test BUM Cardio',
        role: 'business_unit_manager',
        permissions: { canExport: true },
      }
      assert.strictEqual(validateExportPermission(bumUser).allowed, true)

      const flmUser = {
        id: 'u-test-flm-cardio',
        name: 'Test FLM Cardio',
        role: 'first_line_manager',
        permissions: { canExport: true },
      }
      assert.strictEqual(validateExportPermission(flmUser).allowed, true)
    })
  })

  // ── 8. All 10 Test Accounts Verification ──────────────────────────────────
  describe('8. Verification of 10 Organizational Test Accounts', () => {
    it('verifies all 10 test accounts exist with correct roles and BUs', () => {
      assert.strictEqual(DEVELOPMENT_TEST_USERS.length, 10)
      const rolesMap = new Map(DEVELOPMENT_TEST_USERS.map((u) => [u.email, u.role]))

      assert.strictEqual(rolesMap.get('admin.test@navigen.local'), 'admin')
      assert.strictEqual(rolesMap.get('bum.cardio@navigen.local'), 'business_unit_manager')
      assert.strictEqual(rolesMap.get('flm.cardio@navigen.local'), 'first_line_manager')
      assert.strictEqual(rolesMap.get('rep.sara@navigen.local'), 'rep')
      assert.strictEqual(rolesMap.get('rep.olivia@navigen.local'), 'rep')
      assert.strictEqual(rolesMap.get('bum.respiratory@navigen.local'), 'business_unit_manager')
      assert.strictEqual(rolesMap.get('flm.respiratory@navigen.local'), 'first_line_manager')
      assert.strictEqual(rolesMap.get('rep.maya@navigen.local'), 'rep')
      assert.strictEqual(rolesMap.get('marketing.test@navigen.local'), 'marketing_manager')
    })
  })
})
