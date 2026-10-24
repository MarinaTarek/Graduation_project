import { Target } from 'lucide-react'
import { ProgressRing } from '@/ui/design-system/components/ProgressRing'
import { formatCurrencyCompact } from '@/lib/format'

export function TargetPanel() {
  return (
    <section className="panel target-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">TEAM TARGET</span>
          <h3>On the way there</h3>
        </div>
        <Target />
      </div>
      <ProgressRing percent={78} label="of target" />
      <div className="target-foot">
        <span>
          {formatCurrencyCompact(240000)} <small>of {formatCurrencyCompact(310000)}</small>
        </span>
        <span className="green-text">+8.4%</span>
      </div>
    </section>
  )
}
