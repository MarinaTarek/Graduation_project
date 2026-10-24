import { MapPin } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { useT } from '@/lib/i18n'
import { TerritoryGrid } from './components/TerritoryGrid'

export default function AdminTerritoriesPage() {
  const { t } = useT()
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <MapPin /> {t('admin.territories.eyebrow')}
          </span>
          <h1>{t('admin.territories.title')}</h1>
          <p className="story">{t('admin.territories.story')}</p>
        </div>
      </div>
      <div style={{ marginTop: '36px' }}>
        <TerritoryGrid />
      </div>
      <EmptyState message={t('admin.territories.emptyState')} />
    </section>
  )
}
