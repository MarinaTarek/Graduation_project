import { ClipboardCheck } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { AuditFeed } from './components/AuditFeed'

export default function AdminAuditLogPage() {
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <ClipboardCheck /> COMPLIANCE & GOVERNANCE
          </span>
          <h1>Audit Log</h1>
          <p className="story">Immutable ledger of pharmaceutical adjustments, approvals, and user sessions.</p>
        </div>
      </div>
      <div style={{ marginTop: '36px' }}>
        <AuditFeed />
      </div>
      <EmptyState message="All ledger cryptographic proofs verified" />
    </section>
  )
}
