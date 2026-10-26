import { ChevronRight } from 'lucide-react'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { Button } from '@/ui/design-system/components/Button'
import { formatCurrency, formatDate } from '@/lib/format'
import { localizedName, useT } from '@/lib/i18n'
import { salesOrdersStore } from '@/data/mock/sales-orders'
import { customersStore } from '@/data/mock/customers'
import { useStore } from '@/data/mock/store'

export function SellInTable({
  onSelect,
  onCreate,
}: {
  onSelect: (orderId: string) => void
  onCreate: () => void
}) {
  const { t, lang } = useT()
  const orders = useStore(salesOrdersStore)
  const customers = useStore(customersStore)

  if (orders.length === 0) {
    return (
      <div style={{ marginTop: '24px' }}>
        <EmptyState message={t('salesOrders.emptyOrders')} />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
          <Button variant="secondary" onClick={onCreate}>
            {t('salesOrders.createFirst')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '24px' }}>
      <div className="collection-list">
        {orders.map((order) => {
          const customer = customers.find((c) => c.id === order.customerId)
          const customerName = customer ? localizedName(customer, lang) : order.customerName
          const units = order.items.reduce((sum, item) => sum + item.quantity, 0)

          return (
            <button
              key={order.id}
              type="button"
              className="collection-item"
              onClick={() => onSelect(order.id)}
            >
              <div>
                <strong>
                  {order.id} · {customerName}
                </strong>
                <span>
                  {units} {t('salesOrders.units')} · {formatDate(order.createdAt, lang)}
                </span>
              </div>

              <b
                style={{
                  color: 'var(--heading-text)',
                  marginInlineEnd: '16px',
                }}
              >
                {formatCurrency(order.total, 'EGP', lang)}
              </b>

              <StatusPill status={order.status} />
              <ChevronRight />
            </button>
          )
        })}
      </div>
    </div>
  )
}
