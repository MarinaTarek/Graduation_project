import { ProgressRing } from '@/ui/design-system/components/ProgressRing'
import { useT } from '@/lib/i18n'
import { targetsMockData } from '../mock-data'

export function TargetProgressCard() {
  const { t } = useT()
  return (
    <div className="panel target-panel" style={{ textAlign: 'center' }}>
      <span className="eyebrow">{t('targets.progress.eyebrow')}</span>
      <h3 style={{ marginTop: '8px' }}>{t('targets.progress.title')}</h3>
      <ProgressRing percent={targetsMockData.overallPercent} />
      <div className="target-foot">
        <span>{targetsMockData.currentSales} <small>{t('targets.progress.ofGoal', { goal: targetsMockData.targetGoal })}</small></span>
        <span className="green-text">{targetsMockData.daysLeft}</span>
      </div>
    </div>
  )
}
