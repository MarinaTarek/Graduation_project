import { targetsMockData } from '../mock-data'

export function QuotaBreakdown() {
  return (
    <div style={{ marginTop: '24px' }} className="collection-list">
      {targetsMockData.regions.map((reg) => (
        <div key={reg.name} className="collection-item">
          <div>
            <strong>{reg.name}</strong>
            <span>{reg.attained}</span>
          </div>
          <b style={{ color: 'var(--ocean)' }}>{reg.percent}</b>
        </div>
      ))}
    </div>
  )
}
