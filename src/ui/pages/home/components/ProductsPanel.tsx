import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { CapsuleProgress } from '@/ui/design-system/components/CapsuleProgress'
import { homeProducts } from '../mock-data'
import { useStore } from '@/data/mock/store'
import {
  batchesStore,
  stockMovementsStore,
  deriveProductStock,
} from '@/data/mock/stockDerived'

export interface ProductsPanelProps {
  onNavigateStock: () => void
  onOpenStockDetail: () => void
}

export function ProductsPanel({
  onNavigateStock,
  onOpenStockDetail,
}: ProductsPanelProps) {
  const batches = useStore(batchesStore)
  const movements = useStore(stockMovementsStore)

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
      <div className="capsule-row" style={{ overflowX: 'auto', paddingBottom: '8px' }}>
        {homeProducts.map((p) => {
          const derived = deriveProductStock(p.name, movements, batches)
          const total = Math.max(1, derived.received)
          const pctSold = Math.min(100, Math.round((derived.sell_out / total) * 100))
          const pctMarket = Math.min(100 - pctSold, Math.round((derived.in_market / total) * 100))
          const pctWarehouse = Math.max(0, 100 - pctSold - pctMarket)

          return (
            <CapsuleProgress
              key={p.name}
              name={p.name}
              sold={`${derived.sell_through_pct}%`}
              qty={derived.received.toLocaleString()}
              left={derived.in_warehouse.toLocaleString()}
              received={derived.received.toLocaleString()}
              sellIn={derived.sell_in.toLocaleString()}
              sellOut={derived.sell_out.toLocaleString()}
              inWarehouse={derived.in_warehouse.toLocaleString()}
              inMarket={derived.in_market.toLocaleString()}
              sellThrough={`${derived.sell_through_pct}%`}
              pctSold={pctSold}
              pctMarket={pctMarket}
              pctWarehouse={pctWarehouse}
              color={p.color}
              height={p.height}
              onClick={onOpenStockDetail}
            />
          )
        })}
      </div>
    </section>
  )
}
