import { ArrowUpRight } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { sellInSummary } from '../mock-data'

export function SellInMetrics() {
  const { t } = useT()
  return (
    <div className="panel chart-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t('sellIn.metrics.eyebrow')}</span>
          <h3>{t('sellIn.metrics.title')}</h3>
        </div>
      </div>
      <div className="chart-total">
        <strong>{sellInSummary.totalMonthlyRevenue}</strong>
        <span>
          <ArrowUpRight /> {sellInSummary.growthPercent} <small>{sellInSummary.comparedPeriod}</small>
        </span>
      </div>
      <p style={{ marginTop: '12px', color: 'var(--muted-text)', fontSize: '13px' }}>
        {t('sellIn.metrics.intakeLabel', { amount: sellInSummary.totalUnitsMoved })}
      </p>
    </div>
  )
}
