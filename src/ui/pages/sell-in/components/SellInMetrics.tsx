import { ArrowUpRight } from 'lucide-react'
import { sellInSummary } from '../mock-data'

export function SellInMetrics() {
  return (
    <div className="panel chart-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">DISTRIBUTOR DEMAND</span>
          <h3>Sell-in Revenue & Volume</h3>
        </div>
      </div>
      <div className="chart-total">
        <strong>{sellInSummary.totalMonthlyRevenue}</strong>
        <span>
          <ArrowUpRight /> {sellInSummary.growthPercent} <small>{sellInSummary.comparedPeriod}</small>
        </span>
      </div>
      <p style={{ marginTop: '12px', color: 'var(--muted-text)', fontSize: '13px' }}>
        Total distributor intake: <b>{sellInSummary.totalUnitsMoved}</b>
      </p>
    </div>
  )
}
