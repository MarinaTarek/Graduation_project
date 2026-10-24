import { ChevronRight, Users, Edit3 } from 'lucide-react'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { Button } from '@/ui/design-system/components/Button'
import type { ClientRecord } from '../mock-data'

export interface ClientListItemProps {
  item: ClientRecord
  onClick: () => void
  onEdit?: (item: ClientRecord) => void
  canEdit?: boolean
}

export function ClientListItem({ item, onClick, onEdit, canEdit = true }: ClientListItemProps) {
  return (
    <div
      className="collection-item"
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer', textAlign: 'left' }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="item-icon">
        <Users />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong>{item.name}</strong>
        <span>{item.meta}</span>
      </div>
      <StatusPill status={item.status} />
      {canEdit && onEdit && (
        <Button
          variant="secondary"
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(item)
          }}
          style={{
            height: '30px',
            padding: '0 10px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Edit3 size={13} />
          Edit
        </Button>
      )}
      <ChevronRight />
    </div>
  )
}
