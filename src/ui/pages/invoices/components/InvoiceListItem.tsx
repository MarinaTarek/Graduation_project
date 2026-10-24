import { ChevronRight, FileText } from 'lucide-react'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import type { InvoiceRecord } from '../mock-data'

export interface InvoiceListItemProps {
  item: InvoiceRecord
  onClick: () => void
}

export function InvoiceListItem({ item, onClick }: InvoiceListItemProps) {
  return (
    <button className="collection-item" onClick={onClick}>
      <div className="item-icon">
        <FileText />
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
