import { useT } from '@/lib/i18n'
import { targetsMockData } from '../mock-data'

export function QuotaBreakdown() {
  const { lang } = useT()
  return (
    <div style={{ marginTop: '24px' }} className="collection-list">
      {targetsMockData.regions.map((reg) => (
        <div key={reg.name} className="collection-item">
          <div>
            <strong>{lang === 'ar' ? (reg.name_ar || reg.name) : reg.name}</strong>
            <span>{lang === 'ar' ? (reg.attained_ar || reg.attained) : reg.attained}</span>
          </div>
          <b style={{ color: 'var(--ocean)' }}>{reg.percent}</b>
        </div>
      ))}
    </div>
  )
}
