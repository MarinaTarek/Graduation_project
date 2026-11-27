/**
 * reportingAnalytics.ts
 *
 * Phase 3 — Data Integrity & Cross-Module Consistency
 * Authoritative reporting, KPI, and analytics engine calculated directly from
 * primary stores (invoicesStore, collectionsStore, targetsStore, visitsStore,
 * stockMovementsStore, returnsStore, customersStore).
 */

import { invoicesStore, type StoredInvoice } from './invoices'
import { collectionsStore, calculateCashInKpis } from './cash-in'
import { targetsStore, calculateTargetProgress } from './targets'
import { visitsStore, type StoredVisit } from './visits'
import { customersStore, type Customer } from './customers'
import { returnsStore, type ReturnRecord } from './returns'
import { batchesStore, stockMovementsStore, getBatchesNearExpiry, deriveBatches } from './stockDerived'
import { usersStore } from './users'
import { productsStore } from './products'
import { salesOrdersStore } from './sales-orders'
import { getAuthorizedScope } from './dataScope'
import type { UserRole } from '@/lib/auth/types'

// ── Receivables Aging & Top Late Accounts ───────────────────────────────────

export interface AuthoritativeReceivable {
  customer_id: string
  customer_name: string
  rep_name: string
  outstanding_amount: number
  overdue_amount: number
  days_overdue: number
  invoices_count: number
}

export function getAuthoritativeReceivables(): AuthoritativeReceivable[] {
  const invoices = invoicesStore.get().filter(
    (inv) => !inv.needsReconciliation && inv.status !== 'Rejected' && inv.status !== 'Voided'
  )
  const customers = customersStore.get()
  const customerMap = new Map<string, Customer>()
  customers.forEach((c) => {
    if (c.id) customerMap.set(c.id, c)
  })

  const now = new Date()
  const grouped = new Map<string, {
    customer_id: string
    customer_name: string
    rep_name: string
    outstanding: number
    overdue: number
    maxDaysOverdue: number
    count: number
  }>()

  for (const inv of invoices) {
    const balance = inv.remainingBalance !== undefined ? inv.remainingBalance : (inv.originalAmount ?? 0)
    if (balance <= 0) continue

    const cust = customerMap.get(inv.customerId)
    const custName = cust?.name || inv.customerName || inv.customerId
    const repName = cust?.repName || 'Alex Morgan'

    let daysOverdue = 0
    if (inv.dueDate) {
      const due = new Date(inv.dueDate)
      if (!isNaN(due.getTime()) && now.getTime() > due.getTime()) {
        daysOverdue = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
      }
    }

    const existing = grouped.get(inv.customerId) || {
      customer_id: inv.customerId,
      customer_name: custName,
      rep_name: repName,
      outstanding: 0,
      overdue: 0,
      maxDaysOverdue: 0,
      count: 0,
    }

    existing.outstanding += balance
    if (daysOverdue > 0) {
      existing.overdue += balance
      if (daysOverdue > existing.maxDaysOverdue) {
        existing.maxDaysOverdue = daysOverdue
      }
    }
    existing.count += 1
    grouped.set(inv.customerId, existing)
  }

  return Array.from(grouped.values()).map((g) => ({
    customer_id: g.customer_id,
    customer_name: g.customer_name,
    rep_name: g.rep_name,
    outstanding_amount: Math.round(g.outstanding * 100) / 100,
    overdue_amount: Math.round(g.overdue * 100) / 100,
    days_overdue: g.maxDaysOverdue,
    invoices_count: g.count,
  }))
}

// ── Authoritative Dashboard KPIs ────────────────────────────────────────────

export interface AuthoritativeDashboardKpis {
  totalReceivables: number
  totalOverdue: number
  invoicesPendingCount: number
  batchesExpiringCount: number
  totalActiveCustomers: number
  visitedCustomersCount: number
  visitCoveragePct: number
  returnsTotalUnits: number
}

export function getAuthoritativeDashboardKpis(repId?: string): AuthoritativeDashboardKpis {
  const invoices = invoicesStore.get()
  const collections = collectionsStore.get()
  const kpis = calculateCashInKpis(invoices, collections)

  const pendingCount = invoices.filter(
    (inv) => inv.status === 'Pending' && !inv.needsReconciliation
  ).length

  const batches = batchesStore.get()
  const movements = stockMovementsStore.get()
  const expiringCount = getBatchesNearExpiry(movements, batches, 90).length

  const customers = customersStore.get().filter((c) => !c.deleted_at && c.active !== false)
  const scopedCustomers = repId ? customers.filter((c) => c.rep_id === repId) : customers
  const totalCustomers = scopedCustomers.length

  const visits = visitsStore.get().filter((v) => v.status === 'Completed')
  const visitedCustomerIds = new Set(visits.map((v) => v.clientId || v.doctorId).filter(Boolean))
  const visitedCount = scopedCustomers.filter((c) => c.id && visitedCustomerIds.has(c.id)).length
  const visitCoverage = totalCustomers > 0 ? Math.round((visitedCount / totalCustomers) * 100) : 0

  const returns = returnsStore.get()
  const returnUnits = returns.reduce((sum, r) => sum + (r.quantity || 0), 0)

  return {
    totalReceivables: kpis.outstandingBalance,
    totalOverdue: kpis.overdueAmount,
    invoicesPendingCount: pendingCount,
    batchesExpiringCount: expiringCount,
    totalActiveCustomers: totalCustomers,
    visitedCustomersCount: visitedCount,
    visitCoveragePct: visitCoverage,
    returnsTotalUnits: returnUnits,
  }
}

// ── Authoritative Rep Scorecard Aggregation ─────────────────────────────────

export interface AuthoritativeRepScorecard {
  repId: string
  name: string
  email: string
  territory: string
  sales: number
  salesTarget: number
  targetPct: number
  visitsLogged: number
  visitsTarget: number
  samplesDistributed: number
}

export function getAuthoritativeRepScorecard(
  repNameOrId: string,
  currentUser?: { id?: string; name?: string; role?: UserRole | string; businessUnit?: string }
): AuthoritativeRepScorecard {
  if (currentUser) {
    const scope = getAuthorizedScope(currentUser)
    if (scope.isMarketingOnly) {
      throw new Error('Unauthorized: Marketing Managers do not have access to representative performance scorecards.')
    }
    const reqLower = repNameOrId.toLowerCase()
    if (currentUser.role === 'rep') {
      const isOwn = (currentUser.id && currentUser.id.toLowerCase() === reqLower) ||
                    (currentUser.name && currentUser.name.toLowerCase() === reqLower)
      if (!isOwn) {
        throw new Error('Unauthorized: Medical Representatives can only view their own performance scorecard.')
      }
    } else if (!scope.isCompanyWide && scope.repIds !== 'ALL') {
      const idMatch = (scope.repIds as string[]).some((id) => id.toLowerCase() === reqLower)
      const nameMatch = (scope.repNames as string[]).some((n) => n.toLowerCase() === reqLower)
      if (!idMatch && !nameMatch) {
        throw new Error(`Unauthorized: User "${currentUser.name}" cannot view scorecard for representative "${repNameOrId}" outside their authorized organizational scope.`)
      }
    }
  }

  const users = usersStore.get()
  const user = users.find(
    (u) => u.id === repNameOrId || u.name.toLowerCase() === repNameOrId.toLowerCase()
  )
  const repName = user?.name || repNameOrId
  const repId = user?.id || repNameOrId

  // Calculate actual revenue from invoices
  const invoices = invoicesStore.get().filter(
    (inv) =>
      !inv.needsReconciliation &&
      (inv.status === 'Paid' || inv.status === 'Partially Paid' || inv.status === 'Approved') &&
      ((inv.repName && inv.repName.toLowerCase() === repName.toLowerCase()) ||
        (inv.repId && inv.repId === repId))
  )
  const totalSales = invoices.reduce((sum, inv) => sum + (inv.originalAmount || 0), 0)

  // Calculate targets from targetsStore
  const targets = targetsStore.get().filter(
    (t) => t.repId === repId || t.repName.toLowerCase() === repName.toLowerCase()
  )
  const salesTarget = targets.reduce((sum, t) => sum + (t.targetValue || 0), 0)
  const targetPct = salesTarget > 0 ? Math.round((totalSales / salesTarget) * 100) : 0

  // Calculate visits logged
  const visits = visitsStore.get().filter(
    (v) =>
      (v.repId === repId || (v.repName && v.repName.toLowerCase() === repName.toLowerCase())) &&
      v.status === 'Completed'
  )
  const allVisits = visitsStore.get().filter(
    (v) => v.repId === repId || (v.repName && v.repName.toLowerCase() === repName.toLowerCase())
  )
  const visitsLogged = visits.length
  const visitsTarget = allVisits.length

  // Calculate sample movements
  const movements = stockMovementsStore.get().filter(
    (m) =>
      m.type === 'sample' &&
      (m.rep_id === repId || (m.repName && m.repName.toLowerCase() === repName.toLowerCase()))
  )
  const samplesDistributed = movements.reduce((sum, m) => sum + m.quantity, 0)

  return {
    repId,
    name: repName,
    email: user?.email || `${repName.toLowerCase().replace(/\s+/g, '.')}@navigenpharma.net`,
    territory: user?.region || 'Central region',
    sales: totalSales,
    salesTarget,
    targetPct,
    visitsLogged,
    visitsTarget,
    samplesDistributed,
  }
}

// ── Invoices & Approvals Report Aggregation ──────────────────────────────────

export interface AuthoritativeInvoicesApprovalsSummary {
  totalCount: number
  totalAmount: number
  approvedCount: number
  pendingCount: number
  rejectedCount: number
  paidCount: number
  rejectionReasons: Array<{ reason: string; count: number; pct: number }>
}

export function getAuthoritativeInvoicesApprovalsSummary(
  currentUser?: { id?: string; name?: string; role?: UserRole | string; businessUnit?: string }
): AuthoritativeInvoicesApprovalsSummary {
  if (currentUser) {
    if (currentUser.role === 'marketing_manager' || currentUser.role === 'rep') {
      throw new Error(`Unauthorized: Role "${currentUser.role}" does not have access to Invoices & Approvals reporting.`)
    }
  }

  const invoices = invoicesStore.get().filter((inv) => !inv.needsReconciliation)
  const totalCount = invoices.length
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.originalAmount || 0), 0)

  let approved = 0
  let pending = 0
  let rejected = 0
  let paid = 0
  const reasonCounts: Record<string, number> = {}

  for (const inv of invoices) {
    if (inv.status === 'Paid') paid++
    else if (inv.status === 'Approved') approved++
    else if (inv.status === 'Pending') pending++
    else if (inv.status === 'Rejected') {
      rejected++
      const reason = (inv as any).rejectionReason || (inv as any).rejection_reason || 'Price discrepancy'
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
    }
  }

  const rejectionReasons = Object.entries(reasonCounts).map(([reason, count]) => ({
    reason,
    count,
    pct: rejected > 0 ? Math.round((count / rejected) * 100) : 0,
  }))

  return {
    totalCount,
    totalAmount,
    approvedCount: approved,
    pendingCount: pending,
    rejectedCount: rejected,
    paidCount: paid,
    rejectionReasons,
  }
}

// ── Sales Performance Report Aggregation ────────────────────────────────────

export interface AuthoritativeSalesPerformance {
  summaryStats: Array<{
    label: string
    value: string
    change: string
    isPositive: boolean
  }>
  reps: Array<{
    id: string
    rep: string
    territory: string
    target: number
    actual: number
    achievementRate: number
    topProduct: string
    growthPct: number
    productBars: Array<{ product: string; amount: number; color: string }>
  }>
}

const BRAND_COLORS: Record<string, string> = {
  'Bevato': '#3F6593',
  'Naviro D3 50,000 IU': '#80AAD3',
  'Naviro D3 10,000 IU': '#7FC8A9',
  'Naviro D3 Drops': '#80AAD3',
  'Navigen Product 5': '#E8B86D',
}

export function getAuthoritativeSalesPerformance(
  filters?: { reps?: string[]; regions?: string[]; products?: string[] },
  currentUser?: { id?: string; name?: string; role?: UserRole | string; businessUnit?: string }
): AuthoritativeSalesPerformance {
  if (currentUser) {
    const scope = getAuthorizedScope(currentUser)
    if (scope.isMarketingOnly) {
      throw new Error('Unauthorized: Marketing Managers do not have commercial access to Sales Performance reports.')
    }
  }

  const users = usersStore.get()
  const invoices = invoicesStore.get().filter(
    (inv) => !inv.needsReconciliation && inv.status !== 'Rejected' && inv.status !== 'Voided'
  )
  const orders = salesOrdersStore.get()
  const targets = targetsStore.get()

  // Eligible field reps
  const fieldUsers = users.filter(
    (u) => u.roleType === 'rep' || u.role.toLowerCase().includes('rep') || u.name === 'Alex Morgan'
  )

  const scope = currentUser ? getAuthorizedScope(currentUser) : null
  const filteredUsers = fieldUsers.filter((u) => {
    if (scope && !scope.isCompanyWide && scope.repIds !== 'ALL') {
      const idMatch = (scope.repIds as string[]).some((id) => id.toLowerCase() === u.id.toLowerCase())
      const nameMatch = (scope.repNames as string[]).some((n) => n.toLowerCase() === u.name.toLowerCase())
      if (!idMatch && !nameMatch) return false
    }
    if (filters?.reps && filters.reps.length > 0 && !filters.reps.includes(u.name)) return false
    if (
      filters?.regions &&
      filters.regions.length > 0 &&
      !filters.regions.some((reg) => u.region?.toLowerCase().includes(reg.split(' ')[0].toLowerCase()))
    )
      return false
    return true
  })

  const reps = filteredUsers.map((u) => {
    const uName = u.name.toLowerCase()
    const uId = u.id

    // Rep targets
    const repTargets = targets.filter(
      (t) => t.repId === uId || t.repName.toLowerCase() === uName
    )
    const target = repTargets.reduce((sum, t) => sum + (t.targetValue || 0), 0)

    // Rep invoices (Approved, Paid, Partially Paid)
    const repInvoices = invoices.filter(
      (inv) =>
        (inv.status === 'Paid' || inv.status === 'Partially Paid' || inv.status === 'Approved') &&
        ((inv.repName && inv.repName.toLowerCase() === uName) || (inv.repId && inv.repId === uId))
    )

    // Rep approved or dispatched orders not yet invoiced
    const invoicedOrderIds = new Set(repInvoices.map((inv) => inv.order_id).filter(Boolean))
    const repOrders = orders.filter(
      (o) =>
        (o.status === 'Approved' || o.status === 'Dispatched') &&
        !invoicedOrderIds.has(o.id) &&
        (o.repId === uId || o.repName.toLowerCase() === uName)
    )

    let actual = 0
    const productAmounts: Record<string, number> = {}

    for (const inv of repInvoices) {
      const amt = inv.originalAmount || 0
      actual += amt
      if (inv.items && inv.items.length > 0) {
        for (const item of inv.items) {
          productAmounts[item.productName] =
            (productAmounts[item.productName] || 0) + (item.total || item.quantity * item.unitPrice)
        }
      } else {
        productAmounts['Bevato'] = (productAmounts['Bevato'] || 0) + amt
      }
    }

    for (const ord of repOrders) {
      actual += ord.total
      for (const item of ord.items) {
        productAmounts[item.productName] =
          (productAmounts[item.productName] || 0) + (item.total || item.quantity * item.unitPrice)
      }
    }

    const achievementRate = target > 0 ? Math.round((actual / target) * 1000) / 10 : 0

    // Top product and product breakdown bars
    let topProduct = 'None'
    let maxProdAmt = 0
    const productBars: Array<{ product: string; amount: number; color: string }> = []

    for (const [pName, pAmt] of Object.entries(productAmounts)) {
      if (pAmt > maxProdAmt) {
        maxProdAmt = pAmt
        topProduct = pName
      }
      productBars.push({
        product: pName,
        amount: Math.round(pAmt),
        color: BRAND_COLORS[pName] || '#64748b',
      })
    }

    return {
      id: u.id,
      rep: u.name,
      territory: u.region || 'Central District',
      target,
      actual: Math.round(actual),
      achievementRate,
      topProduct,
      growthPct: achievementRate >= 100 ? Math.round((achievementRate - 100) * 10) / 10 : 0,
      productBars,
    }
  })

  const totalActual = reps.reduce((sum, r) => sum + r.actual, 0)
  const totalTarget = reps.reduce((sum, r) => sum + r.target, 0)
  const rate = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : '0.0'
  const avgVelocity = reps.length > 0 ? Math.round(totalActual / reps.length) : 0
  const vsTargetPct = totalTarget > 0 ? (((totalActual - totalTarget) / totalTarget) * 100).toFixed(1) : '0.0'

  const summaryStats = [
    {
      label: 'Total Revenue',
      value: `EGP ${totalActual.toLocaleString('en-US')}`,
      change: `${totalActual >= totalTarget ? '+' : ''}${vsTargetPct}% vs target`,
      isPositive: totalActual >= totalTarget,
    },
    {
      label: 'Quota Achievement',
      value: `${rate}%`,
      change: `Goal: EGP ${totalTarget.toLocaleString('en-US')}`,
      isPositive: Number(rate) >= 100,
    },
    {
      label: 'Average Rep Velocity',
      value: `EGP ${avgVelocity.toLocaleString('en-US')}`,
      change: `${reps.length} active field reps`,
      isPositive: totalActual > 0,
    },
  ]

  return { summaryStats, reps }
}

// ── Visit Coverage Report Aggregation ───────────────────────────────────────

export interface AuthoritativeVisitCoverage {
  summaryStats: Array<{
    label: string
    value: string
    change: string
    isPositive: boolean
  }>
  repCoverage: Array<{
    rep: string
    planned: number
    completed: number
    missed: number
    coveragePct: number
  }>
  overdueDoctors: Array<{
    id: string
    name: string
    specialty: string
    clinic: string
    territory: string
    assignedRep: string
    lastVisit: string
    daysOverdue: number
    targetFrequency: string
  }>
}

export function getAuthoritativeVisitCoverage(
  filters?: { reps?: string[]; regions?: string[] },
  currentUser?: { id?: string; name?: string; role?: UserRole | string; businessUnit?: string }
): AuthoritativeVisitCoverage {
  if (currentUser) {
    const scope = getAuthorizedScope(currentUser)
    if (scope.isMarketingOnly) {
      throw new Error('Unauthorized: Marketing Managers do not have access to Visit Coverage reports.')
    }
  }

  const users = usersStore.get()
  const visits = visitsStore.get()
  const customers = customersStore.get().filter((c) => !c.deleted_at && c.active !== false)

  const fieldUsers = users.filter(
    (u) => u.roleType === 'rep' || u.role.toLowerCase().includes('rep') || u.name === 'Alex Morgan'
  )

  const scope = currentUser ? getAuthorizedScope(currentUser) : null
  const filteredUsers = fieldUsers.filter((u) => {
    if (scope && !scope.isCompanyWide && scope.repIds !== 'ALL') {
      const idMatch = (scope.repIds as string[]).some((id) => id.toLowerCase() === u.id.toLowerCase())
      const nameMatch = (scope.repNames as string[]).some((n) => n.toLowerCase() === u.name.toLowerCase())
      if (!idMatch && !nameMatch) return false
    }
    if (filters?.reps && filters.reps.length > 0 && !filters.reps.includes(u.name)) return false
    if (
      filters?.regions &&
      filters.regions.length > 0 &&
      !filters.regions.some((reg) => u.region?.toLowerCase().includes(reg.split(' ')[0].toLowerCase()))
    )
      return false
    return true
  })

  const repCoverage = filteredUsers.map((u) => {
    const uName = u.name.toLowerCase()
    const uId = u.id

    const repVisits = visits.filter(
      (v) => v.repId === uId || (v.repName && v.repName.toLowerCase() === uName)
    )
    const completed = repVisits.filter((v) => v.status === 'Completed').length
    const planned = Math.max(repVisits.length, completed)
    const missed = Math.max(0, planned - completed)
    const coveragePct = planned > 0 ? Math.round((completed / planned) * 1000) / 10 : 0

    return {
      rep: u.name,
      planned,
      completed,
      missed,
      coveragePct,
    }
  })

  const now = new Date()
  const filteredCustomers = customers.filter((c) => {
    if (scope && !scope.isCompanyWide && scope.repIds !== 'ALL') {
      const custRepId = (c.rep_id || '').toLowerCase()
      const custRepName = (c.repName || '').toLowerCase()
      const idMatch = custRepId && (scope.repIds as string[]).some((id) => id.toLowerCase() === custRepId)
      const nameMatch = custRepName && (scope.repNames as string[]).some((n) => n.toLowerCase() === custRepName)
      if (!idMatch && !nameMatch) return false
    }
    if (filters?.reps && filters.reps.length > 0 && (!c.repName || !filters.reps.includes(c.repName))) return false
    if (
      filters?.regions &&
      filters.regions.length > 0 &&
      (!c.region || !filters.regions.some((reg) => c.region?.toLowerCase().includes(reg.split(' ')[0].toLowerCase())))
    )
      return false
    return true
  })

  const overdueDoctors: AuthoritativeVisitCoverage['overdueDoctors'] = []

  for (const c of filteredCustomers) {
    let cycleDays = 20
    if (c.classification === 'Class B') cycleDays = 30
    else if (c.classification === 'Class C') cycleDays = 45

    if (c.last_visit_date) {
      const last = new Date(c.last_visit_date)
      if (!isNaN(last.getTime())) {
        const daysElapsed = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
        if (daysElapsed > cycleDays) {
          overdueDoctors.push({
            id: c.id || `doc-${c.name}`,
            name: c.name,
            specialty: c.specialty || 'General Medicine',
            clinic: c.meta || c.name,
            territory: c.region || 'Central District',
            assignedRep: c.repName || 'Alex Morgan',
            lastVisit: `${daysElapsed} days ago`,
            daysOverdue: daysElapsed - cycleDays,
            targetFrequency: `Every ${cycleDays} days`,
          })
        }
      }
    } else {
      overdueDoctors.push({
        id: c.id || `doc-${c.name}`,
        name: c.name,
        specialty: c.specialty || 'General Medicine',
        clinic: c.meta || c.name,
        territory: c.region || 'Central District',
        assignedRep: c.repName || 'Alex Morgan',
        lastVisit: 'Never',
        daysOverdue: 30,
        targetFrequency: `Every ${cycleDays} days`,
      })
    }
  }

  overdueDoctors.sort((a, b) => b.daysOverdue - a.daysOverdue)

  const totalPlanned = repCoverage.reduce((sum, r) => sum + r.planned, 0)
  const totalCompleted = repCoverage.reduce((sum, r) => sum + r.completed, 0)
  const covRate = totalPlanned > 0 ? ((totalCompleted / totalPlanned) * 100).toFixed(1) : '0.0'

  const summaryStats = [
    {
      label: 'Target Coverage',
      value: `${covRate}%`,
      change: `${totalCompleted} of ${totalPlanned} doctors reached`,
      isPositive: Number(covRate) >= 85,
    },
    {
      label: 'Overdue Doctors',
      value: `${overdueDoctors.length} accounts`,
      change: 'Exceeding cycle interval',
      isPositive: overdueDoctors.length === 0,
    },
    {
      label: 'Total Visits Logged',
      value: `${totalCompleted} visits`,
      change: `${repCoverage.length} active field reps`,
      isPositive: totalCompleted > 0,
    },
  ]

  return { summaryStats, repCoverage, overdueDoctors }
}

// ── Sell-In vs Sell-Out Report Aggregation ───────────────────────────────────

export interface AuthoritativeSellInOut {
  summaryStats: Array<{
    label: string
    value: string
    change: string
    isPositive: boolean
  }>
  monthlyTrend: Array<{
    month: string
    sellIn: number
    sellOut: number
  }>
  products: Array<{
    id: string
    product: string
    sellInUnits: number
    sellOutUnits: number
    sellThroughRate: number
    monthsOnHand: number
    isLowSellThrough: boolean
    statusNotice?: string
  }>
}

export function getAuthoritativeSellInOut(
  filters?: { products?: string[] }
): AuthoritativeSellInOut {
  const movements = stockMovementsStore.get()
  const batches = batchesStore.get()
  const allDerivedBatches = deriveBatches(batches, movements)
  const catalogProducts = productsStore.get()

  const productNames = Array.from(
    new Set([
      ...catalogProducts.map((p) => p.name),
      ...movements.filter((m) => m.type === 'sell_in' || m.type === 'sell_out').map((m) => m.productName),
    ])
  )

  const filteredNames = productNames.filter((name) => {
    if (filters?.products && filters.products.length > 0 && !filters.products.includes(name)) {
      return false
    }
    return true
  })

  const productPriceMap = new Map<string, number>()
  for (const p of catalogProducts) {
    productPriceMap.set(p.name.toLowerCase(), p.price || 150)
  }

  const products: AuthoritativeSellInOut['products'] = filteredNames.map((pName, idx) => {
    const pNameLower = pName.toLowerCase()
    const pMovements = movements.filter((m) => m.productName.toLowerCase() === pNameLower)

    const sellInUnits = pMovements
      .filter((m) => m.type === 'sell_in')
      .reduce((sum, m) => sum + (m.quantity || 0), 0)

    const sellOutUnits = pMovements
      .filter((m) => m.type === 'sell_out')
      .reduce((sum, m) => sum + (m.quantity || 0), 0)

    const sellThroughRate = sellInUnits > 0 ? Math.round((sellOutUnits / sellInUnits) * 1000) / 10 : 0

    const pBatches = allDerivedBatches.filter((b) => b.productName.toLowerCase() === pNameLower && !b.is_expired)
    const stockOnHand = pBatches.reduce((sum, b) => sum + (b.qty_remaining || 0), 0)

    const monthlyVelocity = sellOutUnits > 0 ? sellOutUnits / 2 : 0
    const monthsOnHand =
      monthlyVelocity > 0 ? Math.round((stockOnHand / monthlyVelocity) * 10) / 10 : (stockOnHand > 0 ? 12 : 0)

    const isLowSellThrough = sellThroughRate < 75 && sellInUnits > 0
    const statusNotice = isLowSellThrough ? 'Low sell-through: excess pharmacy inventory' : undefined

    return {
      id: `p-${idx + 1}`,
      product: pName,
      sellInUnits,
      sellOutUnits,
      sellThroughRate,
      monthsOnHand,
      isLowSellThrough,
      statusNotice,
    }
  })

  const monthMap = new Map<string, { sellIn: number; sellOut: number }>()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  for (const m of movements) {
    if (m.type !== 'sell_in' && m.type !== 'sell_out') continue
    if (filters?.products && filters.products.length > 0 && !filters.products.includes(m.productName)) continue

    const dateStr = m.date || '2026-10-01'
    const monthIdx = parseInt(dateStr.slice(5, 7), 10) - 1
    const mName = monthNames[monthIdx] || 'Oct'

    const price = productPriceMap.get(m.productName.toLowerCase()) || 150
    const val = m.quantity * price

    const entry = monthMap.get(mName) || { sellIn: 0, sellOut: 0 }
    if (m.type === 'sell_in') entry.sellIn += val
    else if (m.type === 'sell_out') entry.sellOut += val
    monthMap.set(mName, entry)
  }

  let monthlyTrend: AuthoritativeSellInOut['monthlyTrend'] = Array.from(monthMap.entries()).map(
    ([month, values]) => ({
      month,
      sellIn: Math.round(values.sellIn),
      sellOut: Math.round(values.sellOut),
    })
  )

  if (monthlyTrend.length === 0) {
    monthlyTrend = [{ month: 'Oct', sellIn: 0, sellOut: 0 }]
  }

  const totalSellInUnits = products.reduce((sum, p) => sum + p.sellInUnits, 0)
  const totalSellOutUnits = products.reduce((sum, p) => sum + p.sellOutUnits, 0)
  const rate = totalSellInUnits > 0 ? ((totalSellOutUnits / totalSellInUnits) * 100).toFixed(1) : '0.0'

  const totalSellInValue = products.reduce((sum, p) => {
    const price = productPriceMap.get(p.product.toLowerCase()) || 150
    return sum + p.sellInUnits * price
  }, 0)
  const totalSellOutValue = products.reduce((sum, p) => {
    const price = productPriceMap.get(p.product.toLowerCase()) || 150
    return sum + p.sellOutUnits * price
  }, 0)

  const summaryStats = [
    {
      label: 'Total Sell-In',
      value: `EGP ${totalSellInValue.toLocaleString('en-US')}`,
      change: `${totalSellInUnits.toLocaleString('en-US')} packs ordered`,
      isPositive: true,
    },
    {
      label: 'Total Sell-Out',
      value: `EGP ${totalSellOutValue.toLocaleString('en-US')}`,
      change: `${totalSellOutUnits.toLocaleString('en-US')} packs dispensed`,
      isPositive: true,
    },
    {
      label: 'Sell-Through Ratio',
      value: `${rate}%`,
      change: 'Optimal threshold: 75%+',
      isPositive: Number(rate) >= 75,
    },
  ]

  return { summaryStats, monthlyTrend, products }
}
