import { MapPin, Pencil } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { formatRepName } from '@/lib/format'
import { useStore } from '@/data/mock/store'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { Button } from '@/ui/design-system/components/Button'
import { territoriesStore, type TerritoryRecord } from '../mock-data'

export interface TerritoryGridProps {
  onEditTerritory?: (terr: TerritoryRecord) => void
}

export function TerritoryGrid({ onEditTerritory }: TerritoryGridProps) {
  const { t, lang } = useT()
  const territories = useStore(territoriesStore)

  if (territories.length === 0) {
    return <EmptyState message={t('admin.territories.emptyState')} />
  }

  return (
    <div className="collection-list">
      {territories.map((terr) => {
        const name = lang === 'ar' ? (terr.name_ar || terr.name) : terr.name
        const lead = formatRepName(terr.leadRep, lang)
        const target = lang === 'ar' ? (terr.target_ar || terr.target) : terr.target
        return (
          <div
            key={terr.name}
            className="collection-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
              <div className="item-icon">
                <MapPin />
              </div>
              <div>
                <strong style={{ fontSize: '15px', color: 'var(--heading-text)' }}>{name}</strong>
                <span style={{ fontSize: '12px', color: 'var(--muted-text)', display: 'block', marginTop: '2px' }}>
                  {t('admin.territories.leadAccounts', { lead, count: terr.accountsCount })}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <b style={{ color: 'var(--ocean)', fontSize: '14px' }}>
                {t('admin.territories.targetAmount', { target })}
              </b>

              {onEditTerritory && (
                <Button
                  variant="secondary"
                  onClick={() => onEditTerritory(terr)}
                  style={{
                    height: '32px',
                    padding: '0 10px',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Pencil size={13} />
                  <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
