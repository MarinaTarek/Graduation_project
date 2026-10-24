import { Settings2 } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { SettingsForm } from './components/SettingsForm'

export default function AdminSettingsPage() {
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Settings2 /> SYSTEM PREFERENCES
          </span>
          <h1>Settings</h1>
          <p className="story">Global organization options, integrations, sync cadence, and localization.</p>
        </div>
      </div>
      <div style={{ marginTop: '36px' }}>
        <SettingsForm />
      </div>
      <EmptyState message="All settings saved to organization profile" />
    </section>
  )
}
