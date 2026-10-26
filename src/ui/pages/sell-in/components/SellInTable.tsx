import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { formatDate } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { sellInMockOrders } from '../mock-data'

export function SellInTable() {
  const { lang } = useT()
  return (
    <div style={{ marginTop: '24px' }}>
      <div className="collection-list">
        {sellInMockOrders.map((order) => (
          <div key={order.orderId} className="collection-item">
            <div>
              <strong>{order.orderId} · {lang === 'ar' ? (order.distributor_ar || order.distributor) : order.distributor}</strong>
              <span>{lang === 'ar' ? (order.volume_ar || order.volume) : order.volume} · {formatDate(order.date, lang)}</span>
            </div>
            <b style={{ color: 'var(--heading-text)', marginInlineEnd: '16px' }}>
              {lang === 'ar' ? (order.amount_ar || order.amount) : order.amount}
            </b>
            <StatusPill status={order.status === 'Delivered' ? 'Healthy' : 'Pending'} />
          </div>
        ))}
      </div>
    </div>
  )
}
