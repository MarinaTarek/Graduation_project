import { useState, useRef, useEffect } from 'react'
import { Filter, LayoutGrid, List, Search, X } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { DropdownPortal } from '@/ui/design-system/components/DropdownPortal'

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

export function StockToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onToggleView,
  activeFilters,
  onApplyFilters,
  onClearFilters,
}: StockToolbarProps) {
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
          placeholder="Search stock..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div ref={filterBtnRef} style={{ position: 'relative' }}>
        <Button
          variant={activeCount > 0 ? 'primary' : 'secondary'}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Filter data-icon="inline-start" /> Filters
          {activeCount > 0 && ` (${activeCount})`}
        </Button>

        <DropdownPortal
          isOpen={isOpen}
          anchorEl={filterBtnRef.current}
          onClose={() => setIsOpen(false)}
          width={300}
          align="right"
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span className="eyebrow">STOCK FILTERS</span>
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
                Product SKU
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
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              {/* Expiry Status */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)' }}>
                Stock / Expiry Status
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
                    <option key={es} value={es}>{es}</option>
                  ))}
                </select>
              </label>

              {/* Location */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)' }}>
                Inventory Location
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
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <Button variant="secondary" style={{ flex: 1, padding: '6px' }} onClick={handleClear}>
                Clear
              </Button>
              <Button variant="primary" style={{ flex: 1, padding: '6px' }} onClick={handleApply}>
                Apply
              </Button>
            </div>
        </DropdownPortal>
      </div>

      <Button variant="secondary" onClick={onToggleView} title={`Switch to ${viewMode === 'list' ? 'Cards' : 'List'} view`}>
        {viewMode === 'list' ? (
          <>
            <LayoutGrid data-icon="inline-start" /> Cards
          </>
        ) : (
          <>
            <List data-icon="inline-start" /> List
          </>
        )}
      </Button>
    </div>
  )
}
