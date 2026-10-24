import { Package, Plus } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { StockToolbar } from './components/StockToolbar'
import { StockListItem } from './components/StockListItem'
import { stockProductsMockData } from './mock-data'

export interface StockPageProps {
  onAdd: () => void
  onItem: () => void
}

export default function StockPage({ onAdd, onItem }: StockPageProps) {
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Package /> INVENTORY CONTROL
          </span>
          <h1>Stock</h1>
          <p className="story">
            Know what is moving, what is aging, and what needs attention.
          </p>
        </div>
        <Button variant="primary" onClick={onAdd}>
          <Plus data-icon="inline-start" /> Add new
        </Button>
      </div>

      <StockToolbar />

      <div className="collection-list">
        {stockProductsMockData.map((item) => (
          <StockListItem key={item.name} item={item} onClick={onItem} />
        ))}
      </div>

      <EmptyState />
    </section>
  )
}
