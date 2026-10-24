import { ChevronRight, Users } from 'lucide-react'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import type { ClientRecord } from '../mock-data'

export interface ClientListItemProps {
  item: ClientRecord
  onClick: () => void
}

export function ClientListItem({ item, onClick }: ClientListItemProps) {
  return (
    <button className="collection-item" onClick={onClick}>
      <div className="item-icon">
        <Users />
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
