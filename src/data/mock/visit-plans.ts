import { createStore } from './store'
import { addAuditLog } from './audit'
import { addNotification } from './notifications'
import { usersStore, type StoredAdminUser } from './users'
import { validateVisitPlan } from './visitFrequency'
import {
  resolveApproverForRequest,
  validateApprovalAuthority,
  findAuthoritativeUser,
  type ApprovalHistoryRecord,
} from '@/lib/approval/approvalEngine'
import { getAuthorizedScope } from './dataScope'

export interface VisitPlanStop {
  id: string
  clientName: string
  clientId?: string
  address: string
  priority: string
  purpose: string
  plannedTime: string
  plannedDate?: string // YYYY-MM-DD
}

export type VisitPlanStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Active'
  | 'Completed'
  | 'Suspended'
  | 'Rejected'

export type VisitFrequency = 'Daily' | 'Weekly' | 'Bi-weekly' | 'Monthly'

export interface VisitPlan {
  id: string
  name: string
  repName: string
  repId?: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  frequency: VisitFrequency
  targetClients: string[]
  plannedProducts: string[]
  status: VisitPlanStatus
  stops: VisitPlanStop[]
  notes?: string
  updated_at?: string
  createdAt?: string
  createdBy?: string
  clientVisitCounts?: Record<string, number>
  rejectionReason?: string
  submittedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  managerId?: string
  assignedApproverId?: string
  assignedApproverName?: string
  assignedApproverRole?: string
  approvalHistory?: ApprovalHistoryRecord[]
}

const SEED_VISIT_PLANS: VisitPlan[] = [
  {
    id: 'VP-2401',
    name: 'North Territory Cardiology & Hospital Campaign',
    repName: 'Alex Morgan',
    repId: 'u-admin-1',
    startDate: '2026-10-01',
    endDate: '2026-11-30',
    frequency: 'Weekly',
    targetClients: ['Dr. Sarah Kim', 'Dr. Marcus Lee', 'Nile Hospital'],
    plannedProducts: ['Bevato', 'Naviro D3 50,000 IU'],
    status: 'Active',
    notes: 'Q4 focus on hospital formulary inclusion and clinical presentation of Bevato.',
    stops: [
      {
        id: 'stop-1',
        clientName: 'Dr. Sarah Kim',
        clientId: 'c-1',
        address: 'North Medical Center, Suite 402',
        priority: 'Class A',
        purpose: 'Bevato clinical review & sample delivery',
        plannedTime: '09:00 AM',
        plannedDate: '2026-11-23', // Today — triggers alarm on login
      },
      {
        id: 'stop-2',
        clientName: 'Nile Hospital',
        clientId: 'c-7',
        address: '88 Nile Corniche, North District',
        priority: 'Class A',
        purpose: 'Pharmacy committee formulary review',
        plannedTime: '11:30 AM',
        plannedDate: '2026-11-23', // Today
      },
      {
        id: 'stop-3',
        clientName: 'Dr. Marcus Lee',
        clientId: 'c-3',
        address: 'City Cardiology Associates',
        priority: 'Class B',
        purpose: 'Follow up on reconnect notice & dosage guidelines',
        plannedTime: '02:00 PM',
        plannedDate: '2026-11-24', // Tomorrow
      },
    ],
  },
  {
    id: 'VP-2402',
    name: 'West Region Pharmacy Restock & Consignment Audit',
    repName: 'Maya Patel',
    repId: 'rep-maya',
    startDate: '2026-10-15',
    endDate: '2026-12-15',
    frequency: 'Bi-weekly',
    targetClients: ['Green Cross Pharmacy', 'Wellness First', 'Pharm. Tarek Youssef'],
    plannedProducts: ['Naviro D3 Drops', 'Bevato'],
    status: 'Active',
    notes: 'Ensure pharmacy shelf availability and audit batch expiries.',
    stops: [
      {
        id: 'stop-4',
        clientName: 'Green Cross Pharmacy',
        clientId: 'c-2',
        address: '44 El Tahrir St, West District',
        priority: 'Class A',
        purpose: 'Restock validation & stock movement check',
        plannedTime: '10:00 AM',
        plannedDate: '2026-11-23', // Today
      },
      {
        id: 'stop-5',
        clientName: 'Wellness First',
        clientId: 'c-4',
        address: '20 Corniche Road, West District',
        priority: 'Class B',
        purpose: 'Consignment inventory reconciliation',
        plannedTime: '01:30 PM',
        plannedDate: '2026-11-25',
      },
    ],
  },
  {
    id: 'VP-2403',
    name: 'Central Pediatrics & Clinic Onboarding Plan',
    repName: 'Alex Morgan',
    repId: 'u-admin-1',
    startDate: '2026-11-01',
    endDate: '2026-12-31',
    frequency: 'Monthly',
    targetClients: ['Dr. Emily Watson', 'Nasr City Pediatric Clinic', 'Dr. Amina Khalil'],
    plannedProducts: ['Naviro D3 Drops', 'Naviro D3 10,000 IU'],
    status: 'Draft',
    notes: 'Pediatric expansion plan and introduction of vitamin drops.',
    stops: [
      {
        id: 'stop-6',
        clientName: 'Nasr City Pediatric Clinic',
        clientId: 'c-10',
        address: '15 Nasr City Blvd, Central District',
        priority: 'Class A',
        purpose: 'Initial introduction and sample trial drop-off',
        plannedTime: '11:00 AM',
        plannedDate: '2026-11-10',
      },
    ],
  },
]

export const visitPlansStore = createStore<VisitPlan[]>('visit_plans_v1', SEED_VISIT_PLANS)

const now = () => new Date().toISOString()

/**
 * Determines whether a patch to an approved/active plan contains material changes
 * affecting plan name, products, visit targets, target clients, or schedule.
 * Non-material changes (such as notes only) do not trigger re-approval.
 */
export function isMaterialPlanChange(existing: VisitPlan, patch: Partial<VisitPlan>): boolean {
  if (patch.name && patch.name.trim() !== existing.name.trim()) {
    return true
  }
  if (
    patch.targetClients &&
    (patch.targetClients.length !== existing.targetClients.length ||
      patch.targetClients.some((c) => !existing.targetClients.includes(c)))
  ) {
    return true
  }
  if (
    patch.plannedProducts &&
    (patch.plannedProducts.length !== existing.plannedProducts.length ||
      patch.plannedProducts.some((p) => !existing.plannedProducts.includes(p)))
  ) {
    return true
  }
  if (patch.startDate && patch.startDate !== existing.startDate) {
    return true
  }
  if (patch.endDate && patch.endDate !== existing.endDate) {
    return true
  }
  if (patch.frequency && patch.frequency !== existing.frequency) {
    return true
  }
  if (patch.clientVisitCounts) {
    const existingCounts = existing.clientVisitCounts || {}
    for (const key of Object.keys(patch.clientVisitCounts)) {
      if (patch.clientVisitCounts[key] !== existingCounts[key]) {
        return true
      }
    }
  }
  if (patch.stops) {
    if (patch.stops.length !== existing.stops.length) return true
    const normalizeStops = (stops: VisitPlanStop[]) =>
      stops.map((s) => `${s.id}|${s.clientName}|${s.plannedDate || ''}|${s.plannedTime}|${s.purpose}|${s.address}`).join(';')
    if (normalizeStops(patch.stops) !== normalizeStops(existing.stops)) {
      return true
    }
  }
  return false
}

function resolvePlanActor(actor: string | { id?: string; name?: string; role?: string; email?: string } = 'User') {
  let actorObj = typeof actor === 'object' && actor ? actor : null
  const authUser = findAuthoritativeUser(actor)
  return authUser || {
    id: actorObj?.id || `u-${(actorObj?.name || (typeof actor === 'string' ? actor : 'unknown')).toLowerCase().replace(/\s+/g, '-')}`,
    name: actorObj?.name || (typeof actor === 'string' ? actor : 'Unknown User'),
    role: (actorObj?.role || (typeof actor === 'string' && actor.toLowerCase().includes('admin') ? 'admin' : 'rep')) as any,
    businessUnit: (actorObj as any)?.businessUnit,
  }
}

function assertPlanMutationScope(
  actor: string | { id?: string; name?: string; role?: string; email?: string },
  plan: VisitPlan,
  operation: 'edit' | 'delete'
) {
  // If no specific actor passed or default 'User', allow legacy mock usage
  if (!actor || actor === 'User') return
  const actorUser = resolvePlanActor(actor)
  const scope = getAuthorizedScope(actorUser)

  if (scope.isCompanyWide) return

  if (scope.isMarketingOnly) {
    throw new Error(`Unauthorized: Marketing Managers cannot ${operation} medical visit plans.`)
  }

  const planRepId = (plan.repId || plan.createdBy || '').toLowerCase()
  const planRepName = (plan.repName || '').toLowerCase()

  if (actorUser.role === 'rep') {
    const isOwn =
      (planRepId && planRepId === actorUser.id.toLowerCase()) ||
      (planRepName && planRepName === actorUser.name.toLowerCase())
    if (!isOwn) {
      throw new Error(`Unauthorized: Medical Representatives can only ${operation} their own visit plans.`)
    }
    return
  }

  // FLM / BUM scope check
  const idMatch = planRepId && (scope.repIds as string[]).some((id) => id.toLowerCase() === planRepId)
  const nameMatch = planRepName && (scope.repNames as string[]).some((n) => n.toLowerCase() === planRepName)
  if (!idMatch && !nameMatch) {
    throw new Error(`Unauthorized: User "${actorUser.name}" (${actorUser.role}) cannot ${operation} visit plan "${plan.name}" outside their authorized organizational scope.`)
  }
}

export function addVisitPlan(data: Omit<VisitPlan, 'id' | 'updated_at'> & { id?: string }): VisitPlan {
  const at = now()
  const plan: VisitPlan = {
    ...data,
    id: data.id ?? `VP-${Date.now().toString().slice(-4)}-${Math.random().toString(36).slice(2, 5)}`,
    createdAt: data.createdAt ?? at,
    createdBy: data.createdBy ?? data.repId,
    updated_at: at,
  }
  visitPlansStore.update((list) => [plan, ...list])
  addAuditLog({
    action: 'Visit Plan Created',
    actor: plan.repName || 'User',
    time: 'Just now',
    details: `Created visit plan: ${plan.name} (${plan.status})`,
  })
  return plan
}

export function updateVisitPlan(
  id: string,
  patch: Partial<VisitPlan>,
  actor: string | { id?: string; name?: string; role?: string; email?: string } = 'User'
): VisitPlan {
  const at = now()
  const currentPlan = visitPlansStore.get().find((p) => p.id === id)
  if (!currentPlan) {
    throw new Error(`Visit plan ${id} not found.`)
  }

  const actorUser = resolvePlanActor(actor)
  assertPlanMutationScope(actor, currentPlan, 'edit')

  // Direct approval status escalation protection:
  // Status cannot be directly escalated to 'Approved' or 'Active' without approval authority
  if (
    (patch.status === 'Approved' || patch.status === 'Active') &&
    currentPlan.status !== 'Approved' &&
    currentPlan.status !== 'Active'
  ) {
    const hasAuth = actorUser.role === 'admin' || actorUser.role === 'business_unit_manager' || actorUser.role === 'first_line_manager'
    if (!hasAuth) {
      throw new Error('Unauthorized status update: Setting visit plan status to Approved requires manager approval.')
    }
  }

  let updatedPlan: VisitPlan | undefined

  visitPlansStore.update((list) =>
    list.map((p) => {
      if (p.id === id) {
        let effectivePatch = { ...patch }

        // Material change check on already approved/active plan:
        // Automatically reverts plan to 'Pending Approval', records approval history, and re-resolves direct approver
        if (
          (p.status === 'Approved' || p.status === 'Active') &&
          !patch.status &&
          isMaterialPlanChange(p, patch)
        ) {
          const resolved = resolveApproverForRequest(
            { id: p.repId || p.createdBy || actorUser.id, name: p.repName || actorUser.name },
            'visit_plan'
          )

          const historyEntry: ApprovalHistoryRecord = {
            action: 'Returned to Pending',
            actorId: actorUser.id,
            actorName: actorUser.name,
            actorRole: actorUser.role,
            previousStatus: p.status,
            newStatus: 'Pending Approval',
            timestamp: at,
            reason: 'Material modifications made to approved visit plan; resubmitted for manager re-approval.',
            assignedApproverId: resolved.approverId,
          }

          effectivePatch.status = 'Pending Approval'
          effectivePatch.reviewedAt = undefined
          effectivePatch.reviewedBy = undefined
          effectivePatch.assignedApproverId = resolved.approverId
          effectivePatch.assignedApproverName = resolved.approverName
          effectivePatch.assignedApproverRole = resolved.approverRole
          effectivePatch.approvalHistory = [...(p.approvalHistory || []), historyEntry]

          addAuditLog({
            action: 'Visit Plan Returned to Pending',
            actor: actorUser.name,
            time: 'Just now',
            details: `Material changes made to ${p.name} by ${actorUser.name}; plan returned to Pending Approval for ${resolved.approverName}.`,
          })

          addNotification({
            title: 'Visit Plan Resubmitted for Approval',
            title_ar: 'إعادة تقديم خطة الزيارات للاعتماد بعد التعديل',
            message: `Approved plan "${p.name}" was modified by ${actorUser.name} and returned to Pending Approval for ${resolved.approverName}.`,
            message_ar: `تم تعديل الخطة المعتمدة "${p.name}" بواسطة ${actorUser.name} وإعادتها لقيد الموافقة للمدير ${resolved.approverName}.`,
            category: 'system',
            priority: 'warning',
            time: 'Just now',
            targetPage: 'Visit plan',
            targetFilter: p.id,
            actionLabel: 'Review Plan',
            actionLabel_ar: 'مراجعة الخطة',
          })
        }

        updatedPlan = { ...p, ...effectivePatch, updated_at: at }
        return updatedPlan
      }
      return p
    })
  )

  if (!updatedPlan) {
    throw new Error(`Visit plan ${id} not found.`)
  }

  addAuditLog({
    action: 'Visit Plan Updated',
    actor: actorUser.name,
    time: 'Just now',
    details: `Updated visit plan: ${updatedPlan.name} (${updatedPlan.status})`,
  })

  return updatedPlan
}

export function deleteVisitPlan(
  id: string,
  actor: string | { id?: string; name?: string; role?: string; email?: string } = 'User'
) {
  const plan = visitPlansStore.get().find((p) => p.id === id)
  if (!plan) return

  assertPlanMutationScope(actor, plan, 'delete')
  const actorUser = resolvePlanActor(actor)

  visitPlansStore.update((list) => list.filter((p) => p.id !== id))
  addAuditLog({
    action: 'Visit Plan Deleted',
    actor: actorUser.name,
    time: 'Just now',
    details: `Deleted visit plan: ${plan.name} by ${actorUser.name}`,
  })
}

/**
 * Look up the direct manager for a representative using the user reporting hierarchy.
 * Returns null if no direct manager is configured on the user record.
 */
export function getDirectManagerForRep(repIdOrName: string): StoredAdminUser | null {
  const users = usersStore.get()
  const repUser = users.find(
    (u) =>
      u.id === repIdOrName ||
      u.name.toLowerCase() === repIdOrName.toLowerCase()
  )

  const managerId = (repUser as any)?.managerId
  if (managerId) {
    const directManager = users.find((u) => u.id === managerId)
    if (directManager) return directManager
  }

  // If no direct manager relationship is configured on user records, report null
  return null
}

export function submitVisitPlanForApproval(
  id: string,
  actorOrUser: string | { id?: string; name: string; role?: string } = 'User'
): VisitPlan {
  const actorName = typeof actorOrUser === 'string' ? actorOrUser : actorOrUser.name
  const actorId = typeof actorOrUser === 'string' ? undefined : actorOrUser.id
  const actorRole = typeof actorOrUser === 'string' ? 'rep' : (actorOrUser.role || 'rep')

  const plan = visitPlansStore.get().find((p) => p.id === id)
  if (!plan) throw new Error(`Visit plan ${id} not found.`)

  // Validate plan using configurable visit-frequency rules
  const validation = validateVisitPlan(plan)
  if (!validation.isValid) {
    const errorMsg = validation.feedbacks
      .filter((f) => f.status !== 'valid')
      .map((f) => f.messageEn)
      .join('; ')
    throw new Error(`Plan validation failed: ${errorMsg}`)
  }

  const at = now()
  const resolved = resolveApproverForRequest(
    { id: plan.repId || plan.createdBy || actorId, name: plan.repName || actorName },
    'visit_plan'
  )

  const historyEntry: ApprovalHistoryRecord = {
    action: 'Submitted',
    actorId: actorId || plan.repId || actorName,
    actorName,
    actorRole,
    previousStatus: plan.status,
    newStatus: 'Pending Approval',
    timestamp: at,
    assignedApproverId: resolved.approverId,
    reason: resolved.escalationReason,
  }

  const updated = updateVisitPlan(
    id,
    {
      status: 'Pending Approval',
      submittedAt: at,
      rejectionReason: undefined,
      assignedApproverId: resolved.approverId,
      assignedApproverName: resolved.approverName,
      assignedApproverRole: resolved.approverRole,
      approvalHistory: [...(plan.approvalHistory || []), historyEntry],
    },
    actorName
  )

  addNotification({
    title: resolved.escalated ? 'Visit Plan Escalated for Approval' : 'Visit Plan Submitted for Approval',
    title_ar: resolved.escalated ? 'تم تصعيد خطة زيارات للاعتماد' : 'تم إرسال خطة زيارات للموافقة',
    message: `${plan.repName} submitted visit plan "${plan.name}" for review by ${resolved.approverName}.`,
    message_ar: `قام ${plan.repName} بتقديم خطة الزيارات "${plan.name}" للمراجعة بواسطة ${resolved.approverName}.`,
    category: 'system',
    priority: 'warning',
    time: 'Just now',
    targetPage: 'Visit plan',
    targetFilter: plan.id,
    actionLabel: 'Review Plan',
    actionLabel_ar: 'مراجعة الخطة',
  })

  return updated
}

export function approveVisitPlan(
  id: string,
  actorUser: { name: string; role?: string; id?: string }
): VisitPlan {
  const plan = visitPlansStore.get().find((p) => p.id === id)
  if (!plan) throw new Error(`Visit plan ${id} not found.`)

  // Enforce authoritative role, hierarchy assignment, and self-approval protection
  const authCheck = validateApprovalAuthority(actorUser, {
    createdById: plan.repId || plan.createdBy,
    createdByName: plan.repName,
    assignedApproverId: plan.assignedApproverId,
    requestType: 'visit_plan',
  })
  if (!authCheck.valid || !authCheck.actor) {
    throw new Error(authCheck.error || 'Unauthorized approval attempt.')
  }

  // Prevent duplicate approval actions
  if (plan.status === 'Approved' || plan.status === 'Active') {
    throw new Error('Plan is already approved.')
  }

  // Revalidate visit plan before manager approval
  const validation = validateVisitPlan(plan)
  if (!validation.isValid) {
    const errorMsg = validation.feedbacks
      .filter((f) => f.status !== 'valid')
      .map((f) => f.messageEn)
      .join('; ')
    throw new Error(`Approval blocked: Revalidation failed because visit targets have changed: ${errorMsg}`)
  }

  const at = now()
  const historyEntry: ApprovalHistoryRecord = {
    action: 'Approved',
    actorId: authCheck.actor.id,
    actorName: authCheck.actor.name,
    actorRole: authCheck.actor.role,
    previousStatus: plan.status,
    newStatus: 'Approved',
    timestamp: at,
    assignedApproverId: plan.assignedApproverId,
  }

  const updated = updateVisitPlan(
    id,
    {
      status: 'Approved',
      reviewedAt: at,
      reviewedBy: authCheck.actor.name,
      rejectionReason: undefined,
      approvalHistory: [...(plan.approvalHistory || []), historyEntry],
    },
    authCheck.actor.name
  )

  addNotification({
    title: 'Visit Plan Approved',
    title_ar: 'تم اعتماد خطة الزيارات',
    message: `Your visit plan "${plan.name}" has been approved by ${authCheck.actor.name}.`,
    message_ar: `تمت الموافقة على خطة الزيارات "${plan.name}" بواسطة ${authCheck.actor.name}.`,
    category: 'system',
    priority: 'info',
    time: 'Just now',
    targetPage: 'Visit plan',
    targetFilter: plan.id,
    actionLabel: 'View Plan',
    actionLabel_ar: 'عرض الخطة',
  })

  return updated
}

export function rejectVisitPlan(
  id: string,
  reason: string,
  actorUser: { name: string; role?: string; id?: string }
): VisitPlan {
  const plan = visitPlansStore.get().find((p) => p.id === id)
  if (!plan) throw new Error(`Visit plan ${id} not found.`)

  if (!reason || !reason.trim()) {
    throw new Error('A rejection reason is required.')
  }

  // Enforce authoritative role, hierarchy assignment, and self-rejection protection
  const authCheck = validateApprovalAuthority(actorUser, {
    createdById: plan.repId || plan.createdBy,
    createdByName: plan.repName,
    assignedApproverId: plan.assignedApproverId,
    requestType: 'visit_plan',
  })
  if (!authCheck.valid || !authCheck.actor) {
    throw new Error(authCheck.error || 'Unauthorized rejection attempt.')
  }

  // Prevent duplicate actions
  if (plan.status === 'Rejected') {
    throw new Error('Plan is already rejected.')
  }

  const at = now()
  const trimmedReason = reason.trim()
  const historyEntry: ApprovalHistoryRecord = {
    action: 'Rejected',
    actorId: authCheck.actor.id,
    actorName: authCheck.actor.name,
    actorRole: authCheck.actor.role,
    previousStatus: plan.status,
    newStatus: 'Rejected',
    timestamp: at,
    reason: trimmedReason,
    assignedApproverId: plan.assignedApproverId,
  }

  const updated = updateVisitPlan(
    id,
    {
      status: 'Rejected',
      rejectionReason: trimmedReason,
      reviewedAt: at,
      reviewedBy: authCheck.actor.name,
      approvalHistory: [...(plan.approvalHistory || []), historyEntry],
    },
    authCheck.actor.name
  )

  addNotification({
    title: 'Visit Plan Rejected',
    title_ar: 'تم رفض خطة الزيارات',
    message: `Your visit plan "${plan.name}" was rejected by ${authCheck.actor.name}. Reason: ${trimmedReason}`,
    message_ar: `تم رفض خطة الزيارات "${plan.name}" بواسطة ${authCheck.actor.name}. السبب: ${trimmedReason}`,
    category: 'system',
    priority: 'warning',
    time: 'Just now',
    targetPage: 'Visit plan',
    targetFilter: plan.id,
    actionLabel: 'Review & Edit',
    actionLabel_ar: 'مراجعة وتعديل',
  })

  return updated
}

// ── Planned Visits Calendar Derivation ──────────────────────────────────────

export interface PlannedCalendarEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time?: string
  type: 'planned_visit'
  repName: string
  repId?: string
  clientName: string
  clientId?: string
  status: string
  detail: string
  notes?: string
  rawItem: VisitPlanStop
  planId: string
  planName: string
  stopId: string
  priority?: string
  purpose?: string
  isPlannedVisit: true
}

function parseIso(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  try {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  } catch {
    // fallback
  }
  return dateStr
}

/**
 * Derives calendar events dynamically from Visit Plans following strict status rules:
 * - Draft / Pending Approval: Hidden (generate 0 entries)
 * - Approved / Active: Visible (every scheduled visit appears on its scheduled date)
 * - Completed: Keep completed visits visible with completed status
 * - Suspended / Rejected: Remove upcoming visits (only completed past visits remain)
 * - Uses stable Visit Plan IDs and scheduled visit IDs: vp-${plan.id}-${stop.id}
 */
export function deriveCalendarEntriesFromVisitPlans(
  plans: VisitPlan[],
  referenceDateStr?: string
): PlannedCalendarEvent[] {
  const refDate = referenceDateStr || new Date().toISOString().slice(0, 10)
  const events: PlannedCalendarEvent[] = []

  for (const plan of plans) {
    // Rule: Draft and Pending Approval plans are hidden
    if (plan.status === 'Draft' || plan.status === 'Pending Approval') {
      continue
    }

    if (!plan.stops || plan.stops.length === 0) {
      continue
    }

    for (const stop of plan.stops) {
      const stopDate = parseIso(stop.plannedDate || plan.startDate)
      const isStopCompleted = (stop as any).status === 'Completed' || (stop as any).completed === true

      // Rule: Suspended and Rejected plans have no upcoming active entries
      if (plan.status === 'Suspended' || plan.status === 'Rejected') {
        if (!isStopCompleted) {
          continue
        }
      }

      // Rule: Completed plans keep completed visits visible with completed status
      let eventStatus: string
      if (plan.status === 'Completed') {
        eventStatus = 'Completed'
      } else if (isStopCompleted) {
        eventStatus = 'Completed'
      } else {
        eventStatus = plan.status // 'Approved' or 'Active'
      }

      events.push({
        id: `vp-${plan.id}-${stop.id}`,
        title: `${stop.clientName} · ${stop.purpose || plan.name}`,
        date: stopDate,
        time: stop.plannedTime,
        type: 'planned_visit',
        repName: plan.repName,
        repId: plan.repId,
        clientName: stop.clientName,
        clientId: stop.clientId,
        status: eventStatus,
        detail: stop.purpose ? `${plan.name} — ${stop.purpose}` : plan.name,
        notes: plan.notes,
        rawItem: stop,
        planId: plan.id,
        planName: plan.name,
        stopId: stop.id,
        priority: stop.priority,
        purpose: stop.purpose,
        isPlannedVisit: true,
      })
    }
  }

  return events
}

// ============================================================================
// Phase 2 - 9.5: Manager Reassignment Workflow
// ============================================================================

export interface ManagerReassignmentRecord {
  id: string
  repId: string
  repName: string
  previousManagerId?: string
  previousManagerName?: string
  newManagerId: string
  newManagerName: string
  newManagerRole: string
  reassignedBy: string
  reassignedAt: string
  reassignedPlansCount: number
  notes?: string
}

export const managerReassignmentsStore = createStore<ManagerReassignmentRecord[]>(
  'manager_reassignments',
  []
)

/**
 * Reassigns a medical representative to a new active manager.
 * Only authorized Administrators can execute reassignment.
 * Reassigns all currently Pending Approval plans belonging to the representative
 * to the new active manager, appending to their approval history without deleting requests.
 */
export function reassignRepresentativeManager(
  repId: string,
  newManagerId: string,
  adminActor: string | { id?: string; name?: string; role?: string },
  options?: { notes?: string; reassignPendingPlans?: boolean }
): ManagerReassignmentRecord {
  const authUser = findAuthoritativeUser(adminActor)
  const actorRole = authUser?.role || (typeof adminActor === 'object' && adminActor?.role ? adminActor.role : 'rep')
  const actorName = authUser?.name || (typeof adminActor === 'object' && adminActor?.name ? adminActor.name : typeof adminActor === 'string' ? adminActor : 'Admin')

  if (actorRole !== 'admin') {
    throw new Error(`Unauthorized: User "${actorName}" (${actorRole}) cannot reassign managers. Only Executive Administrators are authorized.`)
  }

  const rep = findAuthoritativeUser(repId)
  if (!rep) throw new Error(`Representative ${repId} not found in authoritative directory.`)

  const newMgr = findAuthoritativeUser(newManagerId)
  if (!newMgr) throw new Error(`New manager ${newManagerId} not found in authoritative directory.`)
  if ((newMgr.status || '').toLowerCase() !== 'active') {
    throw new Error(`Cannot assign manager "${newMgr.name}": Manager account is inactive or disabled.`)
  }

  const at = now()
  const prevManager = rep.managerId ? findAuthoritativeUser(rep.managerId) : undefined

  // 1. Update representative's profile in usersStore
  usersStore.update((list) =>
    list.map((u) => (u.id === rep.id ? { ...u, managerId: newMgr.id, updated_at: at } : u))
  )

  let affectedPlansCount = 0
  const shouldReassignPlans = options?.reassignPendingPlans !== false

  if (shouldReassignPlans) {
    // 2. Explicitly reassign pending plans belonging to this representative
    visitPlansStore.update((plans) =>
      plans.map((p) => {
        if ((p.repId === rep.id || p.repName === rep.name) && p.status === 'Pending Approval') {
          affectedPlansCount++
          const historyEntry: ApprovalHistoryRecord = {
            action: 'Manager Reassigned',
            actorId: authUser?.id || 'admin',
            actorName,
            actorRole: 'admin',
            previousStatus: 'Pending Approval',
            newStatus: 'Pending Approval',
            timestamp: at,
            reason: `Direct manager reassigned from ${prevManager?.name || 'Unassigned'} to ${newMgr.name} by ${actorName}. ${options?.notes || ''}`.trim(),
            assignedApproverId: newMgr.id,
          }
          return {
            ...p,
            managerId: newMgr.id,
            assignedApproverId: newMgr.id,
            assignedApproverName: newMgr.name,
            assignedApproverRole: newMgr.role,
            approvalHistory: [...(p.approvalHistory || []), historyEntry],
            updated_at: at,
          }
        }
        return p
      })
    )
  }

  const record: ManagerReassignmentRecord = {
    id: `mrr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    repId: rep.id,
    repName: rep.name,
    previousManagerId: prevManager?.id,
    previousManagerName: prevManager?.name,
    newManagerId: newMgr.id,
    newManagerName: newMgr.name,
    newManagerRole: newMgr.role,
    reassignedBy: actorName,
    reassignedAt: at,
    reassignedPlansCount: affectedPlansCount,
    notes: options?.notes,
  }

  managerReassignmentsStore.update((list) => [record, ...list])

  addAuditLog({
    action: 'Manager Reassigned',
    actor: actorName,
    time: 'Just now',
    details: `Reassigned reporting manager for ${rep.name} from ${prevManager?.name || 'None'} to ${newMgr.name} (${newMgr.role}) by ${actorName}. Reassigned ${affectedPlansCount} pending plan(s).`,
  })

  addNotification({
    title: 'Manager Reassigned',
    title_ar: 'إعادة تعيين المدير المباشر',
    message: `Representative ${rep.name} reassigned to ${newMgr.name}. ${affectedPlansCount} pending plan(s) routed for approval.`,
    message_ar: `تم إعادة تعيين المندوب ${rep.name} للمدير ${newMgr.name}. تم توجيه ${affectedPlansCount} خطة معلقة.`,
    category: 'system',
    priority: 'info',
    time: 'Just now',
    targetPage: 'Visit plan',
  })

  return record
}


