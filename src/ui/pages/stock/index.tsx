import { useState, useMemo } from 'react'
import { Package, Plus, ArrowDownLeft, Sliders, Send, ShoppingBag } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Chip } from '@/ui/design-system/components/Chip'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { Toast } from '@/ui/design-system/components/Toast'
import { StockToolbar, type StockFiltersState } from './components/StockToolbar'
import { StockListItem } from './components/StockListItem'
import { StockActionModal, type StockActionType } from './components/StockActionModal'
import { stockProductsStore } from '@/data/mock/products'
import { useStore } from '@/data/mock/store'
import {
  batchesStore,
  stockMovementsStore,
  deriveProductStock,
  type DerivedProductStock,
} from '@/data/mock/stockDerived'
import { useT } from '@/lib/i18n'

export interface StockPageProps {
  onAdd: () => void
  onItem: () => void
  onSelectProduct?: (name: string) => void
  filter?: string | null
  onClearFilter?: () => void
  role?: 'admin' | 'rep'
  currentUserName?: string
}

export default function StockPage({
  onAdd,
  onItem,
  onSelectProduct,
  filter,
  onClearFilter,
  role = 'admin',
  currentUserName = 'Alex Morgan',
}: StockPageProps) {
  const { t } = useT()
  const stockProductsMockData = useStore(stockProductsStore)
  const batches = useStore(batchesStore)
  const movements = useStore(stockMovementsStore)

  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [activeFilters, setActiveFilters] = useState<StockFiltersState>({
    product: 'All products',
    expiryStatus: 'All expiry statuses',
    location: 'All locations',
  })

  // Action modal
  const [activeAction, setActiveAction] = useState<StockActionType | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    window.setTimeout(() => setToastMessage(null), 5000)
  }

  // Precompute derived stock for all products
  const derivedMap = useMemo(() => {
    const map: Record<string, DerivedProductStock> = {}
    stockProductsMockData.forEach((p) => {
      map[p.name] = deriveProductStock(p.name, movements, batches, role, currentUserName)
    })
    return map
  }, [stockProductsMockData, movements, batches, role, currentUserName])

  // Role scoping: Reps monitor items available in their territory or buffer
  const roleScopedStock = role === 'rep'
    ? stockProductsMockData.filter((p) => p.location === 'With reps' || p.status === 'Low stock')
    : stockProductsMockData

  // Apply search and popover filters
  const displayedStock = roleScopedStock.filter((item) => {
    const derived = derivedMap[item.name]

    // 1. Search text
    if (searchQuery) {
      const matchName = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchMeta = item.meta.toLowerCase().includes(searchQuery.toLowerCase())
      if (!matchName && !matchMeta) return false
    }

    // 2. Product filter
    if (activeFilters.product !== 'All products' && item.name !== activeFilters.product) {
      return false
    }

    // 3. Expiry / stock status filter
    if (activeFilters.expiryStatus !== 'All expiry statuses') {
      if (activeFilters.expiryStatus.includes('Expiring') && (!derived || derived.expiring_90d_qty <= 0)) {
        return false
      }
      if (activeFilters.expiryStatus.includes('Low stock') && item.status !== 'Low stock') {
        return false
      }
      if (activeFilters.expiryStatus === 'Healthy' && item.status !== 'Healthy') {
        return false
      }
    }

    // 4. Location filter
    if (activeFilters.location !== 'All locations' && item.location !== activeFilters.location) {
      return false
    }

    return true
  })

  // Default sorting: Stock by expiry urgency (Expiring / Low stock first)
  const sortedStock = [...displayedStock].sort((a, b) => {
    const derA = derivedMap[a.name]
    const derB = derivedMap[b.name]
    const expA = (derA?.expiring_90d_qty ?? 0) > 0 ? 0 : a.status === 'Low stock' ? 1 : 2
    const expB = (derB?.expiring_90d_qty ?? 0) > 0 ? 0 : b.status === 'Low stock' ? 1 : 2
    return expA - expB
  })

  const removeProduct = () => setActiveFilters((prev) => ({ ...prev, product: 'All products' }))
  const removeExpiry = () => setActiveFilters((prev) => ({ ...prev, expiryStatus: 'All expiry statuses' }))
  const removeLocation = () => setActiveFilters((prev) => ({ ...prev, location: 'All locations' }))

  const hasAnyFilter =
    activeFilters.product !== 'All products' ||
    activeFilters.expiryStatus !== 'All expiry statuses' ||
    activeFilters.location !== 'All locations' ||
    Boolean(filter)

  const handleItemClick = (prodName: string) => {
    if (onSelectProduct) onSelectProduct(prodName)
    onItem()
  }

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Package /> {t('stock.eyebrow')}
          </span>
          <h1>{t('stock.title')}</h1>
          <p className="story">
            {t('stock.story')}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            type="button"
            onClick={() => setActiveAction('receive')}
            style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowDownLeft size={15} /> {t('stock.actions.receiveStock')}
          </Button>

          <Button
            variant="secondary"
            type="button"
            onClick={() => setActiveAction('transfer')}
            style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Send size={15} /> {t('stock.actions.transferToRep')}
          </Button>

          <Button
            variant="secondary"
            type="button"
            onClick={() => setActiveAction('sell_out')}
            style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ShoppingBag size={15} /> {t('stock.actions.recordSellOut')}
          </Button>

          {role === 'admin' && (
            <Button
              variant="secondary"
              type="button"
              onClick={() => setActiveAction('adjustment')}
              style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Sliders size={15} /> {t('stock.actions.adjustment')}
            </Button>
          )}

          <Button variant="primary" onClick={onAdd}>
            <Plus data-icon="inline-start" /> {t('stock.actions.addProduct')}
          </Button>
        </div>
      </div>

      <StockToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onToggleView={() => setViewMode(viewMode === 'list' ? 'cards' : 'list')}
        activeFilters={activeFilters}
        onApplyFilters={setActiveFilters}
        onClearFilters={() => {
          setActiveFilters({
            product: 'All products',
            expiryStatus: 'All expiry statuses',
            location: 'All locations',
          })
          if (onClearFilter) onClearFilter()
        }}
      />

      {/* Applied Removable Filter Chips */}
      {hasAnyFilter && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', margin: '0 0 16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>{t('stock.filters.activeFilters')}</span>
          {activeFilters.product !== 'All products' && (
            <Chip active onClick={removeProduct} title={t('stock.filters.clearProduct')}>
              {activeFilters.product} &times;
            </Chip>
          )}
          {activeFilters.expiryStatus !== 'All expiry statuses' && (
            <Chip active onClick={removeExpiry} title={t('stock.filters.clearStatus')}>
              {activeFilters.expiryStatus} &times;
            </Chip>
          )}
          {activeFilters.location !== 'All locations' && (
            <Chip active onClick={removeLocation} title={t('stock.filters.clearLocation')}>
              {activeFilters.location} &times;
            </Chip>
          )}
        </div>
      )}

      {/* Collection items in List or Cards layout */}
      <div
        className="collection-list"
        style={
          viewMode === 'cards'
            ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }
            : undefined
        }
      >
        {sortedStock.length > 0 ? (
          sortedStock.map((item) => {
            const derived = derivedMap[item.name]

            if (viewMode === 'cards') {
              const total = Math.max(1, derived?.received ?? 1)
              const pctSold = Math.min(100, Math.round(((derived?.sell_out ?? 0) / total) * 100))
              const pctMarket = Math.min(100 - pctSold, Math.round(((derived?.in_market ?? 0) / total) * 100))
              const pctWarehouse = Math.max(0, 100 - pctSold - pctMarket)

              return (
                <div
                  key={item.name}
                  className="collection-card"
                  onClick={() => handleItemClick(item.name)}
                  role="button"
                  tabIndex={0}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '16px', display: 'block' }}>{item.name}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>{item.category}</span>
                    </div>
                    {derived && derived.expiring_90d_qty > 0 && (
                      <Chip active>{t('stock.card.expiringCount', { count: derived.expiring_90d_qty })}</Chip>
                    )}
                  </div>

                  {/* Mini Bar */}
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
                    <div style={{ width: `${pctSold}%`, background: 'var(--green-text, #16a34a)' }} />
                    <div style={{ width: `${pctMarket}%`, background: 'var(--ocean, #0284c7)' }} />
                    <div style={{ width: `${pctWarehouse}%`, background: 'var(--amber-text, #d97706)' }} />
                  </div>

                  {/* Plain 4 labels */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px',
                      fontSize: '12px',
                      paddingTop: '6px',
                      borderTop: '1px solid var(--border-soft)',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--muted-text)', display: 'block', fontSize: '11px' }}>{t('stock.card.received')}</span>
                      <strong>{derived?.received.toLocaleString() ?? item.qty}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-text)', display: 'block', fontSize: '11px' }}>{t('stock.card.inWarehouse')}</span>
                      <strong style={{ color: '#d97706' }}>{derived?.in_warehouse.toLocaleString() ?? item.left}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-text)', display: 'block', fontSize: '11px' }}>{t('stock.card.soldToCustomers')}</span>
                      <strong style={{ color: 'var(--ocean)' }}>{derived?.sell_in.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-text)', display: 'block', fontSize: '11px' }}>{t('stock.card.soldByCustomers')}</span>
                      <strong style={{ color: 'var(--green-text, #16a34a)' }}>{derived?.sell_out.toLocaleString()}</strong>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: 'var(--muted-text)', display: 'block', fontSize: '11px' }}>
                        {t('stock.card.marketSellThrough', {
                          market: derived?.in_market.toLocaleString() ?? '0',
                          sellThrough: derived?.sell_through_pct ?? 0,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <StockListItem
                key={item.name}
                item={item}
                derived={derived}
                onClick={() => handleItemClick(item.name)}
              />
            )
          })
        ) : (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted-text)' }}>
            {t('stock.noMatches')}
          </div>
        )}
      </div>

      <EmptyState />

      {/* Stock Action Modal */}
      <StockActionModal
        actionType={activeAction}
        onClose={() => setActiveAction(null)}
        onSuccess={showToast}
        role={role}
        currentUserName={currentUserName}
      />

      {toastMessage && <Toast message={toastMessage} />}
    </section>
  )
}
