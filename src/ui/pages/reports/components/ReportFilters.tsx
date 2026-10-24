'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, ChevronRight, X } from 'lucide-react'
import { Chip } from '@/ui/design-system/components/Chip'
import { Button } from '@/ui/design-system/components/Button'
import { Avatar } from '@/ui/design-system/components/Avatar'

export interface ReportFiltersState {
  month: string
  regions: string[]
  reps: string[]
  products: string[]
}

export interface ReportFiltersProps {
  filters: ReportFiltersState
  onChangeFilters: (f: ReportFiltersState) => void
  role?: 'admin' | 'rep'
  currentUserName?: string
}

const ALL_MONTHS = [
  'October 2026',
  'September 2026',
  'August 2026',
  'July 2026',
  'Q3 2026 (Jul - Sep)',
  'Q2 2026 (Apr - Jun)',
  'YTD 2026',
]
const ALL_REGIONS = ['Central District', 'North District', 'West District', 'East District', 'South District']
const ALL_REPS = ['Alex Morgan', 'Maya Patel', 'Olivia Martin', 'James Wilson', 'Sofia Chen']
const ALL_PRODUCTS = ['Bevato', 'Naviro D3 50,000 IU', 'Naviro D3 10,000 IU', 'Naviro D3 Drops', 'Navigen Product 5']

export function ReportFilters({
  filters,
  onChangeFilters,
  role = 'admin',
  currentUserName = 'Alex Morgan',
}: ReportFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<'month' | 'region' | 'rep' | 'product' | null>(null)

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

  // Label generators
  const monthLabel = filters.month
  const regionsLabel =
    filters.regions.length === 0
      ? 'All regions'
      : filters.regions.length === 1
      ? filters.regions[0]
      : `${filters.regions.length} regions`

  const repsLabel =
    role === 'rep'
      ? currentUserName
      : filters.reps.length === 0
      ? 'All reps'
      : filters.reps.length === 1
      ? filters.reps[0]
      : `${filters.reps.length} reps`

  const productsLabel =
    filters.products.length === 0
      ? 'All products'
      : filters.products.length === 1
      ? filters.products[0]
      : `${filters.products.length} products`

  return (
    <div
      ref={dropdownRef}
      className="home-filters-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
        marginBottom: '20px',
        overflowX: 'auto',
      }}
    >
      {/* 1. Month Dropdown */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <Chip
          active={filters.month !== 'October 2026' || openDropdown === 'month'}
          onClick={() => openFilter('month')}
          aria-expanded={openDropdown === 'month'}
          className="home-filter-chip"
        >
          <span>{monthLabel}</span>
          <ChevronDown />
        </Chip>
        {openDropdown === 'month' && (
          <div
            className="panel"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 35,
              minWidth: '220px',
              padding: '12px',
              boxShadow: 'var(--shadow-raised)',
              borderRadius: '20px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-text)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Select Time Range
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
              {ALL_MONTHS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDraftMonth(m)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: draftMonth === m ? 'var(--mist)' : 'transparent',
                    color: draftMonth === m ? 'var(--navy)' : 'var(--heading-text)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: draftMonth === m ? 600 : 400,
                    textAlign: 'left',
                  }}
                >
                  <span>{m}</span>
                  {draftMonth === m && <Check style={{ width: '15px', height: '15px' }} />}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              <Button variant="secondary" onClick={handleClearMonth} style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}>
                Reset
              </Button>
              <Button variant="primary" onClick={handleApplyMonth} style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Regions Dropdown */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <Chip
          active={filters.regions.length > 0 || openDropdown === 'region'}
          onClick={() => openFilter('region')}
          aria-expanded={openDropdown === 'region'}
          className="home-filter-chip"
        >
          <span>{regionsLabel}</span>
          <ChevronDown />
        </Chip>
        {openDropdown === 'region' && (
          <div
            className="panel"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 35,
              minWidth: '240px',
              padding: '12px',
              boxShadow: 'var(--shadow-raised)',
              borderRadius: '20px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-text)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Filter by Region
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
              {ALL_REGIONS.map((reg) => {
                const checked = draftRegions.includes(reg)
                return (
                  <label
                    key={reg}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--heading-text)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMultiSelect(reg, draftRegions, setDraftRegions)}
                      style={{ accentColor: 'var(--ocean)' }}
                    />
                    <span>{reg}</span>
                  </label>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              <Button variant="secondary" onClick={handleClearRegions} style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}>
                Clear
              </Button>
              <Button variant="primary" onClick={handleApplyRegions} style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Reps Dropdown (Disabled/Locked if role === 'rep') */}
      {role === 'admin' && (
        <div style={{ position: 'relative' }}>
          <Chip
            active={filters.reps.length > 0 || openDropdown === 'rep'}
            onClick={() => openFilter('rep')}
            aria-expanded={openDropdown === 'rep'}
            className="home-filter-chip"
          >
            <span>{repsLabel}</span>
            <ChevronDown />
          </Chip>
          {openDropdown === 'rep' && (
            <div
              className="panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                zIndex: 35,
                minWidth: '250px',
                padding: '12px',
                boxShadow: 'var(--shadow-raised)',
                borderRadius: '20px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-text)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Filter by Representative
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                {ALL_REPS.map((r) => {
                  const checked = draftReps.includes(r)
                  const initials = r.split(' ').map((n) => n[0]).join('')
                  return (
                    <label
                      key={r}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: 'var(--heading-text)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMultiSelect(r, draftReps, setDraftReps)}
                        style={{ accentColor: 'var(--ocean)' }}
                      />
                      <Avatar initials={initials} size="sm" />
                      <span>{r}</span>
                    </label>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                <Button variant="secondary" onClick={handleClearReps} style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}>
                  Clear
                </Button>
                <Button variant="primary" onClick={handleApplyReps} style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}>
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Products Dropdown */}
      <div style={{ position: 'relative' }}>
        <Chip
          active={filters.products.length > 0 || openDropdown === 'product'}
          onClick={() => openFilter('product')}
          aria-expanded={openDropdown === 'product'}
          className="home-filter-chip"
        >
          <span>{productsLabel}</span>
          <ChevronDown />
        </Chip>
        {openDropdown === 'product' && (
          <div
            className="panel"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 35,
              minWidth: '260px',
              padding: '12px',
              boxShadow: 'var(--shadow-raised)',
              borderRadius: '20px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-text)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Filter by Product
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
              {ALL_PRODUCTS.map((prod) => {
                const checked = draftProducts.includes(prod)
                return (
                  <label
                    key={prod}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--heading-text)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMultiSelect(prod, draftProducts, setDraftProducts)}
                      style={{ accentColor: 'var(--ocean)' }}
                    />
                    <span>{prod}</span>
                  </label>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              <Button variant="secondary" onClick={handleClearProducts} style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}>
                Clear
              </Button>
              <Button variant="primary" onClick={handleApplyProducts} style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Active Filter Removable Tags */}
      {(filters.regions.length > 0 || filters.reps.length > 0 || filters.products.length > 0) && (
        <button
          onClick={() => onChangeFilters({ ...filters, regions: [], reps: [], products: [] })}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ocean)',
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'underline',
            marginLeft: 'auto',
          }}
        >
          Reset all filters
        </button>
      )}
    </div>
  )
}
