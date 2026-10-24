import { ArrowUpRight } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { SellInMetrics } from './components/SellInMetrics'
import { SellInTable } from './components/SellInTable'

export default function SellInPage() {
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <ArrowUpRight /> SALES PIPELINE
          </span>
          <h1>Sell-in</h1>
          <p className="story">
            Factory-to-distributor distribution, order velocity, and warehouse replenishments.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '36px' }}>
        <SellInMetrics />
        <SellInTable />
      </div>

      <EmptyState message="All wholesale and distributor orders reconciled" />
    </section>
  )
}
