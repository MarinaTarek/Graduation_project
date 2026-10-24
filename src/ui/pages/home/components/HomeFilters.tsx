import { useState } from 'react'
import { Check } from 'lucide-react'
import { Avatar } from '@/ui/design-system/components/Avatar'
import { FilterDropdown } from '@/ui/design-system/components/FilterDropdown'

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
const ALL_PRODUCTS = ['Bevato', 'Naviro D3 50,000 IU', 'Naviro D3 10,000 IU', 'Naviro D3 Drops', 'Navigen Product 5']

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
    <div className="home-filters-row">
      <div className="home-filters-scroll">
        {/* 1. Month Filter */}
        <FilterDropdown
          label={monthLabel}
          active={filters.month !== 'October 2026'}
          isOpen={openDropdown === 'month'}
          onToggle={() => openFilter('month')}
          onClose={() => setOpenDropdown(null)}
          title="SELECT MONTH"
          width={220}
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

        {/* 2. Region Multi-select Filter */}
        <FilterDropdown
          label={regionLabel}
          active={filters.regions.length > 0}
          isOpen={openDropdown === 'region'}
          onToggle={() => openFilter('region')}
          onClose={() => setOpenDropdown(null)}
          title="FILTER REGIONS"
          width={230}
          onReset={handleClearRegions}
          resetLabel="Clear"
          onApply={handleApplyRegions}
        >
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
                  style={{ cursor: 'pointer', accentColor: 'var(--ocean)' }}
                />
                <span>{reg}</span>
              </label>
            )
          })}
        </FilterDropdown>

        {/* 3. Rep Multi-select Filter (with avatars) */}
        <FilterDropdown
          label={repLabel}
          active={filters.reps.length > 0}
          isOpen={openDropdown === 'rep'}
          onToggle={() => openFilter('rep')}
          onClose={() => setOpenDropdown(null)}
          title="FIELD REPRESENTATIVES"
          width={250}
          onReset={handleClearReps}
          resetLabel="Clear"
          onApply={handleApplyReps}
        >
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
                  style={{ cursor: 'pointer', accentColor: 'var(--ocean)' }}
                />
                <Avatar initials={initials} variant="rep" repIndex={idx} size="sm" />
                <span>{rep}</span>
              </label>
            )
          })}
        </FilterDropdown>

        {/* 4. Product Multi-select Filter */}
        <FilterDropdown
          label={productLabel}
          active={filters.products.length > 0}
          isOpen={openDropdown === 'product'}
          onToggle={() => openFilter('product')}
          onClose={() => setOpenDropdown(null)}
          title="PRODUCT PORTFOLIO"
          width={240}
          onReset={handleClearProducts}
          resetLabel="Clear"
          onApply={handleApplyProducts}
        >
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
                  style={{ cursor: 'pointer', accentColor: 'var(--ocean)' }}
                />
                <span>{prod}</span>
              </label>
            )
          })}
        </FilterDropdown>
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
