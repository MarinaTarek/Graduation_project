import { MapPin } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { formatRepName } from '@/lib/format'
import { adminTerritoriesMockData } from '../mock-data'

export function TerritoryGrid() {
  const { t, lang } = useT()

  return (
    <div className="collection-list">
      {adminTerritoriesMockData.map((terr) => {
        const name = lang === 'ar' ? (terr.name_ar || terr.name) : terr.name
        const lead = formatRepName(terr.leadRep, lang)
        const target = lang === 'ar' ? (terr.target_ar || terr.target) : terr.target
        return (
          <div key={terr.name} className="collection-item">
            <div className="item-icon">
              <MapPin />
            </div>
            <div>
              <strong>{name}</strong>
              <span>{t('admin.territories.leadAccounts', { lead, count: terr.accountsCount })}</span>
            </div>
            <b style={{ color: 'var(--ocean)' }}>{t('admin.territories.targetAmount', { target })}</b>
          </div>
        )
      })}
    </div>
  )
}
