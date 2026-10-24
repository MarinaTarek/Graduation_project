import { ChevronRight } from 'lucide-react'
import { adminSections } from '../mock-data'

export interface AdminNavCardsProps {
  onSelect: (key: string) => void
}

export function AdminNavCards({ onSelect }: AdminNavCardsProps) {
  return (
    <div className="admin-hub-grid">
      {adminSections.map((sec) => {
        const Icon = sec.icon
        return (
          <button
            key={sec.key}
            onClick={() => onSelect(sec.key)}
            className="admin-hub-card"
          >
            <div className="admin-hub-icon">
              <Icon style={{ width: '22px', height: '22px' }} />
            </div>
            <div className="admin-hub-text">
              <strong>{sec.label}</strong>
              <small>{sec.description}</small>
            </div>
            <ChevronRight className="admin-hub-arrow" />
          </button>
        )
      })}
    </div>
  )
}
