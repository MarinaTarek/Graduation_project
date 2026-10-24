import { ChevronRight } from 'lucide-react'
import { adminSections } from '../mock-data'

export interface AdminNavCardsProps {
  onSelect: (key: string) => void
}

export function AdminNavCards({ onSelect }: AdminNavCardsProps) {
  return (
    <div className="more-grid">
      {adminSections.map((sec) => {
        const Icon = sec.icon
        return (
          <button key={sec.key} onClick={() => onSelect(sec.key)}>
            <div>
              <Icon />
            </div>
            <div>
              <strong>{sec.label}</strong>
              <small style={{ color: 'var(--muted-text)', fontSize: '11px', display: 'block' }}>
                {sec.description}
              </small>
            </div>
            <ChevronRight />
          </button>
        )
      })}
    </div>
  )
}
