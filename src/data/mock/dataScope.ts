import type { User, UserRole } from '@/lib/auth/types'
import { usersStore, type StoredAdminUser } from './users'
import type { Customer } from './customers'
import type { StoredVisit } from './visits'
import type { VisitPlan } from './visit-plans'
import { warehouseSellOutStore, type SellOutRecord, type WarehouseSellOutReport } from './sell-out'
import { targetsStore, type SalesTarget } from './targets'

// ── Role Labels & Constants ─────────────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  first_line_manager: 'First Line Manager',
  business_unit_manager: 'Business Unit Manager',
  marketing_manager: 'Marketing Manager',
  rep: 'Medical Representative',
}

export const ROLE_LABELS_AR: Record<UserRole, string> = {
  admin: 'مشرف النظام',
  first_line_manager: 'مدير الفريق الميداني',
  business_unit_manager: 'مدير وحدة الأعمال',
  marketing_manager: 'مدير التسويق',
  rep: 'مندوب دعاية طبية',
}

export const BUSINESS_UNITS = [
  'Cardio-Metabolic',
  'Respiratory',
  'Specialty Care',
  'Oncology',
  'General Medicine',
] as const

// ── Reporting Hierarchy Validation ──────────────────────────────────────────
/**
 * Validates a proposed reporting relationship:
 * 1. Prevents self-management (user cannot manage themselves).
 * 2. Prevents circular reporting chains (e.g. A -> B -> A).
 */
export function validateReportingHierarchy(
  userId: string,
  proposedManagerId?: string | null,
  usersList?: Array<{ id: string; managerId?: string }>
): { valid: boolean; error?: string } {
  if (!proposedManagerId) {
    return { valid: true } // Unassigned manager is valid
  }

  // 1. Self-management check
  if (userId === proposedManagerId) {
    return {
      valid: false,
      error: 'Invalid reporting relationship: A user cannot be assigned as their own manager.',
    }
  }

  const users = usersList || (usersStore.get() as Array<{ id: string; managerId?: string }>)
  const userMap = new Map(users.map((u) => [u.id, u.managerId]))

  // 2. Circular reporting check
  const visited = new Set<string>([userId])
  let current: string | undefined = proposedManagerId

  while (current) {
    if (visited.has(current)) {
      return {
        valid: false,
        error: `Circular reporting relationship detected: Assigning manager "${proposedManagerId}" creates an infinite reporting loop.`,
      }
    }
    visited.add(current)
    current = userMap.get(current)
  }

  return { valid: true }
}

// ── Data Scope Resolution ───────────────────────────────────────────────────
/**
 * Resolves the authorized representative IDs and names for a user based on their role:
 * - Admin: 'ALL'
 * - Business Unit Manager: Reps and FLMs within their assigned Business Unit
 * - First Line Manager: Explicitly assigned direct reports (managerId === user.id)
 * - Medical Representative: Their own ID / identity only
 * - Marketing Manager: Restricted from representative commercial data (empty or marketing scope)
 */
export function getAuthorizedScope(
  user: { id?: string; name?: string; role?: UserRole | string; businessUnit?: string },
  usersList?: StoredAdminUser[]
): {
  repIds: string[] | 'ALL'
  repNames: string[] | 'ALL'
  isCompanyWide: boolean
  isMarketingOnly: boolean
} {
  const role = (user.role || 'rep') as UserRole

  if (role === 'admin') {
    return {
      repIds: 'ALL',
      repNames: 'ALL',
      isCompanyWide: true,
      isMarketingOnly: false,
    }
  }

  const allUsers = usersList || usersStore.get()
  const userId = user.id || ''
  const userName = user.name || ''

  if (role === 'first_line_manager') {
    // Find all direct reports who report to this manager
    const directReports = allUsers.filter(
      (u) =>
        u.managerId === userId ||
        (userName && u.managerId?.toLowerCase() === userName.toLowerCase())
    )

    const ids = Array.from(new Set([userId, ...directReports.map((r) => r.id)])).filter(Boolean)
    const names = Array.from(new Set([userName, ...directReports.map((r) => r.name)])).filter(Boolean)

    return {
      repIds: ids,
      repNames: names,
      isCompanyWide: false,
      isMarketingOnly: false,
    }
  }

  if (role === 'business_unit_manager') {
    const bu = user.businessUnit
    const buUsers = bu ? allUsers.filter((u) => u.businessUnit === bu) : []

    const ids = Array.from(new Set([userId, ...buUsers.map((u) => u.id)])).filter(Boolean)
    const names = Array.from(new Set([userName, ...buUsers.map((u) => u.name)])).filter(Boolean)

    return {
      repIds: ids,
      repNames: names,
      isCompanyWide: false,
      isMarketingOnly: false,
    }
  }

  if (role === 'marketing_manager') {
    return {
      repIds: [],
      repNames: [],
      isCompanyWide: false,
      isMarketingOnly: true,
    }
  }

  // Default: Medical Representative sees only their own data
  return {
    repIds: userId ? [userId] : [],
    repNames: userName ? [userName] : [],
    isCompanyWide: false,
    isMarketingOnly: false,
  }
}

// ── Shared Data Filtering Utilities ─────────────────────────────────────────

export function filterCustomersByScope(
  customers: Customer[],
  user: { id?: string; name?: string; role?: UserRole | string; businessUnit?: string },
  usersList?: StoredAdminUser[]
): Customer[] {
  const scope = getAuthorizedScope(user, usersList)
  if (scope.isCompanyWide) return customers
  if (scope.isMarketingOnly) return [] // Marketing managers do not have commercial access to rep customer lists

  const idSet = new Set((scope.repIds as string[]).map((id) => id.toLowerCase()))
  const nameSet = new Set((scope.repNames as string[]).map((n) => n.toLowerCase()))

  return customers.filter((c) => {
    const rawRepId = c.rep_id || (c as any).assignedRepId
    const rawRepName = c.repName || (c as any).assignedRepName
    const repIdMatch = rawRepId && idSet.has(rawRepId.toLowerCase())
    const repNameMatch = rawRepName && nameSet.has(rawRepName.toLowerCase())
    return Boolean(repIdMatch || repNameMatch)
  })
}

export function filterVisitsByScope(
  visits: StoredVisit[],
  user: { id?: string; name?: string; role?: UserRole | string; businessUnit?: string },
  usersList?: StoredAdminUser[]
): StoredVisit[] {
  const scope = getAuthorizedScope(user, usersList)
  if (scope.isCompanyWide) return visits
  if (scope.isMarketingOnly) return []

  const idSet = new Set((scope.repIds as string[]).map((id) => id.toLowerCase()))
  const nameSet = new Set((scope.repNames as string[]).map((n) => n.toLowerCase()))

  return visits.filter((v) => {
    const repIdMatch = v.repId && idSet.has(v.repId.toLowerCase())
    const repNameMatch = v.repName && nameSet.has(v.repName.toLowerCase())
    // Double visit joint rep check
    const jointIdMatch = v.isDoubleVisit && v.jointRepId && idSet.has(v.jointRepId.toLowerCase())
    const jointNameMatch = v.isDoubleVisit && v.jointRepName && nameSet.has(v.jointRepName.toLowerCase())
    return Boolean(repIdMatch || repNameMatch || jointIdMatch || jointNameMatch)
  })
}

export function filterVisitPlansByScope(
  plans: VisitPlan[],
  user: { id?: string; name?: string; role?: UserRole | string; businessUnit?: string },
  usersList?: StoredAdminUser[]
): VisitPlan[] {
  const scope = getAuthorizedScope(user, usersList)
  if (scope.isCompanyWide) return plans
  if (scope.isMarketingOnly) return []

  const idSet = new Set((scope.repIds as string[]).map((id) => id.toLowerCase()))
  const nameSet = new Set((scope.repNames as string[]).map((n) => n.toLowerCase()))

  return plans.filter((p) => {
    const repIdMatch = p.repId && idSet.has(p.repId.toLowerCase())
    const repNameMatch = p.repName && nameSet.has(p.repName.toLowerCase())
    return Boolean(repIdMatch || repNameMatch)
  })
}

export function filterSellOutByScope(
  records: SellOutRecord[],
  user: { id?: string; name?: string; role?: UserRole | string; businessUnit?: string },
  usersList?: StoredAdminUser[]
): SellOutRecord[] {
  const scope = getAuthorizedScope(user, usersList)
  if (scope.isCompanyWide) return records
  if (scope.isMarketingOnly) return []

  const idSet = new Set((scope.repIds as string[]).map((id) => id.toLowerCase()))
  const nameSet = new Set((scope.repNames as string[]).map((n) => n.toLowerCase()))

  return records.filter((r) => {
    const repIdMatch = r.repId && idSet.has(r.repId.toLowerCase())
    const repNameMatch = r.repName && nameSet.has(r.repName.toLowerCase())
    return Boolean(repIdMatch || repNameMatch)
  })
}

export function filterWarehouseSellOutByScope(
  reports: WarehouseSellOutReport[],
  user: { id?: string; name?: string; role?: UserRole | string; businessUnit?: string },
  usersList?: StoredAdminUser[]
): WarehouseSellOutReport[] {
  const scope = getAuthorizedScope(user, usersList)
  if (scope.isCompanyWide) return reports
  if (scope.isMarketingOnly) return []

  const idSet = new Set((scope.repIds as string[]).map((id) => id.toLowerCase()))
  const nameSet = new Set((scope.repNames as string[]).map((n) => n.toLowerCase()))

  return reports.filter((r) => {
    const repIdMatch = r.repId && idSet.has(r.repId.toLowerCase())
    const repNameMatch = r.repName && nameSet.has(r.repName.toLowerCase())
    return Boolean(repIdMatch || repNameMatch)
  })
}

export function filterTargetsByScope(
  targets: SalesTarget[],
  user: { id?: string; name?: string; role?: UserRole | string; businessUnit?: string },
  usersList?: StoredAdminUser[]
): SalesTarget[] {
  const scope = getAuthorizedScope(user, usersList)
  if (scope.isCompanyWide) return targets
  if (scope.isMarketingOnly) return []

  const idSet = new Set((scope.repIds as string[]).map((id) => id.toLowerCase()))
  const nameSet = new Set((scope.repNames as string[]).map((n) => n.toLowerCase()))

  return targets.filter((t) => {
    const repIdMatch = t.repId && idSet.has(t.repId.toLowerCase())
    const repNameMatch = t.repName && nameSet.has(t.repName.toLowerCase())
    return Boolean(repIdMatch || repNameMatch)
  })
}

// ── Sell-Out Performance Calculations ───────────────────────────────────────
export interface IndividualSellOutPerformance {
  repId: string
  repName: string
  targetUnits: number
  actualUnits: number
  achievementRate: number
  achievementPct: number
  remainingUnits: number
}

export interface TeamSellOutPerformanceResult {
  individual: IndividualSellOutPerformance[]
  reps: IndividualSellOutPerformance[]
  totalTarget: number
  totalActual: number
  totalAchievementRate: number
  totalRemaining: number
  teamTotal: {
    targetUnits: number
    actualUnits: number
    achievementPct: number
    remainingUnits: number
  }
}

export type TeamSellOutSummary = TeamSellOutPerformanceResult

export function calculateTeamSellOutPerformance(
  user: { id?: string; name?: string; role?: UserRole | string; businessUnit?: string },
  reportsOrMonth?: WarehouseSellOutReport[] | string,
  targets?: SalesTarget[],
  usersList?: StoredAdminUser[]
): TeamSellOutPerformanceResult {
  const scope = getAuthorizedScope(user, usersList)
  const allUsers = usersList || usersStore.get()

  let allReports: WarehouseSellOutReport[] = Array.isArray(reportsOrMonth)
    ? reportsOrMonth
    : warehouseSellOutStore.get()
  if (typeof reportsOrMonth === 'string' && reportsOrMonth) {
    allReports = allReports.filter((r) => r.reportingMonth === reportsOrMonth)
  }

  const allTargets = targets || targetsStore.get()

  // Target rep population based on scope
  let relevantReps: Array<{ id: string; name: string }> = []

  if (scope.isCompanyWide) {
    relevantReps = allUsers.filter((u) => u.roleType === 'rep').map((u) => ({ id: u.id, name: u.name }))
  } else if (!scope.isMarketingOnly && scope.repIds !== 'ALL') {
    const idSet = new Set(scope.repIds)
    relevantReps = allUsers
      .filter((u) => u.roleType === 'rep' && idSet.has(u.id))
      .map((u) => ({ id: u.id, name: u.name }))
  }

  // Sum actual units from warehouse reports
  const actualByRepId = new Map<string, number>()
  const scopedReports = filterWarehouseSellOutByScope(allReports, user, usersList)

  scopedReports.forEach((report) => {
    const totalUnits = report.items.reduce((sum, it) => sum + (it.quantity || 0), 0)
    const current = actualByRepId.get(report.repId) || 0
    actualByRepId.set(report.repId, current + totalUnits)
  })

  // Sum targets
  const targetByRepId = new Map<string, number>()
  const scopedTargets = filterTargetsByScope(allTargets, user, usersList)

  scopedTargets.forEach((t) => {
    if (t.repId) {
      const current = targetByRepId.get(t.repId) || 0
      const targetInUnits = Math.round(t.targetValue / 20)
      targetByRepId.set(t.repId, current + targetInUnits)
    }
  })

  const individual: IndividualSellOutPerformance[] = relevantReps.map((rep) => {
    const actualUnits = actualByRepId.get(rep.id) || 0
    const targetUnits = targetByRepId.get(rep.id) || 4500 // default baseline target if none assigned
    const achievementPct = targetUnits > 0 ? Math.round((actualUnits / targetUnits) * 100) : 0
    const remainingUnits = Math.max(0, targetUnits - actualUnits)

    return {
      repId: rep.id,
      repName: rep.name,
      targetUnits,
      actualUnits,
      achievementRate: achievementPct,
      achievementPct,
      remainingUnits,
    }
  })

  const totalActual = individual.reduce((acc, i) => acc + i.actualUnits, 0)
  const totalTarget = individual.reduce((acc, i) => acc + i.targetUnits, 0)
  const teamAchievementPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0
  const teamRemaining = Math.max(0, totalTarget - totalActual)

  return {
    individual,
    reps: individual,
    totalTarget,
    totalActual,
    totalAchievementRate: teamAchievementPct,
    totalRemaining: teamRemaining,
    teamTotal: {
      targetUnits: totalTarget,
      actualUnits: totalActual,
      achievementPct: teamAchievementPct,
      remainingUnits: teamRemaining,
    },
  }
}

// ── Double Visit: Eligible Regional Participants ────────────────────────────

export interface EligibleDoubleVisitParticipant {
  id: string
  name: string
  name_ar?: string
  role: string
  roleType: UserRole
  region: string
  businessUnit?: string
  displayLabel: string
  displayLabel_ar: string
}

/**
 * Returns eligible Double Visit participants for a given representative:
 * 1. Same-region Medical Representatives.
 * 2. Same-region First Line Managers (not restricted to direct manager).
 * 3. Business Unit Managers when assigned region or BU matches permitted scope.
 * 4. Excludes: logged-in user / primary rep, inactive / pending / unapproved accounts,
 *    and users outside the regional scope.
 */
export function getEligibleDoubleVisitParticipants(
  currentUser: {
    id?: string
    name?: string
    role?: UserRole | string
    region?: string
    businessUnit?: string
  },
  allUsersList?: StoredAdminUser[]
): EligibleDoubleVisitParticipant[] {
  const allUsers = allUsersList || usersStore.get()

  // Find primary user to resolve territory / BU scope
  const primaryUser = allUsers.find(
    (u) =>
      (currentUser.id && u.id.toLowerCase() === currentUser.id.toLowerCase()) ||
      (currentUser.name && u.name.toLowerCase() === currentUser.name.toLowerCase())
  )

  const primaryId = currentUser.id || primaryUser?.id || ''
  const primaryName = currentUser.name || primaryUser?.name || ''
  const primaryRegion = currentUser.region || primaryUser?.region || ''
  const primaryBu = currentUser.businessUnit || primaryUser?.businessUnit || ''

  return allUsers
    .filter((u) => {
      // 1. Exclude self / primary representative
      if (primaryId && u.id.toLowerCase() === primaryId.toLowerCase()) return false
      if (primaryName && u.name.toLowerCase() === primaryName.toLowerCase()) return false

      // 2. Exclude inactive, suspended, or unapproved accounts
      const status = (u.status || '').trim().toLowerCase()
      if (status !== 'active') return false

      // 3. Eligible roles: Medical Representatives, First Line Managers, Business Unit Managers
      const eligibleRoles: UserRole[] = ['rep', 'first_line_manager', 'business_unit_manager']
      if (!eligibleRoles.includes(u.roleType)) return false

      // 4. Regional and Business Unit scope matching
      const sameRegion =
        primaryRegion &&
        u.region &&
        u.region.trim().toLowerCase() === primaryRegion.trim().toLowerCase()

      if (u.roleType === 'rep' || u.roleType === 'first_line_manager') {
        // Must be in the same region
        return Boolean(sameRegion)
      }

      if (u.roleType === 'business_unit_manager') {
        // Exclude specific other regions outside representative's scope
        const isOtherSpecificRegion =
          u.region &&
          primaryRegion &&
          u.region.trim().toLowerCase() !== primaryRegion.trim().toLowerCase() &&
          !['hq - global', 'global', 'all', 'all regions'].includes(u.region.trim().toLowerCase())

        if (isOtherSpecificRegion) {
          return false
        }

        // BUM is eligible if in the same region, OR their business unit matches
        const buMatches =
          !u.businessUnit ||
          !primaryBu ||
          u.businessUnit.trim().toLowerCase() === primaryBu.trim().toLowerCase()

        return Boolean(sameRegion || buMatches)
      }

      return false
    })
    .map((u) => {
      const roleLabelEn = ROLE_LABELS[u.roleType] || u.role
      const roleLabelAr = ROLE_LABELS_AR[u.roleType] || u.role

      const metaParts: string[] = []
      if (u.region) metaParts.push(u.region)
      if (u.businessUnit) metaParts.push(u.businessUnit)
      const metaStr = metaParts.length > 0 ? ` (${metaParts.join(' · ')})` : ''

      return {
        id: u.id,
        name: u.name,
        name_ar: u.name_ar,
        role: u.role,
        roleType: u.roleType,
        region: u.region,
        businessUnit: u.businessUnit,
        displayLabel: `${u.name} — ${roleLabelEn}${metaStr}`,
        displayLabel_ar: `${u.name_ar || u.name} — ${roleLabelAr}${metaStr}`,
      }
    })
}

