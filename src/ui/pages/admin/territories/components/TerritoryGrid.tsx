import { MapPin } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { adminTerritoriesMockData } from '../mock-data'

export function TerritoryGrid() {
  const { t } = useT()

  return (
    <div className="collection-list">
      {adminTerritoriesMockData.map((terr) => (
        <div key={terr.name} className="collection-item">
          <div className="item-icon">
            <MapPin />
          </div>
          <div>
            <strong>{terr.name}</strong>
            <span>{t('admin.territories.leadAccounts', { lead: terr.leadRep, count: terr.accountsCount })}</span>
          </div>
          <b style={{ color: 'var(--ocean)' }}>{t('admin.territories.targetAmount', { target: terr.target })}</b>
        </div>
      ))}
    </div>
  )
}
