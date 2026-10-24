import { useState, useMemo } from 'react'
import {
  ClipboardCheck,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Calendar,
  User,
  Building,
  Filter,
} from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { formatCurrency } from '@/lib/format'
import { stockProductsStore } from '@/data/mock/products'
import { useStore } from '@/data/mock/store'
import {
  batchesStore,
  stockMovementsStore,
  deriveProductStock,
  deriveBatches,
  type MovementType,
} from '@/data/mock/stockDerived'
import { useT } from '@/lib/i18n'

export interface StockDetailSheetProps {
  isOpen?: boolean
  onClose: () => void
  onOpenStockCount: () => void
  productName?: string
  role?: 'admin' | 'rep'
  currentUserName?: string
}

export function StockDetailSheet({
  isOpen = true,
  onClose,
  onOpenStockCount,
  productName = 'Bevato',
  role = 'admin',
  currentUserName = 'Alex Morgan',
}: StockDetailSheetProps) {
  const { t } = useT()
  const [tab, setTab] = useState<'warehouse' | 'reps' | 'pharmacies' | 'movements'>('warehouse')
  const [movementFilter, setMovementFilter] = useState<string>('all')

  const stockProductsMockData = useStore(stockProductsStore)
  const batches = useStore(batchesStore)
  const movements = useStore(stockMovementsStore)

  if (!isOpen) return null

  const product = stockProductsMockData.find((p) => p.name.toLowerCase() === productName.toLowerCase())
  const price = product?.price ?? 240

  const derived = deriveProductStock(productName, movements, batches, role, currentUserName)
  const productBatches = derived.batches

  // 1. Reps custody breakdown
  const repsBreakdown = useMemo(() => {
    const repMap: Record<string, { name: string; transfers: number; samples: number; region?: string }> = {}
    movements
      .filter((m) => m.productName.toLowerCase() === productName.toLowerCase())
      .forEach((m) => {
        if (m.repName) {
          if (!repMap[m.repName]) {
            repMap[m.repName] = { name: m.repName, transfers: 0, samples: 0, region: 'Field territory' }
          }
          if (m.type === 'transfer_rep') {
            repMap[m.repName].transfers += m.quantity
          } else if (m.type === 'sample') {
            repMap[m.repName].samples += m.quantity
          }
        }
      })

    const list = Object.values(repMap).map((r) => {
      const custody = Math.max(0, r.transfers - r.samples)
      return {
        rep: r.name,
        qty: `${custody.toLocaleString()} units`,
        territory: r.region || 'Assigned territory',
        status: custody < 50 ? 'Low buffer' : 'Healthy',
      }
    })

    if (list.length === 0) {
      return [
        { rep: 'Olivia Martin', qty: '450 units', territory: 'North territory', status: 'Healthy' },
        { rep: 'Maya Patel', qty: '380 units', territory: 'West territory', status: 'Healthy' },
        { rep: 'Alex Morgan', qty: '620 units', territory: 'Central territory', status: 'Healthy' },
        { rep: 'James Wilson', qty: '210 units', territory: 'South territory', status: 'Low buffer' },
      ]
    }
    return list
  }, [movements, productName])

  // 2. Pharmacies breakdown
  const pharmaciesBreakdown = useMemo(() => {
    const custMap: Record<string, { name: string; sell_in: number; sell_out: number; last_date: string }> = {}
    movements
      .filter((m) => m.productName.toLowerCase() === productName.toLowerCase() && m.customerName)
      .forEach((m) => {
        const cName = m.customerName!
        if (!custMap[cName]) {
          custMap[cName] = { name: cName, sell_in: 0, sell_out: 0, last_date: m.date }
        }
        if (m.type === 'sell_in') {
          custMap[cName].sell_in += m.quantity
        } else if (m.type === 'sell_out') {
          custMap[cName].sell_out += m.quantity
        }
        if (m.date > custMap[cName].last_date) {
          custMap[cName].last_date = m.date
        }
      })

    const list = Object.values(custMap).map((c) => {
      const inStock = Math.max(0, c.sell_in - c.sell_out)
      return {
        pharmacy: c.name,
        qty: `${inStock.toLocaleString()} units in stock`,
        meta: `Sell-in: ${c.sell_in.toLocaleString()} · Sell-out: ${c.sell_out.toLocaleString()}`,
        status: inStock > 100 ? 'Healthy' : 'Low stock',
      }
    })

    if (list.length === 0) {
      return [
        { pharmacy: 'Green Cross Pharmacy', qty: '820 units in stock', meta: 'Sell-in: 5,200 · Sell-out: 4,380', status: 'Healthy' },
        { pharmacy: 'St. Jude Clinic Pharmacy', qty: '640 units in stock', meta: 'Sell-in: 4,800 · Sell-out: 4,160', status: 'Healthy' },
        { pharmacy: 'Wellness First Dispensary', qty: '460 units in stock', meta: 'Sell-in: 3,000 · Sell-out: 2,540', status: 'Healthy' },
      ]
    }
    return list
  }, [movements, productName])

  // 3. Filtered movements timeline
  const productMovements = useMemo(() => {
    return movements
      .filter((m) => m.productName.toLowerCase() === productName.toLowerCase())
      .filter((m) => (movementFilter === 'all' ? true : m.type === movementFilter))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [movements, productName, movementFilter])

  return (
    <Drawer title={productName} kicker={t('stock.detail.kicker')} onClose={onClose}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--surface-raised)',
          borderRadius: '12px',
          marginBottom: '16px',
          border: '1px solid var(--border-soft)',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted-text)', display: 'block' }}>
            {t('stock.detail.unitPrice')}
          </span>
          <strong style={{ fontSize: '18px', color: 'var(--heading-text)' }}>
            {formatCurrency(price)}
          </strong>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted-text)', display: 'block' }}>
            {t('stock.detail.available')}
          </span>
          <strong style={{ fontSize: '18px', color: 'var(--ocean)' }}>
            {t('stock.detail.unitsCount', { count: derived.available_qty.toLocaleString() })}
          </strong>
        </div>
      </div>

      {/* Tabs */}
      <div className="stock-tabs" style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button className={tab === 'warehouse' ? 'active' : ''} onClick={() => setTab('warehouse')}>
          {t('stock.detail.tabWarehouse', { count: derived.in_warehouse.toLocaleString() })}
        </button>
        <button className={tab === 'reps' ? 'active' : ''} onClick={() => setTab('reps')}>
          {t('stock.detail.tabReps')}
        </button>
        <button className={tab === 'pharmacies' ? 'active' : ''} onClick={() => setTab('pharmacies')}>
          {t('stock.detail.tabPharmacies', { count: derived.in_market.toLocaleString() })}
        </button>
        <button className={tab === 'movements' ? 'active' : ''} onClick={() => setTab('movements')}>
          {t('stock.detail.tabMovements', { count: productMovements.length })}
        </button>
      </div>

      {/* Tab: Warehouse */}
      {tab === 'warehouse' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '14px',
              fontSize: '12px',
            }}
          >
            <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--surface-raised)', border: '1px solid var(--border-soft)' }}>
              <span style={{ color: 'var(--muted-text)', display: 'block', fontSize: '11px' }}>{t('stock.detail.inWarehouse')}</span>
              <strong>{derived.in_warehouse.toLocaleString()}</strong>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--surface-raised)', border: '1px solid var(--border-soft)' }}>
              <span style={{ color: 'var(--muted-text)', display: 'block', fontSize: '11px' }}>{t('stock.detail.expiring90d')}</span>
              <strong style={{ color: derived.expiring_90d_qty > 0 ? 'var(--rose-text)' : 'inherit' }}>
                {derived.expiring_90d_qty.toLocaleString()}
              </strong>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--surface-raised)', border: '1px solid var(--border-soft)' }}>
              <span style={{ color: 'var(--muted-text)', display: 'block', fontSize: '11px' }}>{t('stock.detail.expiredRisk')}</span>
              <strong style={{ color: derived.expired_qty > 0 ? '#64748b' : 'inherit' }}>
                {derived.expired_qty.toLocaleString()}
              </strong>
            </div>
          </div>

          <div className="batch-list">
            {productBatches.map((b) => (
              <div
                key={b.id || b.batch_no}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  borderBottom: '1px solid var(--border-soft)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14px' }}>{b.batch_no}</strong>
                    {b.is_fefo_first && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '99px',
                          background: 'rgba(2, 132, 199, 0.15)',
                          color: 'var(--ocean)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Sparkles size={10} /> {t('stock.detail.sellFirst')}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--muted-text)', display: 'block', marginTop: '2px' }}>
                    {t('stock.detail.unitsRemaining', { remaining: b.qty_remaining.toLocaleString(), exp: b.expiry_date })}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <em
                    className={
                      b.status === 'expired'
                        ? 'grey'
                        : b.status === 'critical'
                        ? 'rose'
                        : b.status === 'warning'
                        ? 'amber'
                        : 'green'
                    }
                    style={{
                      fontStyle: 'normal',
                      padding: '3px 8px',
                      borderRadius: '99px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background:
                        b.status === 'expired'
                          ? '#64748b'
                          : b.status === 'critical'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : b.status === 'warning'
                          ? 'rgba(217, 119, 6, 0.15)'
                          : 'rgba(22, 163, 74, 0.15)',
                      color:
                        b.status === 'expired'
                          ? '#ffffff'
                          : b.status === 'critical'
                          ? 'var(--rose-text, #ef4444)'
                          : b.status === 'warning'
                          ? '#d97706'
                          : 'var(--green-text, #16a34a)',
                    }}
                  >
                    {b.status_label}
                  </em>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Reps */}
      {tab === 'reps' && (
        <div className="batch-list">
          {repsBreakdown.map((r) => (
            <div key={r.rep} style={{ padding: '12px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '14px', display: 'block' }}>{r.rep}</strong>
                <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
                  {r.territory} · {r.qty}
                </span>
              </div>
              <em
                className={r.status === 'Low buffer' ? 'rose' : 'green'}
                style={{
                  fontStyle: 'normal',
                  padding: '3px 8px',
                  borderRadius: '99px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: r.status === 'Low buffer' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(22, 163, 74, 0.15)',
                  color: r.status === 'Low buffer' ? 'var(--rose-text)' : 'var(--green-text)',
                }}
              >
                {r.status}
              </em>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Pharmacies */}
      {tab === 'pharmacies' && (
        <div className="batch-list">
          {pharmaciesBreakdown.map((p) => (
            <div key={p.pharmacy} style={{ padding: '12px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '14px', display: 'block' }}>{p.pharmacy}</strong>
                <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
                  {p.qty} · {p.meta}
                </span>
              </div>
              <em
                style={{
                  fontStyle: 'normal',
                  padding: '3px 8px',
                  borderRadius: '99px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: 'rgba(22, 163, 74, 0.15)',
                  color: 'var(--green-text)',
                }}
              >
                {p.status}
              </em>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Movements */}
      {tab === 'movements' && (
        <div>
          {/* Filter pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
            {['all', 'receipt', 'sell_in', 'sell_out', 'sample', 'transfer_rep', 'adjustment', 'return'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMovementFilter(type)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '99px',
                  border: '1px solid var(--border-soft)',
                  background: movementFilter === type ? 'var(--ocean)' : 'var(--surface)',
                  color: movementFilter === type ? '#ffffff' : 'inherit',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {type === 'all' ? t('stock.detail.filterAll') : type.replace('_', '-')}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '50vh', overflowY: 'auto' }}>
            {productMovements.length > 0 ? (
              productMovements.map((m) => {
                const isPositive = m.type === 'receipt' || m.type === 'return' || (m.type === 'adjustment' && m.quantity > 0)
                return (
                  <div
                    key={m.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-soft)',
                      background: 'var(--surface-raised, rgba(0,0,0,0.02))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            background:
                              m.type === 'receipt'
                                ? 'rgba(22, 163, 74, 0.15)'
                                : m.type === 'sell_in'
                                ? 'rgba(2, 132, 199, 0.15)'
                                : m.type === 'sell_out'
                                ? 'rgba(168, 85, 247, 0.15)'
                                : m.type === 'sample'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(100, 116, 139, 0.15)',
                            color:
                              m.type === 'receipt'
                                ? 'var(--green-text)'
                                : m.type === 'sell_in'
                                ? 'var(--ocean)'
                                : m.type === 'sell_out'
                                ? '#a855f7'
                                : m.type === 'sample'
                                ? '#d97706'
                                : '#64748b',
                          }}
                        >
                          {m.type.replace('_', ' ')}
                        </span>
                        <strong>{m.batchNumber || 'Batch General'}</strong>
                      </div>
                      <div style={{ color: 'var(--muted-text)', marginTop: '2px', fontSize: '11px' }}>
                        {m.date} {m.customerName ? `· ${m.customerName}` : ''} {m.repName ? `· Rep: ${m.repName}` : ''}
                        {m.reason ? ` · Reason: ${m.reason}` : ''}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '13px', color: isPositive ? 'var(--green-text)' : 'inherit' }}>
                        {isPositive ? '+' : '-'}
                        {Math.abs(m.quantity).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted-text)', fontSize: '12px' }}>
                {t('stock.detail.noMovements')}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '16px' }}>
        <Button variant="primary" className="full-button" onClick={onOpenStockCount}>
          <ClipboardCheck data-icon="inline-start" /> {t('stock.detail.stockCount')}
        </Button>
      </div>
    </Drawer>
  )
}
