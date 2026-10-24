import { Settings2 } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { useT } from '@/lib/i18n'
import { SettingsForm } from './components/SettingsForm'

export default function AdminSettingsPage() {
  const { t } = useT()
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Settings2 /> {t('admin.settings.eyebrow')}
          </span>
          <h1>{t('admin.settings.title')}</h1>
          <p className="story">{t('admin.settings.story')}</p>
        </div>
      </div>
      <div style={{ marginTop: '36px' }}>
        <SettingsForm />
      </div>
      <EmptyState message={t('admin.settings.emptyState')} />
    </section>
  )
}
