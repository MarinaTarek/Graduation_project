import { Target } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { TargetProgressCard } from './components/TargetProgressCard'
import { QuotaBreakdown } from './components/QuotaBreakdown'

export default function TargetsPage() {
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Target /> PERFORMANCE & QUOTA
          </span>
          <h1>Targets</h1>
          <p className="story">
            Pacing toward our quarterly benchmarks, region by region.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '36px' }}>
        <TargetProgressCard />
        <QuotaBreakdown />
      </div>

      <EmptyState message="All quota attributions reconciled" />
    </section>
  )
}
