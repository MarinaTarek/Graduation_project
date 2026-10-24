import { adminAuditLogMockData, type AuditRecord } from '@/ui/pages/admin/audit-log/mock-data'
import { createStore } from './store'

export const auditStore = createStore<AuditRecord[]>('audit', adminAuditLogMockData)

export function addAuditLog(entry: Omit<AuditRecord, 'id'> & { id?: string }) {
  auditStore.update((list) => {
    const id = entry.id ?? `LOG-${list.length + 410}`
    return [{ ...entry, id }, ...list]
  })
}
