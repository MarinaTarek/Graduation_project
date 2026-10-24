import { useState } from 'react'
import { ArrowLeft, Settings2 } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { AdminNavCards } from './components/AdminNavCards'
import AdminUsersPage from './users'
import AdminProductsPage from './products'
import AdminTerritoriesPage from './territories'
import AdminAuditLogPage from './audit-log'
import AdminSettingsPage from './settings'

export interface AdminPageProps {
  initialSubpage?: string
}

export default function AdminPage({ initialSubpage }: AdminPageProps) {
  const [selected, setSelected] = useState<string | null>(initialSubpage || null)

  if (selected === 'users') {
    return (
      <div>
        <div style={{ padding: '24px 32px 0' }}>
          <Button variant="text" onClick={() => setSelected(null)}>
            <ArrowLeft /> Back to Admin
          </Button>
        </div>
        <AdminUsersPage />
      </div>
    )
  }

  if (selected === 'products') {
    return (
      <div>
        <div style={{ padding: '24px 32px 0' }}>
          <Button variant="text" onClick={() => setSelected(null)}>
            <ArrowLeft /> Back to Admin
          </Button>
        </div>
        <AdminProductsPage />
      </div>
    )
  }

  if (selected === 'territories') {
    return (
      <div>
        <div style={{ padding: '24px 32px 0' }}>
          <Button variant="text" onClick={() => setSelected(null)}>
            <ArrowLeft /> Back to Admin
          </Button>
        </div>
        <AdminTerritoriesPage />
      </div>
    )
  }

  if (selected === 'audit-log') {
    return (
      <div>
        <div style={{ padding: '24px 32px 0' }}>
          <Button variant="text" onClick={() => setSelected(null)}>
            <ArrowLeft /> Back to Admin
          </Button>
        </div>
        <AdminAuditLogPage />
      </div>
    )
  }

  if (selected === 'settings') {
    return (
      <div>
        <div style={{ padding: '24px 32px 0' }}>
          <Button variant="text" onClick={() => setSelected(null)}>
            <ArrowLeft /> Back to Admin
          </Button>
        </div>
        <AdminSettingsPage />
      </div>
    )
  }

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Settings2 /> CONTROL CENTER
          </span>
          <h1>Admin</h1>
          <p className="story">
            Administrative consoles for managing users, drug formulations, territories, audit logs, and settings.
          </p>
        </div>
      </div>

      <AdminNavCards onSelect={setSelected} />
    </section>
  )
}
