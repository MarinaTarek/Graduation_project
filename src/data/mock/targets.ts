import { createStore } from './store'
import { addAuditLog } from './audit'
import type { StoredInvoice } from './invoices'
import type { SalesOrder } from './sales-orders'
import { getSystemCurrentDate, getSystemNow } from '@/lib/dateUtils'
import { findAuthoritativeUser } from '@/lib/approval/approvalEngine'
import { getAuthorizedScope } from './dataScope'

export type TargetPeriod = 'Monthly' | 'Quarterly'
export type TargetStatus = 'In Progress' | 'Achieved' | 'Expired'

export interface SalesTarget {
  id: string
  name: string
  name_ar?: string
  repId: string
  repName: string
  repName_ar?: string
  period: TargetPeriod
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  targetValue: number // in EGP
  createdAt: string
  updatedAt?: string
}

export interface TargetProgressSummary {
  achievedAmount: number
  remainingAmount: number
  percent: number
  isAchieved: boolean
  daysLeft: number
  status: TargetStatus
}

export const INITIAL_TARGETS: SalesTarget[] = [
  {
    id: 'tgt-01',
    name: 'October Cardiology & Specialty Goal',
    name_ar: 'مستهدف أكتوبر لأدوية القلب والتخصصية',
    repId: 'u-rep-olivia',
    repName: 'Olivia Martin',
    repName_ar: 'أوليفيا مارتن',
    period: 'Monthly',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    targetValue: 90000,
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'tgt-02',
    name: 'Q4 Core Portfolio - North Region',
    name_ar: 'مستهدف الربع الرابع للمحفظة الأساسية - المنطقة الشمالية',
    repId: 'u-rep-1',
    repName: 'Ahmed Samir',
    repName_ar: 'أحمد سمير',
    period: 'Quarterly',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    targetValue: 80000,
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'tgt-03',
    name: 'October Central Clinics Quota',
    name_ar: 'حصة أكتوبر لعيادات ومراكز المنطقة الوسطى',
    repId: 'u-rep-maya',
    repName: 'Maya Patel',
    repName_ar: 'مايا باتيل',
    period: 'Monthly',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    targetValue: 60000,
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'tgt-04',
    name: 'Q4 Delta & East Growth Target',
    name_ar: 'مستهدف النمو للربع الرابع - الدلتا والمنطقة الشرقية',
    repId: 'u-rep-sofia',
    repName: 'Sofia Chen',
    repName_ar: 'صوفيا تشن',
    period: 'Quarterly',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    targetValue: 40000,
    createdAt: '2026-10-01T08:00:00Z',
  },
]

export const targetsStore = createStore<SalesTarget[]>('sales_targets', INITIAL_TARGETS)

function assertTargetMutationScope(
  actor: string | { id?: string; name?: string; role?: string; email?: string } | undefined,
  targetData: Partial<SalesTarget>,
  operation: 'create' | 'update' | 'delete'
) {
  if (!actor || actor === 'Alex Morgan') return
  const authUser = findAuthoritativeUser(actor)
  const actorObj = typeof actor === 'object' && actor ? actor : null
  const actorUser = authUser || {
    id: actorObj?.id || `u-${(actorObj?.name || (typeof actor === 'string' ? actor : 'unknown')).toLowerCase().replace(/\s+/g, '-')}`,
    name: actorObj?.name || (typeof actor === 'string' ? actor : 'Unknown User'),
    role: (actorObj?.role || (typeof actor === 'string' && actor.toLowerCase().includes('admin') ? 'admin' : 'rep')) as any,
    businessUnit: (actorObj as any)?.businessUnit,
  }

  if (actorUser.role === 'marketing_manager' || actorUser.role === 'rep') {
    throw new Error(`Unauthorized target mutation: Role "${actorUser.role}" cannot ${operation} sales targets.`)
  }

  const scope = getAuthorizedScope(actorUser)
  if (scope.isCompanyWide) return

  const repId = (targetData.repId || '').toLowerCase()
  const repName = (targetData.repName || '').toLowerCase()
  const idMatch = repId && (scope.repIds as string[]).some((id) => id.toLowerCase() === repId)
  const nameMatch = repName && (scope.repNames as string[]).some((n) => n.toLowerCase() === repName)

  if (!idMatch && !nameMatch) {
    throw new Error(`Unauthorized target mutation: User "${actorUser.name}" (${actorUser.role}) cannot ${operation} targets outside their authorized organizational scope.`)
  }
}

export function createTarget(
  data: Omit<SalesTarget, 'id' | 'createdAt'>,
  actor: string | { id?: string; name?: string; role?: string } = 'Alex Morgan',
): SalesTarget {
  assertTargetMutationScope(actor, data, 'create')
  const actorName = typeof actor === 'object' && actor ? actor.name || 'User' : actor
  const newTarget: SalesTarget = {
    ...data,
    id: `tgt-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
    createdAt: getSystemNow().toISOString(),
  }

  targetsStore.update((list) => [newTarget, ...list])

  addAuditLog({
    action: 'Sales Target Created',
    actor: actorName,
    time: 'Just now',
    details: `Created sales target "${newTarget.name}" for ${newTarget.repName} (${newTarget.targetValue.toLocaleString()} EGP)`,
  })

  return newTarget
}

export function updateTarget(
  id: string,
  patch: Partial<Omit<SalesTarget, 'id' | 'createdAt'>>,
  actor: string | { id?: string; name?: string; role?: string } = 'Alex Morgan',
): boolean {
  const current = targetsStore.get().find((t) => t.id === id)
  if (current) {
    assertTargetMutationScope(actor, current, 'update')
  }

  let updated = false
  let targetName = id

  targetsStore.update((list) =>
    list.map((item) => {
      if (item.id === id) {
        updated = true
        targetName = item.name
        return {
          ...item,
          ...patch,
          updatedAt: getSystemNow().toISOString(),
        }
      }
      return item
    }),
  )

  const actorName = typeof actor === 'object' && actor ? actor.name || 'User' : actor
  if (updated) {
    addAuditLog({
      action: 'Sales Target Updated',
      actor: actorName,
      time: 'Just now',
      details: `Updated sales target "${targetName}"`,
    })
  }

  return updated
}

export function deleteTarget(
  id: string,
  actor: string | { id?: string; name?: string; role?: string } = 'Alex Morgan'
): boolean {
  const current = targetsStore.get()
  const found = current.find((t) => t.id === id)

  if (found) {
    assertTargetMutationScope(actor, found, 'delete')
    const actorName = typeof actor === 'object' && actor ? actor.name || 'User' : actor
    targetsStore.update((list) => list.filter((t) => t.id !== id))
    addAuditLog({
      action: 'Sales Target Deleted',
      actor: actorName,
      time: 'Just now',
      details: `Deleted sales target "${found.name}" (assigned to ${found.repName})`,
    })
    return true
  }

  return false
}

// Dynamic system reference date
export const SYSTEM_CURRENT_DATE = getSystemCurrentDate()

/**
 * Calculates progress automatically from live sales invoices and approved sales orders.
 * Never uses hardcoded progress values.
 */
export function calculateTargetProgress(
  target: SalesTarget,
  invoices: StoredInvoice[],
  salesOrders: SalesOrder[] = [],
  systemDate: string = SYSTEM_CURRENT_DATE,
): TargetProgressSummary {
  const repNameLower = target.repName.trim().toLowerCase()
  const startTs = new Date(target.startDate).getTime()
  // Include whole end date day by adding 23:59:59 if only date string
  const endTs = new Date(`${target.endDate}T23:59:59`).getTime()

  let invoiceSales = 0
  const countedOrderIds = new Set<string>()

  // 1. Invoices sales
  invoices.forEach((inv) => {
    if (inv.order_id) countedOrderIds.add(inv.order_id)
    // D-03 / D-06: exclude Rejected and needsReconciliation invoices entirely.
    if (inv.status === 'Rejected') return
    if (inv.needsReconciliation) return
    if (!inv.repName || inv.repName.trim().toLowerCase() !== repNameLower) return

    // D-07: if issueDate is missing, skip — do not invent a date.
    if (!inv.issueDate) return
    const invTs = new Date(inv.issueDate).getTime()

    if (invTs >= startTs && invTs <= endTs) {
      // D-06: use structured originalAmount only; no regex fallback.
      const amt =
        typeof inv.originalAmount === 'number' && Number.isFinite(inv.originalAmount) && inv.originalAmount > 0
          ? inv.originalAmount
          : 0
      invoiceSales += amt
    }
  })

  // 2. Approved or Dispatched Sales Orders not yet invoiced
  let orderSales = 0
  salesOrders.forEach((so) => {
    if (so.status !== 'Approved' && so.status !== 'Dispatched') return
    if (countedOrderIds.has(so.id)) return
    if (!so.repName || so.repName.trim().toLowerCase() !== repNameLower) return

    const orderDateStr = so.createdAt ? so.createdAt.slice(0, 10) : getSystemCurrentDate()
    const orderTs = new Date(orderDateStr).getTime()

    if (orderTs >= startTs && orderTs <= endTs) {
      orderSales += so.total || 0
    }
  })

  const achievedAmount = invoiceSales + orderSales
  const remainingAmount = Math.max(0, target.targetValue - achievedAmount)
  const percent = target.targetValue > 0 ? Math.round((achievedAmount / target.targetValue) * 100) : 0
  const isAchieved = achievedAmount >= target.targetValue

  const sysTs = new Date(systemDate).getTime()
  let daysLeft = 0
  if (endTs >= sysTs) {
    daysLeft = Math.ceil((endTs - sysTs) / (1000 * 60 * 60 * 24))
  }

  let status: TargetStatus = 'In Progress'
  if (isAchieved) {
    status = 'Achieved'
  } else if (endTs < sysTs) {
    status = 'Expired'
  }

  return {
    achievedAmount,
    remainingAmount,
    percent,
    isAchieved,
    daysLeft,
    status,
  }
}
