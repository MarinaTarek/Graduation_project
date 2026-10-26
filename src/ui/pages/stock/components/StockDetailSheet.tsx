import { useState, useMemo, type CSSProperties } from 'react'
import { ClipboardCheck, Sparkles } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { formatCurrency } from '@/lib/format'
import { stockProductsStore } from '@/data/mock/products'
import { useStore } from '@/data/mock/store'
import {
  batchesStore,
  stockMovementsStore,
  deriveProductStock,
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

// Restrained, consistent expiry-status colors shared by every batch card.
const STATUS_PILL: Record<string, { background: string; color: string }> = {
  expired: { background: '#64748b', color: '#ffffff' },
  critical: { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--rose-text, #ef4444)' },
  warning: { background: 'rgba(217, 119, 6, 0.15)', color: '#d97706' },
  ok: { background: 'rgba(22, 163, 74, 0.15)', color: 'var(--green-text, #16a34a)' },
}

const MOVEMENT_CHIP: Record<string, { background: string; color: string }> = {
  receipt: { background: 'rgba(22, 163, 74, 0.15)', color: 'var(--green-text)' },
  sell_in: { background: 'rgba(2, 132, 199, 0.15)', color: 'var(--ocean)' },
  sell_out: { background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' },
  sample: { background: 'rgba(245, 158, 11, 0.15)', color: '#d97706' },
  other: { background: 'rgba(100, 116, 139, 0.15)', color: '#64748b' },
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

  if (!isOpen) return null

  const statusPill = (status: string, label: string) => {
    const tone = STATUS_PILL[status] ?? STATUS_PILL.ok
    return (
      <em className="stock-status-pill" style={{ background: tone.background, color: tone.color }}>
        {label}
      </em>
    )
  }

  return (
    <Drawer title={productName} kicker={t('stock.detail.kicker')} onClose={onClose}>
      {/* Hero metrics + Stock count action */}
      <div className="stock-detail-hero">
        <div className="stock-stat">
          <span className="stock-stat__label">{t('stock.detail.unitPrice')}</span>
          <strong className="stock-stat__value">{formatCurrency(price)}</strong>
        </div>
        <div className="stock-stat">
          <span className="stock-stat__label">{t('stock.detail.available')}</span>
          <strong className="stock-stat__value" style={{ color: 'var(--ocean)' }}>
            {t('stock.detail.unitsCount', { count: derived.available_qty.toLocaleString() })}
          </strong>
        </div>
        <div className="stock-detail-count">
          <Button
            variant="secondary"
            onClick={onOpenStockCount}
            style={{ fontSize: '12px', padding: '9px 14px', whiteSpace: 'nowrap' }}
          >
            <ClipboardCheck size={15} style={{ marginInlineEnd: '6px' }} />
            {t('stock.detail.stockCount')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="stock-tabs" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
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
          <div className="stock-metrics-3" style={{ marginTop: '14px' }}>
            <div className="stock-stat">
              <span className="stock-stat__label">{t('stock.detail.inWarehouse')}</span>
              <strong className="stock-stat__value">{derived.in_warehouse.toLocaleString()}</strong>
            </div>
            <div className="stock-stat">
              <span className="stock-stat__label">{t('stock.detail.expiring90d')}</span>
              <strong
                className="stock-stat__value"
                style={{ color: derived.expiring_90d_qty > 0 ? 'var(--rose-text)' : 'inherit' }}
              >
                {derived.expiring_90d_qty.toLocaleString()}
              </strong>
            </div>
            <div className="stock-stat">
              <span className="stock-stat__label">{t('stock.detail.expiredRisk')}</span>
              <strong
                className="stock-stat__value"
                style={{ color: derived.expired_qty > 0 ? '#64748b' : 'inherit' }}
              >
                {derived.expired_qty.toLocaleString()}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {productBatches.map((b) => (
              <div key={b.id || b.batch_no} className="stock-batch-card">
                <div className="stock-batch-card__top">
                  <span className="stock-batch-card__no">{b.batch_no}</span>
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
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Sparkles size={10} /> {t('stock.detail.sellFirst')}
                    </span>
                  )}
                </div>
                <div className="stock-batch-card__info">
                  <div className="stock-batch-card__cell">
                    <span className="stock-cell-label">{t('stock.detail.remainingLabel')}</span>
                    <span className="stock-cell-value">{b.qty_remaining.toLocaleString()}</span>
                  </div>
                  <div className="stock-batch-card__cell">
                    <span className="stock-cell-label">{t('stock.detail.expiryLabel')}</span>
                    <span className="stock-cell-value" style={{ unicodeBidi: 'plaintext' }}>{b.expiry_date}</span>
                  </div>
                  <div className="stock-batch-card__cell">
                    <span className="stock-cell-label">{t('stock.detail.statusLabel')}</span>
                    {statusPill(b.status, b.status_label)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Reps */}
      {tab === 'reps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
          {repsBreakdown.map((r) => (
            <div key={r.rep} className="stock-row-card">
              <div className="stock-row-card__body">
                <div className="stock-row-card__title">{r.rep}</div>
                <div className="stock-row-card__meta">
                  {r.territory} · {r.qty}
                </div>
              </div>
              <em
                className="stock-status-pill stock-row-card__pill"
                style={{
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
          {pharmaciesBreakdown.map((p) => (
            <div key={p.pharmacy} className="stock-row-card">
              <div className="stock-row-card__body">
                <div className="stock-row-card__title">{p.pharmacy}</div>
                <div className="stock-row-card__meta">
                  {p.qty} · {p.meta}
                </div>
              </div>
              <em
                className="stock-status-pill stock-row-card__pill"
                style={{ background: 'rgba(22, 163, 74, 0.15)', color: 'var(--green-text)' }}
              >
                {p.status}
              </em>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Movements */}
      {tab === 'movements' && (
        <div style={{ marginTop: '14px' }}>
          {/* Filter chips wrap instead of scrolling horizontally */}
          <div className="stock-chip-row">
            {['all', 'receipt', 'sell_in', 'sell_out', 'sample', 'transfer_rep', 'adjustment', 'return'].map((type) => (
              <button
                key={type}
                type="button"
                className={movementFilter === type ? 'active' : ''}
                onClick={() => setMovementFilter(type)}
              >
                {type === 'all' ? t('stock.detail.filterAll') : type.replace('_', '-')}
              </button>
            ))}
          </div>

          <div className="stock-move-list">
            {productMovements.length > 0 ? (
              productMovements.map((m) => {
                const isPositive = m.type === 'receipt' || m.type === 'return' || (m.type === 'adjustment' && m.quantity > 0)
                const chip = MOVEMENT_CHIP[m.type] ?? MOVEMENT_CHIP.other
                const chipStyle: CSSProperties = {
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  background: chip.background,
                  color: chip.color,
                  whiteSpace: 'nowrap',
                }
                return (
                  <div key={m.id} className="stock-move-row">
                    <div className="stock-move-row__body">
                      <div className="stock-move-row__head">
                        <span style={chipStyle}>{m.type.replace('_', ' ')}</span>
                        <strong>{m.batchNumber || 'Batch General'}</strong>
                      </div>
                      <div className="stock-move-row__meta" style={{ unicodeBidi: 'plaintext' }}>
                        {m.date}
                        {m.customerName ? ` · ${m.customerName}` : ''}
                        {m.repName ? ` · Rep: ${m.repName}` : ''}
                        {m.reason ? ` · Reason: ${m.reason}` : ''}
                      </div>
                    </div>

                    <div className="stock-move-row__qty">
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
    </Drawer>
  )
}
