import { ChevronRight, Package } from 'lucide-react'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import type { StockProductRecord } from '../mock-data'

export interface StockListItemProps {
  item: StockProductRecord
  onClick: () => void
}

export function StockListItem({ item, onClick }: StockListItemProps) {
  return (
    <button className="collection-item" onClick={onClick}>
      <div className="item-icon">
        <Package />
      </div>
      <div>
        <strong>{item.name}</strong>
        <span>{item.meta}</span>
      </div>
      <StatusPill status={item.status} />
      <ChevronRight />
    </button>
  )
}
