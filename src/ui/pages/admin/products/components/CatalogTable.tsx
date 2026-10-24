import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { adminProductsMockData } from '../mock-data'

export function CatalogTable() {
  return (
    <div className="collection-list">
      {adminProductsMockData.map((item) => (
        <div key={item.code} className="collection-item">
          <div>
            <strong>{item.code} · {item.name}</strong>
            <span>{item.category} · {item.standardPack}</span>
          </div>
          <StatusPill status={item.status} />
        </div>
      ))}
    </div>
  )
}
