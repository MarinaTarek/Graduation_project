import { visitsMockData, type VisitRecord } from '@/ui/pages/visits/mock-data'
import { addAuditLog } from './audit'
import { createStore } from './store'
import { customersStore, type Customer } from './customers'
import { usersStore } from './users'
import { resolveCustomerId } from './customerResolution'
import { getSystemNow, getSystemCurrentDate } from '@/lib/dateUtils'

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

export function addVisit(data: Omit<StoredVisit, 'updated_at' | 'id'> & { id?: string }) {
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

  addAuditLog({
    action: 'Visit Added',
    actor: visit.repName || 'User',
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

export function updateVisit(id: string, patch: Partial<StoredVisit>) {
  visitsStore.update((list) =>
    list.map((v) => (v.id === id ? { ...v, ...patch, updated_at: now() } : v)),
  )
}

export function updateVisitStatus(id: string, newStatus: string, actor: string) {
  const visit = visitsStore.get().find((v) => v.id === id)
  if (!visit) {
    throw new Error(`Visit ${id} not found.`)
  }
  const current = visit.status
  const allowed = ALLOWED_VISIT_STATUS_TRANSITIONS[current] ?? []
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid visit status transition from ${current} to ${newStatus}.`)
  }

  updateVisit(id, { status: newStatus })

  // When completing a visit, propagate last_visit_date to customer record
  if (newStatus === 'Completed' && (visit.clientId || visit.doctorId)) {
    const targetId = visit.clientId || visit.doctorId
    const today = getSystemCurrentDate()
    customersStore.update((list) =>
      list.map((c) => (c.id === targetId ? { ...c, last_visit_date: today, updated_at: now() } : c))
    )
  }

  addAuditLog({
    action: 'Visit Status Updated',
    actor,
    time: 'Just now',
    details: `Visit ${id} status changed from ${current} to ${newStatus}`,
  })
}
