import { ProgressRing } from '@/ui/design-system/components/ProgressRing'
import { targetsMockData } from '../mock-data'

export function TargetProgressCard() {
  return (
    <div className="panel target-panel" style={{ textAlign: 'center' }}>
      <span className="eyebrow">MONTHLY RUN-RATE</span>
      <h3 style={{ marginTop: '8px' }}>Target Attainment</h3>
      <ProgressRing percent={targetsMockData.overallPercent} />
      <div className="target-foot">
        <span>{targetsMockData.currentSales} <small>of {targetsMockData.targetGoal}</small></span>
        <span className="green-text">{targetsMockData.daysLeft}</span>
      </div>
    </div>
  )
}
