import { Users } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { useT } from '@/lib/i18n'
import { UserListTable } from './components/UserListTable'

export interface AdminUsersPageProps {
  initialTab?: 'all' | 'pending' | null
}

export default function AdminUsersPage({ initialTab }: AdminUsersPageProps) {
  const { t } = useT()
  const activeTab = initialTab === 'pending' ? 'pending' : 'all'
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Users /> {t('admin.users.eyebrow')}
          </span>
          <h1>{t('admin.users.title')}</h1>
          <p className="story">{t('admin.users.story')}</p>
        </div>
      </div>
      <div style={{ marginTop: '36px' }}>
        <UserListTable initialTab={activeTab} />
      </div>
      <EmptyState message={t('admin.users.emptyState')} />
    </section>
  )
}
