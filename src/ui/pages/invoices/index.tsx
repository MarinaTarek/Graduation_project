import { useState } from 'react'
import { FileText, Plus } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Chip } from '@/ui/design-system/components/Chip'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { InvoiceToolbar, type InvoiceFiltersState } from './components/InvoiceToolbar'
import { InvoiceListItem } from './components/InvoiceListItem'
import { invoicesStore } from '@/data/mock/invoices'
import { useStore } from '@/data/mock/store'
import { useT } from '@/lib/i18n'

export interface InvoicesPageProps {
  onAdd: () => void
  onItem: () => void
  filter?: string | null
  onClearFilter?: () => void
  role?: 'admin' | 'rep'
  currentUserName?: string
}

export default function InvoicesPage({
  onAdd,
  onItem,
  filter,
  onClearFilter,
  role = 'admin',
  currentUserName = 'Alex Morgan',
}: InvoicesPageProps) {
  const { t } = useT()
  const invoicesMockData = useStore(invoicesStore)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [activeFilters, setActiveFilters] = useState<InvoiceFiltersState>({
    status: filter || 'All statuses',
    dateRange: 'All time',
    source: 'All sources',
  })

  // Role scoping: Reps only see their assigned invoices
  const roleScopedInvoices = role === 'rep'
    ? invoicesMockData.filter((inv) => inv.repName.toLowerCase() === currentUserName.toLowerCase())
    : invoicesMockData

  // Apply search and popover filters
  const displayedInvoices = roleScopedInvoices.filter((invoice) => {
    // 1. Search text
    if (searchQuery) {
      const matchName = invoice.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchMeta = invoice.meta.toLowerCase().includes(searchQuery.toLowerCase())
      if (!matchName && !matchMeta) return false
    }

    // 2. Status (from navigation filter or popover)
    const effectiveStatus = filter || activeFilters.status
    if (effectiveStatus !== 'All statuses' && invoice.status.toLowerCase() !== effectiveStatus.toLowerCase()) {
      return false
    }

    // 3. Date range
    if (activeFilters.dateRange !== 'All time' && invoice.dateRange !== activeFilters.dateRange) {
      return false
    }

    // 4. Source
    if (activeFilters.source !== 'All sources' && invoice.source !== activeFilters.source) {
      return false
    }

    return true
  })

  const [sortField, setSortField] = useState<'id' | 'status'>('id')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const toggleSort = (field: 'id' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Sorted list: default newest first
  const sortedInvoices = [...displayedInvoices].sort((a, b) => {
    if (sortField === 'id') {
      const cmp = a.name.localeCompare(b.name)
      return sortOrder === 'desc' ? -cmp : cmp
    } else {
      const cmp = a.status.localeCompare(b.status)
      return sortOrder === 'desc' ? -cmp : cmp
    }
  })

  const removeStatus = () => {
    setActiveFilters((prev) => ({ ...prev, status: 'All statuses' }))
    if (onClearFilter) onClearFilter()
  }

  const removeDateRange = () => setActiveFilters((prev) => ({ ...prev, dateRange: 'All time' }))
  const removeSource = () => setActiveFilters((prev) => ({ ...prev, source: 'All sources' }))

  const effectiveStatus = filter || activeFilters.status
  const hasAnyFilter =
    effectiveStatus !== 'All statuses' ||
    activeFilters.dateRange !== 'All time' ||
    activeFilters.source !== 'All sources'

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <FileText /> {t('invoices.eyebrow')}
          </span>
          <h1>{t('invoices.title')}</h1>
          <p className="story">{t('invoices.story')}</p>
        </div>
        <Button variant="primary" onClick={onAdd}>
          <Plus data-icon="inline-start" /> {t('invoices.addNew')}
        </Button>
      </div>

      <InvoiceToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onToggleView={() => setViewMode(viewMode === 'list' ? 'cards' : 'list')}
        activeFilters={activeFilters}
        onApplyFilters={(f) => {
          setActiveFilters(f)
          if (filter && f.status !== filter && onClearFilter) {
            onClearFilter()
          }
        }}
        onClearFilters={() => {
          setActiveFilters({
            status: 'All statuses',
            dateRange: 'All time',
            source: 'All sources',
          })
          if (onClearFilter) onClearFilter()
        }}
      />

      {/* Applied Removable Filter Chips */}
      {hasAnyFilter && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', margin: '0 0 16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>{t('invoices.activeFilters')}</span>
          {effectiveStatus !== 'All statuses' && (
            <Chip active onClick={removeStatus} title={t('invoices.clearStatusFilter')}>
              {effectiveStatus} &times;
            </Chip>
          )}
          {activeFilters.dateRange !== 'All time' && (
            <Chip active onClick={removeDateRange} title={t('invoices.clearDateRangeFilter')}>
              {activeFilters.dateRange} &times;
            </Chip>
          )}
          {activeFilters.source !== 'All sources' && (
            <Chip active onClick={removeSource} title={t('invoices.clearSourceFilter')}>
              {activeFilters.source} &times;
            </Chip>
          )}
        </div>
      )}

      {/* Sortable Column Headers */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 16px', fontSize: '11px', color: 'var(--muted-text)', fontWeight: 600 }}>
          <button
            onClick={() => toggleSort('id')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 600, padding: 0 }}
          >
            {t('invoices.table.invoice')} {sortField === 'id' ? (sortOrder === 'desc' ? '▼' : '▲') : ''}
          </button>
          <button
            onClick={() => toggleSort('status')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 600, padding: 0 }}
          >
            {t('invoices.table.status')} {sortField === 'status' ? (sortOrder === 'desc' ? '▼' : '▲') : ''}
          </button>
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
        {sortedInvoices.length > 0 ? (
          sortedInvoices.map((invoice) => (
            <InvoiceListItem key={invoice.name} item={invoice} onClick={onItem} />
          ))
        ) : (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted-text)' }}>
            {t('invoices.noMatches')}
          </div>
        )}
      </div>

      <EmptyState />
    </section>
  )
}
