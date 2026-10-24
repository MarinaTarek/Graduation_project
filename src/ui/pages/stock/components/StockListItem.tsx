import { ChevronRight, Package } from 'lucide-react'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { formatCurrency } from '@/lib/format'
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
        <span>
          {item.meta}
          {item.price !== undefined && (
            <span style={{ marginLeft: '6px', fontWeight: 600, color: 'var(--ocean)' }}>
              · {formatCurrency(item.price)}
            </span>
          )}
        </span>
      </div>
      <StatusPill status={item.status} />
      <ChevronRight />
    </button>
  )
}
