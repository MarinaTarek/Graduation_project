import { useState } from 'react'
import { Package, Plus } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Chip } from '@/ui/design-system/components/Chip'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { StockToolbar, type StockFiltersState } from './components/StockToolbar'
import { StockListItem } from './components/StockListItem'
import { stockProductsStore } from '@/data/mock/products'
import { useStore } from '@/data/mock/store'

export interface StockPageProps {
  onAdd: () => void
  onItem: () => void
  filter?: string | null
  onClearFilter?: () => void
  role?: 'admin' | 'rep'
  currentUserName?: string
}

export default function StockPage({
  onAdd,
  onItem,
  filter,
  onClearFilter,
  role = 'admin',
  currentUserName = 'Alex Morgan',
}: StockPageProps) {
  const stockProductsMockData = useStore(stockProductsStore)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [activeFilters, setActiveFilters] = useState<StockFiltersState>({
    product: 'All products',
    expiryStatus: 'All expiry statuses',
    location: 'All locations',
  })

  // Role scoping: Reps primarily monitor items available in their territory or buffer
  const roleScopedStock = role === 'rep'
    ? stockProductsMockData.filter((p) => p.location === 'With reps' || p.status === 'Low stock')
    : stockProductsMockData

  // Apply search and popover filters
  const displayedStock = roleScopedStock.filter((item) => {
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
    const scoreA = a.status === 'Expiring batch' ? 0 : a.status === 'Low stock' ? 1 : 2
    const scoreB = b.status === 'Expiring batch' ? 0 : b.status === 'Low stock' ? 1 : 2
    return scoreA - scoreB
  })

  const removeProduct = () => setActiveFilters((prev) => ({ ...prev, product: 'All products' }))
  const removeExpiry = () => setActiveFilters((prev) => ({ ...prev, expiryStatus: 'All expiry statuses' }))
  const removeLocation = () => setActiveFilters((prev) => ({ ...prev, location: 'All locations' }))

  const hasAnyFilter =
    activeFilters.product !== 'All products' ||
    activeFilters.expiryStatus !== 'All expiry statuses' ||
    activeFilters.location !== 'All locations' ||
    Boolean(filter)

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Package /> INVENTORY CONTROL
          </span>
          <h1>Stock</h1>
          <p className="story">
            Know what is moving, what is aging, and what needs attention.
          </p>
        </div>
        <Button variant="primary" onClick={onAdd}>
          <Plus data-icon="inline-start" /> Add new
        </Button>
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
          <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>Active filters:</span>
          {activeFilters.product !== 'All products' && (
            <Chip active onClick={removeProduct} title="Clear product filter">
              {activeFilters.product} &times;
            </Chip>
          )}
          {activeFilters.expiryStatus !== 'All expiry statuses' && (
            <Chip active onClick={removeExpiry} title="Clear status filter">
              {activeFilters.expiryStatus} &times;
            </Chip>
          )}
          {activeFilters.location !== 'All locations' && (
            <Chip active onClick={removeLocation} title="Clear location filter">
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
            ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }
            : undefined
        }
      >
        {sortedStock.length > 0 ? (
          sortedStock.map((item) => (
            <StockListItem key={item.name} item={item} onClick={onItem} />
          ))
        ) : (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted-text)' }}>
            No stock products match the selected filters.
          </div>
        )}
      </div>

      <EmptyState />
    </section>
  )
}
