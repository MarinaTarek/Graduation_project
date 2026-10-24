import { Users } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { UserListTable } from './components/UserListTable'

export interface AdminUsersPageProps {
  initialTab?: 'all' | 'pending' | null
}

export default function AdminUsersPage({ initialTab }: AdminUsersPageProps) {
  const activeTab = initialTab === 'pending' ? 'pending' : 'all'
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Users /> ACCESS CONTROL
          </span>
          <h1>User Management</h1>
          <p className="story">Manage field reps, supervisors, regional directors, and administrative accounts.</p>
        </div>
      </div>
      <div style={{ marginTop: '36px' }}>
        <UserListTable initialTab={activeTab} />
      </div>
      <EmptyState message="All team user accounts authenticated and active" />
    </section>
  )
}
