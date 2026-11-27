import { ChevronRight, Stethoscope } from 'lucide-react'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { useT } from '@/lib/i18n'
import type { VisitRecord } from '../mock-data'

export interface VisitListItemProps {
  item: VisitRecord
  onClick?: () => void
}

export function VisitListItem({ item, onClick }: VisitListItemProps) {
  const { lang } = useT()
  const clientName = lang === 'ar' ? (item.clientName_ar || item.clientName) : item.clientName
  const repName = lang === 'ar' ? (item.repName_ar || item.repName) : item.repName
  const date = lang === 'ar' ? (item.date_ar || item.date) : item.date
  const detail = lang === 'ar' ? (item.detail_ar || item.detail) : item.detail

  return (
    <button className="collection-item" onClick={onClick}>
      <div className="item-icon">
        <Stethoscope />
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <strong>{clientName}</strong>
          {item.isDoubleVisit && (
            <span
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '8px',
                background: 'rgba(2, 132, 199, 0.1)',
                color: 'var(--ocean, #0284c7)',
                fontWeight: 600,
              }}
            >
              👥 {lang === 'ar' ? 'زيارة مشتركة' : 'Double Visit'}
              {item.jointVisitStatus ? ` · ${item.jointVisitStatus}` : ''}
            </span>
          )}
        </div>
        <span>{repName}{item.jointRepName ? ` + ${item.jointRepName}` : ''} · {date} · {detail}</span>
      </div>
      <StatusPill status={item.status} />
      <ChevronRight />
    </button>
  )
}
