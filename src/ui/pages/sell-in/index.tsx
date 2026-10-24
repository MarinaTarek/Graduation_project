import { ArrowUpRight } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { useT } from '@/lib/i18n'
import { SellInMetrics } from './components/SellInMetrics'
import { SellInTable } from './components/SellInTable'

export default function SellInPage() {
  const { t } = useT()
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <ArrowUpRight /> {t('sellIn.eyebrow')}
          </span>
          <h1>{t('sellIn.title')}</h1>
          <p className="story">
            {t('sellIn.story')}
          </p>
        </div>
      </div>

      <div style={{ marginTop: '36px' }}>
        <SellInMetrics />
        <SellInTable />
      </div>

      <EmptyState message={t('sellIn.emptyState')} />
    </section>
  )
}
