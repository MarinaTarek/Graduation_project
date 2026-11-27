import { visitsMockData, type VisitRecord } from '@/ui/pages/visits/mock-data'
import { addAuditLog } from './audit'
import { createStore } from './store'
import { customersStore, type Customer } from './customers'
import { usersStore } from './users'
import { resolveCustomerId } from './customerResolution'
import { getSystemNow, getSystemCurrentDate } from '@/lib/dateUtils'
import { addNotification } from './notifications'
import { findAuthoritativeUser } from '@/lib/approval/approvalEngine'
import { getAuthorizedScope } from './dataScope'

export interface JointVisitInvitation {
  id: string
  visitId: string
  primaryRepId: string
  primaryRepName: string
  invitedRepId: string
  invitedRepName: string
  clientName: string
  date: string
  time: string
  status: 'Pending' | 'Accepted' | 'Rejected'
  createdAt: string
  respondedAt?: string
  rejectionReason?: string
}

export const jointVisitInvitationsStore = createStore<JointVisitInvitation[]>(
  'joint_visit_invitations',
  []
)

export type StoredVisit = VisitRecord & {
  updated_at?: string
  doctorId?: string
  clientId?: string
  repId?: string
  productCodes?: string[]
}

const SEED_REP_MAP: Record<string, string> = {
  'alex morgan': 'u-admin-1',
  'ahmed samir': 'u-rep-1',
  'sara ali': 'u-rep-2',
  'olivia martin': 'u-rep-olivia',
  'maya patel': 'u-rep-maya',
  'james wilson': 'u-rep-james',
  'sofia chen': 'u-rep-sofia',
}

// Seed visits enriched with canonical clientId and repId
const enrichedSeedVisits: StoredVisit[] = (visitsMockData as StoredVisit[]).map((v) => {
  const custRes = resolveCustomerId(v.clientId || v.doctorId, v.clientName)
  const repId = v.repId || SEED_REP_MAP[v.repName?.toLowerCase() || ''] || 'u-admin-1'
  return {
    ...v,
    clientId: v.clientId || v.doctorId || custRes.customerId,
    doctorId: v.doctorId || v.clientId || custRes.customerId,
    repId,
  }
})

export const visitsStore = createStore<StoredVisit[]>('visits', enrichedSeedVisits)

const now = () => getSystemNow().toISOString()

export function assertVisitMutationScope(
  actor: string | { id?: string; name?: string; role?: string; email?: string } | undefined,
  visitData: Partial<StoredVisit>,
  operation: 'add' | 'edit' | 'status_update' | 'delete'
) {
  if (!actor || actor === 'User') return
  const authUser = findAuthoritativeUser(actor)
  const actorObj = typeof actor === 'object' && actor ? actor : null
  const actorUser = authUser || {
    id: actorObj?.id || `u-${(actorObj?.name || (typeof actor === 'string' ? actor : 'unknown')).toLowerCase().replace(/\s+/g, '-')}`,
    name: actorObj?.name || (typeof actor === 'string' ? actor : 'Unknown User'),
    role: (actorObj?.role || (typeof actor === 'string' && actor.toLowerCase().includes('admin') ? 'admin' : 'rep')) as any,
    businessUnit: (actorObj as any)?.businessUnit,
  }

  const scope = getAuthorizedScope(actorUser)
  if (scope.isCompanyWide) return

  if (scope.isMarketingOnly) {
    throw new Error(`Unauthorized visit mutation: Marketing Managers are restricted from performing ${operation} operations on visit records.`)
  }

  const visitRepId = (visitData.repId || '').toLowerCase()
  const visitRepName = (visitData.repName || '').toLowerCase()
  const jointRepId = (visitData.jointRepId || '').toLowerCase()
  const jointRepName = (visitData.jointRepName || '').toLowerCase()

  if (actorUser.role === 'rep') {
    const isOwn =
      (visitRepId && visitRepId === actorUser.id.toLowerCase()) ||
      (visitRepName && visitRepName === actorUser.name.toLowerCase()) ||
      (jointRepId && jointRepId === actorUser.id.toLowerCase()) ||
      (jointRepName && jointRepName === actorUser.name.toLowerCase())
    if (!isOwn) {
      throw new Error(`Unauthorized visit mutation: Medical Representatives can only ${operation} their own scheduled or joint visits.`)
    }
    return
  }

  // FLM / BUM scope check
  const idMatch =
    (visitRepId && (scope.repIds as string[]).some((id) => id.toLowerCase() === visitRepId)) ||
    (jointRepId && (scope.repIds as string[]).some((id) => id.toLowerCase() === jointRepId))
  const nameMatch =
    (visitRepName && (scope.repNames as string[]).some((n) => n.toLowerCase() === visitRepName)) ||
    (jointRepName && (scope.repNames as string[]).some((n) => n.toLowerCase() === jointRepName))

  if (!idMatch && !nameMatch) {
    throw new Error(`Unauthorized visit mutation: User "${actorUser.name}" (${actorUser.role}) cannot ${operation} visit "${visitData.id || ''}" outside their authorized organizational scope.`)
  }
}

export function addVisit(
  data: Omit<StoredVisit, 'updated_at' | 'id'> & { id?: string },
  actor?: string | { id?: string; name?: string; role?: string }
) {
  if (actor) {
    assertVisitMutationScope(actor, data, 'add')
  }

  // Resolve canonical clientId
  let clientId = data.clientId || data.doctorId
  if (!clientId && data.clientName) {
    const existing = customersStore.get().find(
      (c) => c.name.toLowerCase() === data.clientName.toLowerCase()
    )
    if (existing?.id) {
      clientId = existing.id
    } else {
      const resolved = resolveCustomerId(undefined, data.clientName)
      clientId = resolved.customerId
    }
  }

  // Resolve canonical repId
  let repId = data.repId
  if (!repId && data.repName) {
    const user = usersStore.get().find((u) => u.name.toLowerCase() === data.repName.toLowerCase())
    repId = user?.id || 'u-admin-1'
  }

  // Validate customer active
  if (clientId) {
    const customer = customersStore.get().find((c) => c.id === clientId)
    if (customer && (customer.deleted_at || customer.status === 'Archived' || customer.active === false)) {
      throw new Error(`Cannot schedule or record visit: Customer ${customer.name} (${clientId}) is inactive or archived.`)
    }
  }

  const visit: StoredVisit = {
    ...data,
    id: data.id ?? `V-${Date.now()}`,
    clientId: clientId || `c-generic`,
    doctorId: clientId || `c-generic`,
    repId: repId || 'u-admin-1',
    updated_at: now(),
  }

  visitsStore.update((list) => [visit, ...list])

  // Propagate completion to customer last_visit_date
  if (visit.status === 'Completed' && visit.clientId) {
    const visitIsoDate = visit.date.includes('-')
      ? visit.date
      : getSystemCurrentDate()
    customersStore.update((list) =>
      list.map((c) =>
        c.id === visit.clientId ? { ...c, last_visit_date: visitIsoDate, updated_at: now() } : c
      )
    )
  }

  const actorName = typeof actor === 'object' && actor ? actor.name || 'User' : (actor || visit.repName || 'User')
  addAuditLog({
    action: 'Visit Added',
    actor: actorName,
    time: 'Just now',
    details: `Visit ${visit.id} with ${visit.clientName}`,
  })

  return visit
}

export const ALLOWED_VISIT_STATUS_TRANSITIONS: Record<string, string[]> = {
  Draft: ['Planned', 'Cancelled'],
  Planned: ['In Progress', 'Completed', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
  Completed: [], // Final status
  Cancelled: [], // Final status
}

export function updateVisit(
  id: string,
  patch: Partial<StoredVisit>,
  actor?: string | { id?: string; name?: string; role?: string }
) {
  const current = visitsStore.get().find((v) => v.id === id)
  if (current && actor) {
    assertVisitMutationScope(actor, current, 'edit')
  }

  visitsStore.update((list) =>
    list.map((v) => (v.id === id ? { ...v, ...patch, updated_at: now() } : v)),
  )
}

export function updateVisitStatus(
  id: string,
  newStatus: string,
  actor: string | { id?: string; name?: string; role?: string }
) {
  const visit = visitsStore.get().find((v) => v.id === id)
  if (!visit) {
    throw new Error(`Visit ${id} not found.`)
  }

  if (actor) {
    assertVisitMutationScope(actor, visit, 'status_update')
  }

  const current = visit.status
  const allowed = ALLOWED_VISIT_STATUS_TRANSITIONS[current] ?? []
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid visit status transition from ${current} to ${newStatus}.`)
  }

  updateVisit(id, { status: newStatus }, actor)

  // When completing a visit, propagate last_visit_date to customer record
  if (newStatus === 'Completed' && (visit.clientId || visit.doctorId)) {
    const targetId = visit.clientId || visit.doctorId
    const today = getSystemCurrentDate()
    customersStore.update((list) =>
      list.map((c) => (c.id === targetId ? { ...c, last_visit_date: today, updated_at: now() } : c))
    )
  }

  const actorName = typeof actor === 'object' && actor ? actor.name || 'User' : (actor || 'User')
  addAuditLog({
    action: 'Visit Status Updated',
    actor: actorName,
    time: 'Just now',
    details: `Visit ${id} status changed from ${current} to ${newStatus}`,
  })
}

export function createJointVisitInvitation(params: {
  visitId: string
  primaryRepId: string
  primaryRepName: string
  invitedRepId: string
  invitedRepName: string
  clientName: string
  date: string
  time: string
}): JointVisitInvitation {
  const existing = jointVisitInvitationsStore.get().find((inv) => inv.visitId === params.visitId)
  if (existing) {
    return existing
  }

  const invitation: JointVisitInvitation = {
    id: `jvi-${Date.now()}`,
    visitId: params.visitId,
    primaryRepId: params.primaryRepId,
    primaryRepName: params.primaryRepName,
    invitedRepId: params.invitedRepId,
    invitedRepName: params.invitedRepName,
    clientName: params.clientName,
    date: params.date,
    time: params.time,
    status: 'Pending',
    createdAt: now(),
  }

  jointVisitInvitationsStore.update((list) => [invitation, ...list])

  // Update visit with invitationId and initial status
  updateVisit(params.visitId, {
    isDoubleVisit: true,
    jointRepId: params.invitedRepId,
    jointRepName: params.invitedRepName,
    jointVisitStatus: 'Pending',
    invitationId: invitation.id,
  })

  // In-app notification to the invited representative
  addNotification({
    title: 'Joint Visit Invitation',
    title_ar: 'دعوة لزيارة مشتركة (Double Visit)',
    message: `${params.primaryRepName} invited you to a joint visit with ${params.clientName} on ${params.date}.`,
    message_ar: `قام المندوب ${params.primaryRepName} بدعوتك لزيارة مشتركة مع ${params.clientName} بتاريخ ${params.date}.`,
    category: 'system',
    priority: 'info',
    time: 'Just now',
    targetPage: 'Visits',
    targetFilter: params.visitId,
    actionLabel: 'Review Invitation',
    actionLabel_ar: 'مراجعة الدعوة',
  })

  addAuditLog({
    action: 'Joint Visit Invited',
    actor: params.primaryRepName,
    time: 'Just now',
    details: `Invited ${params.invitedRepName} to double visit ${params.visitId} with ${params.clientName}`,
  })

  return invitation
}

export function respondToJointVisitInvitation(
  invitationIdOrVisitId: string,
  response: 'Accepted' | 'Rejected',
  actor: string,
  reason?: string
) {
  const inv = jointVisitInvitationsStore.get().find(
    (i) => i.id === invitationIdOrVisitId || i.visitId === invitationIdOrVisitId
  )
  if (!inv) {
    throw new Error(`Invitation ${invitationIdOrVisitId} not found.`)
  }

  if (inv.status !== 'Pending') {
    throw new Error(`Invitation is already ${inv.status}. Repeated responses are not allowed.`)
  }

  const respondedAt = now()
  jointVisitInvitationsStore.update((list) =>
    list.map((i) =>
      i.id === inv.id
        ? {
            ...i,
            status: response,
            respondedAt,
            rejectionReason: reason || undefined,
          }
        : i
    )
  )

  // Update visit participation status
  updateVisit(inv.visitId, {
    jointVisitStatus: response,
  })

  // In-app notification back to primary representative
  addNotification({
    title: response === 'Accepted' ? 'Joint Visit Accepted' : 'Joint Visit Rejected',
    title_ar: response === 'Accepted' ? 'تم قبول الزيارة المشتركة' : 'تم رفض الزيارة المشتركة',
    message: `${inv.invitedRepName} ${response.toLowerCase()} your joint visit invitation for ${inv.clientName}.${reason ? ` Reason: ${reason}` : ''}`,
    message_ar: `${inv.invitedRepName} قام بـ ${response === 'Accepted' ? 'قبول' : 'رفض'} دعوتك للزيارة المشتركة مع ${inv.clientName}.${reason ? ` السبب: ${reason}` : ''}`,
    category: 'system',
    priority: response === 'Accepted' ? 'info' : 'warning',
    time: 'Just now',
    targetPage: 'Visits',
    targetFilter: inv.visitId,
    actionLabel: 'View Visit',
    actionLabel_ar: 'عرض الزيارة',
  })

  addAuditLog({
    action: `Joint Visit ${response}`,
    actor,
    time: 'Just now',
    details: `${actor} ${response.toLowerCase()} joint visit invitation for visit ${inv.visitId}`,
  })
}
