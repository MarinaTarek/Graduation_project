import { sellOutMockData } from '../mock-data'

export function SellOutVelocity() {
  return (
    <div style={{ marginTop: '24px' }} className="collection-list">
      {sellOutMockData.topProducts.map((p) => (
        <div key={p.name} className="collection-item">
          <div>
            <strong>{p.name}</strong>
            <span>Velocity: {p.velocity}</span>
          </div>
          <span style={{ color: 'var(--green-text)', fontWeight: 700 }}>{p.trend}</span>
        </div>
      ))}
    </div>
  )
}
