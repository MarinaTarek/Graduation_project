import { MapPin } from 'lucide-react'
import { adminTerritoriesMockData } from '../mock-data'

export function TerritoryGrid() {
  return (
    <div className="collection-list">
      {adminTerritoriesMockData.map((t) => (
        <div key={t.name} className="collection-item">
          <div className="item-icon">
            <MapPin />
          </div>
          <div>
            <strong>{t.name}</strong>
            <span>Lead: {t.leadRep} · {t.accountsCount} assigned accounts</span>
          </div>
          <b style={{ color: 'var(--ocean)' }}>{t.target} target</b>
        </div>
      ))}
    </div>
  )
}
