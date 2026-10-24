import { visitsMockData, type VisitRecord } from '@/ui/pages/visits/mock-data'
import { addAuditLog } from './audit'
import { createStore } from './store'

export type StoredVisit = VisitRecord & { updated_at?: string }

export const visitsStore = createStore<StoredVisit[]>('visits', visitsMockData as StoredVisit[])

const now = () => new Date().toISOString()

export function addVisit(data: Omit<StoredVisit, 'updated_at'> & { id?: string }) {
  const visit: StoredVisit = {
    ...data,
    id: data.id ?? `V-${Date.now()}`,
    updated_at: now(),
  }
  visitsStore.update((list) => [visit, ...list])
  addAuditLog({
    action: 'Visit Added',
    actor: visit.repName || 'User',
    time: 'Just now',
    details: `Visit ${visit.id} with ${visit.clientName}`,
  })
  return visit
}

export function updateVisit(id: string, patch: Partial<StoredVisit>) {
  visitsStore.update((list) =>
    list.map((v) => (v.id === id ? { ...v, ...patch, updated_at: now() } : v)),
  )
}
