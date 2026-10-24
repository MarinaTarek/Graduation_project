import { useT } from '@/lib/i18n'
import { sellOutMockData } from '../mock-data'

export function SellOutVelocity() {
  const { t } = useT()
  return (
    <div style={{ marginTop: '24px' }} className="collection-list">
      {sellOutMockData.topProducts.map((p) => (
        <div key={p.name} className="collection-item">
          <div>
            <strong>{p.name}</strong>
            <span>{t('sellOut.velocity.label', { velocity: p.velocity })}</span>
          </div>
          <span style={{ color: 'var(--green-text)', fontWeight: 700 }}>{p.trend}</span>
        </div>
      ))}
    </div>
  )
}
