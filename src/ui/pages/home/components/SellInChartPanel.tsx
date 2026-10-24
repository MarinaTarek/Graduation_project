import { Activity, ArrowUpRight } from 'lucide-react'

export interface SellInChartPanelProps {
  onClick?: () => void
}

export function SellInChartPanel({ onClick }: SellInChartPanelProps) {
  return (
    <section className="panel chart-panel" onClick={onClick}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">MOMENTUM</span>
          <h3>Sell-in vs sell-out</h3>
        </div>
        <Activity />
      </div>
      <div className="chart-total">
        <strong>$240,820</strong>
        <span>
          <ArrowUpRight /> 8.4% <small>vs last month</small>
        </span>
      </div>
      <div className="chart-wrap">
        <div className="chart-labels">
          <span>$300k</span>
          <span>$200k</span>
          <span>$100k</span>
          <span>$0</span>
        </div>
        <svg
          viewBox="0 0 660 190"
          preserveAspectRatio="none"
          role="img"
          aria-label="Sell-in versus sell-out"
        >
          <defs>
            <linearGradient id="areaBlue" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--ocean)" stopOpacity=".25" />
              <stop offset="1" stopColor="var(--ocean)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Gridlines */}
          <line x1="0" y1="45" x2="660" y2="45" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="0" y1="95" x2="660" y2="95" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="0" y1="145" x2="660" y2="145" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />
          <path
            d="M0 155 C55 148 68 119 120 128 S195 120 235 94 S306 104 350 82 S420 98 466 65 S540 72 585 40 S630 48 660 28 V190 H0Z"
            fill="url(#areaBlue)"
          />
          <path
            d="M0 155 C55 148 68 119 120 128 S195 120 235 94 S306 104 350 82 S420 98 466 65 S540 72 585 40 S630 48 660 28"
            fill="none"
            stroke="var(--ocean)"
            strokeWidth="2.5"
          />
        </svg>
        <div className="chart-months">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
        </div>
      </div>
    </section>
  )
}
