import { useState, useRef, useEffect } from 'react'
import { Filter, LayoutGrid, List, Search, X } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { DropdownPortal } from '@/ui/design-system/components/DropdownPortal'
import { useT } from '@/lib/i18n'

export interface StockFiltersState {
  product: string
  expiryStatus: string
  location: string
}

export interface StockToolbarProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  viewMode: 'list' | 'cards'
  onToggleView: () => void
  activeFilters: StockFiltersState
  onApplyFilters: (f: StockFiltersState) => void
  onClearFilters: () => void
}

const PRODUCTS = ['All products', 'Bevato', 'Naviro D3 50,000 IU', 'Naviro D3 10,000 IU', 'Naviro D3 Drops', 'Navigen Product 5']
const EXPIRY_STATUSES = ['All expiry statuses', 'Low stock / Expiring soon', 'Healthy']
const LOCATIONS = ['All locations', 'Warehouse', 'With reps', 'Consigned pharmacies']

const PRODUCT_KEYS: Record<string, string> = {
  'All products': 'stock.toolbar.allProducts',
}

const EXPIRY_KEYS: Record<string, string> = {
  'All expiry statuses': 'stock.toolbar.allExpiryStatuses',
  'Low stock / Expiring soon': 'stock.toolbar.lowStockExpiringSoon',
  'Healthy': 'stock.toolbar.healthy',
}

const LOCATION_KEYS: Record<string, string> = {
  'All locations': 'stock.toolbar.allLocations',
  'Warehouse': 'stock.toolbar.warehouse',
  'With reps': 'stock.toolbar.withReps',
  'Consigned pharmacies': 'stock.toolbar.consignedPharmacies',
}

export function StockToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onToggleView,
  activeFilters,
  onApplyFilters,
  onClearFilters,
}: StockToolbarProps) {
  const { t } = useT()
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<StockFiltersState>(activeFilters)
  const filterBtnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDraft(activeFilters)
  }, [activeFilters])

  const handleApply = () => {
    onApplyFilters(draft)
    setIsOpen(false)
  }

  const handleClear = () => {
    const empty: StockFiltersState = {
      product: 'All products',
      expiryStatus: 'All expiry statuses',
      location: 'All locations',
    }
    setDraft(empty)
    onClearFilters()
    setIsOpen(false)
  }

  const activeCount =
    (activeFilters.product !== 'All products' ? 1 : 0) +
    (activeFilters.expiryStatus !== 'All expiry statuses' ? 1 : 0) +
    (activeFilters.location !== 'All locations' ? 1 : 0)

  return (
    <div className="collection-toolbar" style={{ position: 'relative' }}>
      <div className="search-inline">
        <Search />
        <input
          placeholder={t('stock.toolbar.search')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div ref={filterBtnRef} style={{ position: 'relative' }}>
        <Button
          variant={activeCount > 0 ? 'primary' : 'secondary'}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Filter data-icon="inline-start" /> {activeCount > 0 ? t('stock.toolbar.filtersCount', { count: activeCount }) : t('stock.toolbar.filters')}
        </Button>

        <DropdownPortal
          isOpen={isOpen}
          anchorEl={filterBtnRef.current}
          onClose={() => setIsOpen(false)}
          width={300}
          align="right"
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span className="eyebrow">{t('stock.toolbar.filtersEyebrow')}</span>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--muted-text)' }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Product */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)' }}>
                {t('stock.toolbar.productSku')}
                <select
                  value={draft.product}
                  onChange={(e) => setDraft({ ...draft, product: e.target.value })}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-input)',
                    background: 'var(--input-bg)',
                    color: 'var(--input-text)',
                  }}
                >
                  {PRODUCTS.map((p) => (
                    <option key={p} value={p}>{PRODUCT_KEYS[p] ? t(PRODUCT_KEYS[p] as any) : p}</option>
                  ))}
                </select>
              </label>

              {/* Expiry Status */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)' }}>
                {t('stock.toolbar.expiryStatus')}
                <select
                  value={draft.expiryStatus}
                  onChange={(e) => setDraft({ ...draft, expiryStatus: e.target.value })}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-input)',
                    background: 'var(--input-bg)',
                    color: 'var(--input-text)',
                  }}
                >
                  {EXPIRY_STATUSES.map((es) => (
                    <option key={es} value={es}>{EXPIRY_KEYS[es] ? t(EXPIRY_KEYS[es] as any) : es}</option>
                  ))}
                </select>
              </label>

              {/* Location */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)' }}>
                {t('stock.toolbar.inventoryLocation')}
                <select
                  value={draft.location}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-input)',
                    background: 'var(--input-bg)',
                    color: 'var(--input-text)',
                  }}
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{LOCATION_KEYS[loc] ? t(LOCATION_KEYS[loc] as any) : loc}</option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <Button variant="secondary" style={{ flex: 1, padding: '6px' }} onClick={handleClear}>
                {t('common.clear')}
              </Button>
              <Button variant="primary" style={{ flex: 1, padding: '6px' }} onClick={handleApply}>
                {t('common.apply')}
              </Button>
            </div>
        </DropdownPortal>
      </div>

      <Button
        variant="secondary"
        onClick={onToggleView}
        title={t('stock.toolbar.switchTo', { view: viewMode === 'list' ? t('stock.toolbar.cards') : t('stock.toolbar.list') })}
      >
        {viewMode === 'list' ? (
          <>
            <LayoutGrid data-icon="inline-start" /> {t('stock.toolbar.cards')}
          </>
        ) : (
          <>
            <List data-icon="inline-start" /> {t('stock.toolbar.list')}
          </>
        )}
      </Button>
    </div>
  )
}
