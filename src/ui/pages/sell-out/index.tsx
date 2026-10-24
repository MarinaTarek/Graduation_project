import { Activity } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { SellOutMetrics } from './components/SellOutMetrics'
import { SellOutVelocity } from './components/SellOutVelocity'

export default function SellOutPage() {
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Activity /> RETAIL PULL-THROUGH
          </span>
          <h1>Sell-out</h1>
          <p className="story">
            Pharmacy dispensing rates, prescription pull-through, and regional consumption.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '36px' }}>
        <SellOutMetrics />
        <SellOutVelocity />
      </div>

      <EmptyState message="Real-time dispensing signals synchronized" />
    </section>
  )
}
