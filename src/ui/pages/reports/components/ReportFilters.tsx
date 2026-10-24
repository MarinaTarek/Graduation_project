'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Avatar } from '@/ui/design-system/components/Avatar'
import { FilterDropdown } from '@/ui/design-system/components/FilterDropdown'

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
    <div className="reports-filters-row">
      {/* 1. Month Dropdown */}
      <FilterDropdown
        label={monthLabel}
        active={filters.month !== 'October 2026'}
        isOpen={openDropdown === 'month'}
        onToggle={() => openFilter('month')}
        onClose={() => setOpenDropdown(null)}
        title="SELECT MONTH"
        width={240}
        onReset={handleClearMonth}
        resetLabel="Reset"
        onApply={handleApplyMonth}
      >
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
              border: 'none',
              background: draftMonth === m ? 'var(--blue-tint)' : 'transparent',
              color: draftMonth === m ? 'var(--ocean)' : 'var(--card-text)',
              fontSize: '13px',
              fontWeight: draftMonth === m ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span>{m}</span>
            {draftMonth === m && <Check style={{ width: '14px', height: '14px' }} />}
          </button>
        ))}
      </FilterDropdown>

      {/* 2. Regions Dropdown */}
      <FilterDropdown
        label={regionsLabel}
        active={filters.regions.length > 0}
        isOpen={openDropdown === 'region'}
        onToggle={() => openFilter('region')}
        onClose={() => setOpenDropdown(null)}
        title="FILTER REGIONS"
        width={260}
        onReset={handleClearRegions}
        resetLabel="Clear"
        onApply={handleApplyRegions}
      >
        {ALL_REGIONS.map((reg) => {
          const checked = draftRegions.includes(reg)
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
                background: checked ? 'var(--blue-tint)' : 'transparent',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleMultiSelect(reg, draftRegions, setDraftRegions)}
                style={{ cursor: 'pointer', accentColor: 'var(--ocean)' }}
              />
              <span>{reg}</span>
            </label>
          )
        })}
      </FilterDropdown>

      {/* 3. Reps Dropdown (Disabled/Locked if role === 'rep') */}
      {role === 'admin' && (
        <FilterDropdown
          label={repsLabel}
          active={filters.reps.length > 0}
          isOpen={openDropdown === 'rep'}
          onToggle={() => openFilter('rep')}
          onClose={() => setOpenDropdown(null)}
          title="FIELD REPRESENTATIVES"
          width={260}
          onReset={handleClearReps}
          resetLabel="Clear"
          onApply={handleApplyReps}
        >
          {ALL_REPS.map((r, idx) => {
            const checked = draftReps.includes(r)
            const initials = r.split(' ').map((n) => n[0]).join('')
            return (
              <label
                key={r}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--card-text)',
                  background: checked ? 'var(--blue-tint)' : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleMultiSelect(r, draftReps, setDraftReps)}
                  style={{ cursor: 'pointer', accentColor: 'var(--ocean)' }}
                />
                <Avatar initials={initials} variant="rep" repIndex={idx} size="sm" />
                <span>{r}</span>
              </label>
            )
          })}
        </FilterDropdown>
      )}

      {/* 4. Products Dropdown */}
      <FilterDropdown
        label={productsLabel}
        active={filters.products.length > 0}
        isOpen={openDropdown === 'product'}
        onToggle={() => openFilter('product')}
        onClose={() => setOpenDropdown(null)}
        title="PRODUCT PORTFOLIO"
        width={260}
        onReset={handleClearProducts}
        resetLabel="Clear"
        onApply={handleApplyProducts}
      >
        {ALL_PRODUCTS.map((prod) => {
          const checked = draftProducts.includes(prod)
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
                background: checked ? 'var(--blue-tint)' : 'transparent',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleMultiSelect(prod, draftProducts, setDraftProducts)}
                style={{ cursor: 'pointer', accentColor: 'var(--ocean)' }}
              />
              <span>{prod}</span>
            </label>
          )
        })}
      </FilterDropdown>

      {/* Active Filter Removable Tags */}
      {(filters.regions.length > 0 || filters.reps.length > 0 || filters.products.length > 0) && (
        <button
          type="button"
          onClick={() => onChangeFilters({ ...filters, regions: [], reps: [], products: [] })}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ocean)',
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'underline',
            whiteSpace: 'nowrap',
          }}
        >
          Reset all filters
        </button>
      )}
    </div>
  )
}
