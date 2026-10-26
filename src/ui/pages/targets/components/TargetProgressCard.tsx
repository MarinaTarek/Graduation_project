import { ProgressRing } from '@/ui/design-system/components/ProgressRing'
import { useT } from '@/lib/i18n'
import { formatCurrency } from '@/lib/format'
import { targetsMockData } from '../mock-data'

export function TargetProgressCard() {
  const { t, lang } = useT()
  const salesStr = lang === 'ar' ? formatCurrency(targetsMockData.currentSalesVal, 'EGP', lang) : targetsMockData.currentSales
  const goalStr = lang === 'ar' ? formatCurrency(targetsMockData.targetGoalVal, 'EGP', lang) : targetsMockData.targetGoal
  const daysLeftStr = lang === 'ar' ? targetsMockData.daysLeft_ar : targetsMockData.daysLeft

  return (
    <div className="panel target-panel" style={{ textAlign: 'center' }}>
      <span className="eyebrow">{t('targets.progress.eyebrow')}</span>
      <h3 style={{ marginTop: '8px' }}>{t('targets.progress.title')}</h3>
      <ProgressRing percent={targetsMockData.overallPercent} />
      <div className="target-foot">
        <span>{salesStr} <small>{t('targets.progress.ofGoal', { goal: goalStr })}</small></span>
        <span className="green-text">{daysLeftStr}</span>
      </div>
    </div>
  )
}
