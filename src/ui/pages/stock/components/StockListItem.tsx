import { ChevronRight, Package, AlertTriangle } from 'lucide-react'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { formatCurrency } from '@/lib/format'
import { useT } from '@/lib/i18n'
import type { StockProductRecord } from '../mock-data'
import type { DerivedProductStock } from '@/data/mock/stockDerived'

export interface StockListItemProps {
  item: StockProductRecord
  derived?: DerivedProductStock
  onClick: () => void
}

export function StockListItem({ item, derived, onClick }: StockListItemProps) {
  const { t } = useT()
  const received = derived?.received ?? (parseInt(item.qty.replace(/,/g, ''), 10) || 12000)
  const sell_in = derived?.sell_in ?? Math.round(received * 0.75)
  const sell_out = derived?.sell_out ?? Math.round(sell_in * 0.8)
  const in_warehouse = derived?.in_warehouse ?? (parseInt(item.left.replace(/,/g, ''), 10) || 1920)
  const in_market = derived?.in_market ?? Math.max(0, sell_in - sell_out)
  const sell_through = derived?.sell_through_pct ?? Math.round((sell_out / sell_in) * 100)
  const total = Math.max(1, received)

  const pctSold = Math.min(100, Math.round((sell_out / total) * 100))
  const pctMarket = Math.min(100 - pctSold, Math.round((in_market / total) * 100))
  const pctWarehouse = Math.max(0, 100 - pctSold - pctMarket)

  return (
    <div
      className="collection-item"
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '16px',
        border: '1px solid var(--border-soft)',
        borderRadius: '12px',
        marginBottom: '10px',
        background: 'var(--surface)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="item-icon">
            <Package />
          </div>
          <div>
            <strong style={{ fontSize: '15px' }}>{item.name}</strong>
            <span style={{ fontSize: '12px', color: 'var(--muted-text)', marginInlineStart: '8px' }}>
              {item.category} {item.price ? `· ${formatCurrency(item.price)}` : ''}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {derived && derived.expired_qty > 0 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '99px',
                background: '#64748b',
                color: '#ffffff',
              }}
            >
              {t('stock.list.expiredCount', { count: derived.expired_qty.toLocaleString() })}
            </span>
          )}
          {derived && derived.expiring_90d_qty > 0 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '99px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--rose-text, #ef4444)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <AlertTriangle size={12} />
              {t('stock.list.expiringCount', { count: derived.expiring_90d_qty.toLocaleString() })}
            </span>
          )}
          <StatusPill status={derived && derived.expiring_90d_qty > 0 ? 'Low stock' : item.status} />
          <ChevronRight />
        </div>
      </div>

      {/* Mini Bar: Sold / Not sold (in market) / Warehouse */}
      <div style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            height: '8px',
            borderRadius: '99px',
            overflow: 'hidden',
            background: 'var(--surface-raised, rgba(0,0,0,0.06))',
            width: '100%',
          }}
        >
          <div
            style={{ width: `${pctSold}%`, background: 'var(--green-text, #16a34a)' }}
            title={t('stock.list.soldByCustomersTitle', { count: sell_out.toLocaleString() })}
          />
          <div
            style={{ width: `${pctMarket}%`, background: 'var(--ocean, #0284c7)' }}
            title={t('stock.list.stillInMarketTitle', { count: in_market.toLocaleString() })}
          />
          <div
            style={{ width: `${pctWarehouse}%`, background: 'var(--amber-text, #d97706)' }}
            title={t('stock.list.inWarehouseTitle', { count: in_warehouse.toLocaleString() })}
          />
        </div>
      </div>

      {/* 4 Plain-Label Numbers + Market status */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px',
          width: '100%',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-soft)',
          fontSize: '12px',
        }}
      >
        <div>
          <span style={{ color: 'var(--muted-text)', display: 'block', fontSize: '11px' }}>{t('stock.list.received')}</span>
          <strong style={{ fontSize: '13px' }}>{received.toLocaleString()}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--muted-text)', display: 'block', fontSize: '11px' }}>{t('stock.list.soldToCustomersSellIn')}</span>
          <strong style={{ fontSize: '13px', color: 'var(--ocean)' }}>{sell_in.toLocaleString()}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--muted-text)', display: 'block', fontSize: '11px' }}>{t('stock.list.soldByCustomersSellOut')}</span>
          <strong style={{ fontSize: '13px', color: 'var(--green-text, #16a34a)' }}>{sell_out.toLocaleString()}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--muted-text)', display: 'block', fontSize: '11px' }}>{t('stock.list.inWarehouseNow')}</span>
          <strong style={{ fontSize: '13px', color: '#d97706' }}>{in_warehouse.toLocaleString()}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--muted-text)', display: 'block', fontSize: '11px' }}>{t('stock.list.stillInMarket')}</span>
          <strong style={{ fontSize: '13px' }}>{in_market.toLocaleString()}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--muted-text)', display: 'block', fontSize: '11px' }}>{t('stock.list.sellThroughPct')}</span>
          <strong style={{ fontSize: '13px', color: sell_through >= 70 ? 'var(--green-text, #16a34a)' : '#d97706' }}>
            {sell_through}%
          </strong>
        </div>
      </div>
    </div>
  )
}
