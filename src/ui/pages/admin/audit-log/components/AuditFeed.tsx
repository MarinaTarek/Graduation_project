import { ClipboardCheck } from 'lucide-react'
import { adminAuditLogMockData } from '../mock-data'

export function AuditFeed() {
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
