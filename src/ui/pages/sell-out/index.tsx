import { Activity } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { useT } from '@/lib/i18n'
import { SellOutMetrics } from './components/SellOutMetrics'
import { SellOutVelocity } from './components/SellOutVelocity'

export default function SellOutPage() {
  const { t } = useT()
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Activity /> {t('sellOut.eyebrow')}
          </span>
          <h1>{t('sellOut.title')}</h1>
          <p className="story">
            {t('sellOut.story')}
          </p>
        </div>
      </div>

      <div style={{ marginTop: '36px' }}>
        <SellOutMetrics />
        <SellOutVelocity />
      </div>

      <EmptyState message={t('sellOut.emptyState')} />
    </section>
  )
}
