import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, ChevronRight, X } from 'lucide-react'
import { Chip } from '@/ui/design-system/components/Chip'
import { Button } from '@/ui/design-system/components/Button'
import { Avatar } from '@/ui/design-system/components/Avatar'

export interface HomeFiltersState {
  month: string
  regions: string[]
  reps: string[]
  products: string[]
}

export interface HomeFiltersProps {
  range: string
  setRange: (r: string) => void
  filters: HomeFiltersState
  onChangeFilters: (f: HomeFiltersState) => void
}

const ALL_MONTHS = ['October 2026', 'September 2026', 'August 2026', 'July 2026']
const ALL_REGIONS = ['North region', 'West region', 'Central region', 'East region']
const ALL_REPS = ['Olivia Martin', 'Maya Patel', 'James Wilson', 'Sofia Chen']
const ALL_PRODUCTS = ['Cardiwell 20mg', 'Neurofen Plus', 'Immunex Kids', 'Gastrocalm', 'Respira 10mg']

export function HomeFilters({
  range,
  setRange,
  filters,
  onChangeFilters,
}: HomeFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<'month' | 'region' | 'rep' | 'product' | null>(null)

  // Local draft states before clicking "Apply"
  const [draftMonth, setDraftMonth] = useState(filters.month)
  const [draftRegions, setDraftRegions] = useState<string[]>(filters.regions)
  const [draftReps, setDraftReps] = useState<string[]>(filters.reps)
  const [draftProducts, setDraftProducts] = useState<string[]>(filters.products)

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  const openFilter = (type: 'month' | 'region' | 'rep' | 'product') => {
    if (openDropdown === type) {
      setOpenDropdown(null)
      return
    }
    // sync drafts with current committed filters
    setDraftMonth(filters.month)
    setDraftRegions(filters.regions)
    setDraftReps(filters.reps)
    setDraftProducts(filters.products)
    setOpenDropdown(type)
  }

  const toggleMultiSelect = (item: string, list: string[], setList: (arr: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item))
    } else {
      setList([...list, item])
    }
  }

  const handleApplyMonth = () => {
    onChangeFilters({ ...filters, month: draftMonth })
    setOpenDropdown(null)
  }

  const handleClearMonth = () => {
    const defaultMonth = 'October 2026'
    setDraftMonth(defaultMonth)
    onChangeFilters({ ...filters, month: defaultMonth })
    setOpenDropdown(null)
  }

  const handleApplyRegions = () => {
    onChangeFilters({ ...filters, regions: draftRegions })
    setOpenDropdown(null)
  }

  const handleClearRegions = () => {
    setDraftRegions([])
    onChangeFilters({ ...filters, regions: [] })
    setOpenDropdown(null)
  }

  const handleApplyReps = () => {
    onChangeFilters({ ...filters, reps: draftReps })
    setOpenDropdown(null)
  }

  const handleClearReps = () => {
    setDraftReps([])
    onChangeFilters({ ...filters, reps: [] })
    setOpenDropdown(null)
  }

  const handleApplyProducts = () => {
    onChangeFilters({ ...filters, products: draftProducts })
    setOpenDropdown(null)
  }

  const handleClearProducts = () => {
    setDraftProducts([])
    onChangeFilters({ ...filters, products: [] })
    setOpenDropdown(null)
  }

  // Chip label formatters
  const monthLabel = filters.month.split(' ')[0]
  const regionLabel = filters.regions.length === 0
    ? 'All regions'
    : filters.regions.length === 1
    ? filters.regions[0].replace(' region', '')
    : `${filters.regions.length} regions`

  const repLabel = filters.reps.length === 0
    ? 'All reps'
    : filters.reps.length === 1
    ? filters.reps[0].split(' ')[0]
    : `${filters.reps.length} reps`

  const productLabel = filters.products.length === 0
    ? 'All products'
    : filters.products.length === 1
    ? filters.products[0].split(' ')[0]
    : `${filters.products.length} products`

  return (
    <div className="home-filters-row" ref={dropdownRef}>
      <div className="home-filters-scroll">
        {/* 1. Month Filter */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Chip
            active={filters.month !== 'October 2026'}
            onClick={() => openFilter('month')}
            aria-expanded={openDropdown === 'month'}
            className="home-filter-chip"
          >
            {monthLabel} <ChevronDown style={{ width: '14px', height: '14px' }} />
          </Chip>

        {openDropdown === 'month' && (
          <div
            className="panel"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '8px',
              minWidth: '220px',
              zIndex: 30,
              padding: '12px',
              boxShadow: 'var(--shadow)',
            }}
          >
            <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
              SELECT MONTH
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {ALL_MONTHS.map((m) => (
                <button
                  key={m}
                  onClick={() => setDraftMonth(m)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: draftMonth === m ? 'var(--blue-tint)' : 'transparent',
                    color: draftMonth === m ? 'var(--ocean)' : 'var(--card-text)',
                    fontSize: '13px',
                    fontWeight: draftMonth === m ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {m}
                  {draftMonth === m && <Check style={{ width: '14px', height: '14px' }} />}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <Button variant="secondary" style={{ flex: 1, padding: '6px' }} onClick={handleClearMonth}>
                Reset
              </Button>
              <Button variant="primary" style={{ flex: 1, padding: '6px' }} onClick={handleApplyMonth}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Region Multi-select Filter */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <Chip
          active={filters.regions.length > 0}
          onClick={() => openFilter('region')}
          aria-expanded={openDropdown === 'region'}
          className="home-filter-chip"
        >
          {regionLabel} <ChevronDown style={{ width: '14px', height: '14px' }} />
        </Chip>

        {openDropdown === 'region' && (
          <div
            className="panel"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '8px',
              minWidth: '230px',
              zIndex: 30,
              padding: '12px',
              boxShadow: 'var(--shadow)',
            }}
          >
            <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
              FILTER REGIONS
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {ALL_REGIONS.map((reg) => {
                const isSelected = draftRegions.includes(reg)
                return (
                  <label
                    key={reg}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--card-text)',
                      background: isSelected ? 'var(--blue-tint)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMultiSelect(reg, draftRegions, setDraftRegions)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{reg}</span>
                  </label>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <Button variant="secondary" style={{ flex: 1, padding: '6px' }} onClick={handleClearRegions}>
                Clear
              </Button>
              <Button variant="primary" style={{ flex: 1, padding: '6px' }} onClick={handleApplyRegions}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Rep Multi-select Filter (with avatars) */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <Chip
          active={filters.reps.length > 0}
          onClick={() => openFilter('rep')}
          aria-expanded={openDropdown === 'rep'}
          className="home-filter-chip"
        >
          {repLabel} <ChevronDown style={{ width: '14px', height: '14px' }} />
        </Chip>

        {openDropdown === 'rep' && (
          <div
            className="panel"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '8px',
              minWidth: '250px',
              zIndex: 30,
              padding: '12px',
              boxShadow: 'var(--shadow)',
            }}
          >
            <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
              FIELD REPRESENTATIVES
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {ALL_REPS.map((rep, idx) => {
                const isSelected = draftReps.includes(rep)
                const initials = rep.split(' ').map((n) => n[0]).join('')
                return (
                  <label
                    key={rep}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--card-text)',
                      background: isSelected ? 'var(--blue-tint)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMultiSelect(rep, draftReps, setDraftReps)}
                      style={{ cursor: 'pointer' }}
                    />
                    <Avatar initials={initials} variant="rep" repIndex={idx} size="sm" />
                    <span>{rep}</span>
                  </label>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <Button variant="secondary" style={{ flex: 1, padding: '6px' }} onClick={handleClearReps}>
                Clear
              </Button>
              <Button variant="primary" style={{ flex: 1, padding: '6px' }} onClick={handleApplyReps}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Product Multi-select Filter */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <Chip
          active={filters.products.length > 0}
          onClick={() => openFilter('product')}
          aria-expanded={openDropdown === 'product'}
          className="home-filter-chip"
        >
          {productLabel} <ChevronDown style={{ width: '14px', height: '14px' }} />
        </Chip>

        {openDropdown === 'product' && (
          <div
            className="panel"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '8px',
              minWidth: '240px',
              zIndex: 30,
              padding: '12px',
              boxShadow: 'var(--shadow)',
            }}
          >
            <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
              PRODUCT PORTFOLIO
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {ALL_PRODUCTS.map((prod) => {
                const isSelected = draftProducts.includes(prod)
                return (
                  <label
                    key={prod}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--card-text)',
                      background: isSelected ? 'var(--blue-tint)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMultiSelect(prod, draftProducts, setDraftProducts)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{prod}</span>
                  </label>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <Button variant="secondary" style={{ flex: 1, padding: '6px' }} onClick={handleClearProducts}>
                Clear
              </Button>
              <Button variant="primary" style={{ flex: 1, padding: '6px' }} onClick={handleApplyProducts}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Segmented Range Toggle */}
      <div
        className="home-range-segmented"
        role="group"
        aria-label="Time range toggle"
      >
        <button
          type="button"
          className={range === 'Month' ? 'active' : ''}
          onClick={() => setRange('Month')}
        >
          Month
        </button>
        <button
          type="button"
          className={range === 'Week' ? 'active' : ''}
          onClick={() => setRange('Week')}
        >
          Week
        </button>
      </div>
    </div>
  )
}
