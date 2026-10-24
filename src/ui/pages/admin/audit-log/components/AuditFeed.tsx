import { ClipboardCheck } from 'lucide-react'
import { auditStore } from '@/data/mock/audit'
import { useStore } from '@/data/mock/store'

export function AuditFeed() {
  const adminAuditLogMockData = useStore(auditStore)
  return (
    <div className="collection-list">
      {adminAuditLogMockData.map((log) => (
        <div key={log.id} className="collection-item">
          <div className="item-icon">
            <ClipboardCheck />
          </div>
          <div>
            <strong>{log.action} · {log.actor}</strong>
            <span>{log.details}</span>
          </div>
          <small style={{ color: 'var(--muted-text)', whiteSpace: 'nowrap' }}>{log.time}</small>
        </div>
      ))}
    </div>
  )
}
