import { useT } from '@/lib/i18n'
import { sellOutMockData } from '../mock-data'

export function SellOutVelocity() {
  const { t, lang } = useT()
  return (
    <div style={{ marginTop: '24px' }} className="collection-list">
      {sellOutMockData.topProducts.map((p) => {
        const prodName = lang === 'ar' ? (p.name_ar || p.name) : p.name
        const vel = lang === 'ar' ? (p.velocity_ar || p.velocity) : p.velocity
        return (
          <div key={p.name} className="collection-item">
            <div>
              <strong>{prodName}</strong>
              <span>{t('sellOut.velocity.label', { velocity: vel })}</span>
            </div>
            <span style={{ color: 'var(--green-text)', fontWeight: 700 }}>{p.trend}</span>
          </div>
        )
      })}
    </div>
  )
}
