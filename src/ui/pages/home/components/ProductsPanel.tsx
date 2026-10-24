import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { CapsuleProgress } from '@/ui/design-system/components/CapsuleProgress'
import { homeProducts } from '../mock-data'

export interface ProductsPanelProps {
  onNavigateStock: () => void
  onOpenStockDetail: () => void
}

export function ProductsPanel({
  onNavigateStock,
  onOpenStockDetail,
}: ProductsPanelProps) {
  return (
    <section className="panel products-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">DISTRIBUTION & STOCK</span>
          <h3>Products as capsules</h3>
        </div>
        <Button variant="round-arrow" onClick={onNavigateStock}>
          <ArrowUpRight />
        </Button>
      </div>
      <div className="capsule-row">
        {homeProducts.map((p) => (
          <CapsuleProgress
            key={p.name}
            name={p.name}
            sold={p.sold}
            qty={p.qty}
            left={p.left}
            color={p.color}
            height={p.height}
            onClick={onOpenStockDetail}
          />
        ))}
      </div>
    </section>
  )
}
