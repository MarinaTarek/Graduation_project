import { ChevronRight, Stethoscope } from 'lucide-react'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import type { VisitRecord } from '../mock-data'

export interface VisitListItemProps {
  item: VisitRecord
  onClick?: () => void
}

export function VisitListItem({ item, onClick }: VisitListItemProps) {
  return (
    <button className="collection-item" onClick={onClick}>
      <div className="item-icon">
        <Stethoscope />
      </div>
      <div>
        <strong>{item.clientName}</strong>
        <span>{item.repName} · {item.date} · {item.detail}</span>
      </div>
      <StatusPill status={item.status} />
      <ChevronRight />
    </button>
  )
}
