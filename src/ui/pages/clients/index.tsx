import { useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Chip } from '@/ui/design-system/components/Chip'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { ClientToolbar, type ClientFiltersState } from './components/ClientToolbar'
import { ClientListItem } from './components/ClientListItem'
import { clientsMockData } from './mock-data'

export interface ClientsPageProps {
  onAdd: () => void
  onItem: () => void
  filter?: string | null
  onClearFilter?: () => void
  role?: 'admin' | 'rep'
  currentUserName?: string
}

export default function ClientsPage({
  onAdd,
  onItem,
  filter,
  onClearFilter,
  role = 'admin',
  currentUserName = 'Alex Morgan',
}: ClientsPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [activeFilters, setActiveFilters] = useState<ClientFiltersState>({
    specialty: 'All specialties',
    classification: 'All classes',
    region: 'All regions',
    overdueOnly: filter === 'Overdue only' || filter?.toLowerCase() === 'overdue',
  })

  // Role scoping: Reps only see their assigned clients
  const roleScopedClients = role === 'rep'
    ? clientsMockData.filter((c) =>
        (c.repName && c.repName.toLowerCase() === currentUserName.toLowerCase()) ||
        (c.rep_id && currentUserName && c.rep_id.toLowerCase().includes(currentUserName.toLowerCase().split(' ')[0]))
      )
    : clientsMockData

  // Apply search and popover filters
  const displayedClients = roleScopedClients.filter((client) => {
    // 1. Search text
    if (searchQuery) {
      const matchName = client.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchMeta = client.meta.toLowerCase().includes(searchQuery.toLowerCase())
      if (!matchName && !matchMeta) return false
    }

    // 2. Navigation filter or popover overdue filter
    const isOverdueFiltered = activeFilters.overdueOnly || filter === 'Overdue only'
    if (isOverdueFiltered && client.status.toLowerCase() !== 'overdue') {
      return false
    }

    // 3. Specialty
    if (activeFilters.specialty !== 'All specialties' && client.specialty !== activeFilters.specialty) {
      return false
    }

    // 4. Classification
    if (activeFilters.classification !== 'All classes' && client.classification !== activeFilters.classification) {
      return false
    }

    // 5. Region
    if (activeFilters.region !== 'All regions' && client.region !== activeFilters.region) {
      return false
    }

    return true
  })

  // Default sorting: clients by priority (Overdue first, then Class A)
  const sortedClients = [...displayedClients].sort((a, b) => {
    if (a.status === 'Overdue' && b.status !== 'Overdue') return -1
    if (b.status === 'Overdue' && a.status !== 'Overdue') return 1
    if (a.classification === 'Class A' && b.classification !== 'Class A') return -1
    if (b.classification === 'Class A' && a.classification !== 'Class A') return 1
    return 0
  })

  const removeSpecialty = () => setActiveFilters((prev) => ({ ...prev, specialty: 'All specialties' }))
  const removeClassification = () => setActiveFilters((prev) => ({ ...prev, classification: 'All classes' }))
  const removeRegion = () => setActiveFilters((prev) => ({ ...prev, region: 'All regions' }))
  const removeOverdue = () => {
    setActiveFilters((prev) => ({ ...prev, overdueOnly: false }))
    if (onClearFilter) onClearFilter()
  }

  const hasAnyFilter =
    activeFilters.specialty !== 'All specialties' ||
    activeFilters.classification !== 'All classes' ||
    activeFilters.region !== 'All regions' ||
    activeFilters.overdueOnly ||
    Boolean(filter)

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Users /> RELATIONSHIPS
          </span>
          <h1>Clients</h1>
          <p className="story">Every relationship, remembered.</p>
        </div>
        <Button variant="primary" onClick={onAdd}>
          <Plus data-icon="inline-start" /> Add new
        </Button>
      </div>

      <ClientToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onToggleView={() => setViewMode(viewMode === 'list' ? 'cards' : 'list')}
        activeFilters={activeFilters}
        onApplyFilters={setActiveFilters}
        onClearFilters={() => {
          setActiveFilters({
            specialty: 'All specialties',
            classification: 'All classes',
            region: 'All regions',
            overdueOnly: false,
          })
          if (onClearFilter) onClearFilter()
        }}
      />

      {/* Applied Removable Filter Chips */}
      {hasAnyFilter && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', margin: '0 0 16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>Active filters:</span>
          {(activeFilters.overdueOnly || filter === 'Overdue only') && (
            <Chip active onClick={removeOverdue} title="Clear overdue filter">
              Overdue only &times;
            </Chip>
          )}
          {activeFilters.specialty !== 'All specialties' && (
            <Chip active onClick={removeSpecialty} title="Clear specialty filter">
              {activeFilters.specialty} &times;
            </Chip>
          )}
          {activeFilters.classification !== 'All classes' && (
            <Chip active onClick={removeClassification} title="Clear classification filter">
              {activeFilters.classification} &times;
            </Chip>
          )}
          {activeFilters.region !== 'All regions' && (
            <Chip active onClick={removeRegion} title="Clear region filter">
              {activeFilters.region} &times;
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
        {sortedClients.length > 0 ? (
          sortedClients.map((client) => (
            <ClientListItem key={client.name} item={client} onClick={onItem} />
          ))
        ) : (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted-text)' }}>
            No clients match the selected filters.
          </div>
        )}
      </div>

      <EmptyState />
    </section>
  )
}
