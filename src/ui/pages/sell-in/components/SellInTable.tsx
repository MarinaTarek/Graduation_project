import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { sellInMockOrders } from '../mock-data'

export function SellInTable() {
  return (
    <div style={{ marginTop: '24px' }}>
      <div className="collection-list">
        {sellInMockOrders.map((order) => (
          <div key={order.orderId} className="collection-item">
            <div>
              <strong>{order.orderId} · {order.distributor}</strong>
              <span>{order.volume} · {order.date}</span>
            </div>
            <b style={{ color: 'var(--heading-text)', marginRight: '16px' }}>{order.amount}</b>
            <StatusPill status={order.status === 'Delivered' ? 'Healthy' : 'Pending'} />
          </div>
        ))}
      </div>
    </div>
  )
}
