import { useState, useRef, useEffect } from 'react'
import { Filter, LayoutGrid, List, Search, X } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { DropdownPortal } from '@/ui/design-system/components/DropdownPortal'

export interface ClientFiltersState {
  specialty: string
  classification: string
  region: string
  overdueOnly: boolean
}

export interface ClientToolbarProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  viewMode: 'list' | 'cards'
  onToggleView: () => void
  activeFilters: ClientFiltersState
  onApplyFilters: (f: ClientFiltersState) => void
  onClearFilters: () => void
}

const SPECIALTIES = ['All specialties', 'Cardiology', 'Pharmacy', 'Pediatrics', 'General Medicine']
const CLASSIFICATIONS = ['All classes', 'Class A', 'Class B', 'Class C']
const REGIONS = ['All regions', 'North region', 'West region', 'Central region', 'East region']

export function ClientToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onToggleView,
  activeFilters,
  onApplyFilters,
  onClearFilters,
}: ClientToolbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<ClientFiltersState>(activeFilters)
  const filterBtnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDraft(activeFilters)
  }, [activeFilters])

  const handleApply = () => {
    onApplyFilters(draft)
    setIsOpen(false)
  }

  const handleClear = () => {
    const empty: ClientFiltersState = {
      specialty: 'All specialties',
      classification: 'All classes',
      region: 'All regions',
      overdueOnly: false,
    }
    setDraft(empty)
    onClearFilters()
    setIsOpen(false)
  }

  const activeCount =
    (activeFilters.specialty !== 'All specialties' ? 1 : 0) +
    (activeFilters.classification !== 'All classes' ? 1 : 0) +
    (activeFilters.region !== 'All regions' ? 1 : 0) +
    (activeFilters.overdueOnly ? 1 : 0)

  return (
    <div className="collection-toolbar" style={{ position: 'relative' }}>
      <div className="search-inline">
        <Search />
        <input
          placeholder="Search clients..."
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
            <span className="eyebrow">CLIENT FILTERS</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--muted-text)' }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Specialty */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)' }}>
              Specialty
              <select
                value={draft.specialty}
                onChange={(e) => setDraft({ ...draft, specialty: e.target.value })}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-input)',
                  background: 'var(--input-bg)',
                  color: 'var(--input-text)',
                }}
              >
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            {/* Classification */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)' }}>
              Classification
              <select
                value={draft.classification}
                onChange={(e) => setDraft({ ...draft, classification: e.target.value })}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-input)',
                  background: 'var(--input-bg)',
                  color: 'var(--input-text)',
                }}
              >
                {CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            {/* Region */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)' }}>
              Region
              <select
                value={draft.region}
                onChange={(e) => setDraft({ ...draft, region: e.target.value })}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-input)',
                  background: 'var(--input-bg)',
                  color: 'var(--input-text)',
                }}
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>

            {/* Overdue Only checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--card-text)', marginTop: '4px' }}>
              <input
                type="checkbox"
                checked={draft.overdueOnly}
                onChange={(e) => setDraft({ ...draft, overdueOnly: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              <span>Overdue for visit only</span>
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
