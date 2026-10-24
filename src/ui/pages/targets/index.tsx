import { Target } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { useT } from '@/lib/i18n'
import { TargetProgressCard } from './components/TargetProgressCard'
import { QuotaBreakdown } from './components/QuotaBreakdown'

export default function TargetsPage() {
  const { t } = useT()
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Target /> {t('targets.eyebrow')}
          </span>
          <h1>{t('targets.title')}</h1>
          <p className="story">
            {t('targets.story')}
          </p>
        </div>
      </div>

      <div style={{ marginTop: '36px' }}>
        <TargetProgressCard />
        <QuotaBreakdown />
      </div>

      <EmptyState message={t('targets.emptyState')} />
    </section>
  )
}
