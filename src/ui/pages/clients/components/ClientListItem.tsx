import { ChevronRight, Users, Edit3 } from 'lucide-react'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { Button } from '@/ui/design-system/components/Button'
import { useT } from '@/lib/i18n'
import type { ClientRecord } from '../mock-data'
import { SPECIALTY_AR, CLASSIFICATION_AR, CLIENT_REGION_AR } from '../mock-data'

export interface ClientListItemProps {
  item: ClientRecord
  onClick: () => void
  onEdit?: (item: ClientRecord) => void
  canEdit?: boolean
}

export function ClientListItem({ item, onClick, onEdit, canEdit = true }: ClientListItemProps) {
  const { t, lang } = useT()

  const displayName = lang === 'ar' ? (item.name_ar || item.name) : item.name
  let displayMeta = item.meta
  if (lang === 'ar') {
    const spec = (item.specialty && SPECIALTY_AR[item.specialty]) || item.specialty
    const reg = (item.region && CLIENT_REGION_AR[item.region]) || item.region
    const cls = (item.classification && CLASSIFICATION_AR[item.classification]) || item.classification
    displayMeta = [spec, reg, cls].filter(Boolean).join(' · ')
  }

  return (
    <div
      className="collection-item"
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer', textAlign: 'start' }}
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
        <strong>{displayName}</strong>
        <span>{displayMeta}</span>
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
          {t('common.edit')}
        </Button>
      )}
      <ChevronRight />
    </div>
  )
}
