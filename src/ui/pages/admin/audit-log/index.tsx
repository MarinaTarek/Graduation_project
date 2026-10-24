import { ClipboardCheck } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { useT } from '@/lib/i18n'
import { AuditFeed } from './components/AuditFeed'

export default function AdminAuditLogPage() {
  const { t } = useT()
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <ClipboardCheck /> {t('admin.audit.eyebrow')}
          </span>
          <h1>{t('admin.audit.title')}</h1>
          <p className="story">{t('admin.audit.story')}</p>
        </div>
      </div>
      <div style={{ marginTop: '36px' }}>
        <AuditFeed />
      </div>
      <EmptyState message={t('admin.audit.emptyState')} />
    </section>
  )
}
