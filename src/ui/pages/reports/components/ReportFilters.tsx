'use client'

import { useState, useMemo } from 'react'
import { Check } from 'lucide-react'
import { Avatar } from '@/ui/design-system/components/Avatar'
import { FilterDropdown } from '@/ui/design-system/components/FilterDropdown'
import { useT } from '@/lib/i18n'
import { usersStore } from '@/data/mock/users'
import { getScopedUsers } from '@/lib/analytics/roleAnalytics'
import type { UserRole } from '@/lib/auth/types'

export interface ReportFiltersState {
  month: string
  regions: string[]
  reps: string[]
  products: string[]
}

export interface ReportFiltersProps {
  filters: ReportFiltersState
  onChangeFilters: (f: ReportFiltersState) => void
  role?: UserRole | string
  currentUserName?: string
  currentUserId?: string
  businessUnit?: string
  availableFilters?: Array<'month' | 'region' | 'rep' | 'product'>
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
const ALL_REGIONS_DEFAULT = ['Central District', 'North District', 'West District', 'East District', 'South District']
const ALL_PRODUCTS = ['Bevato', 'Naviro D3 50,000 IU', 'Naviro D3 10,000 IU', 'Naviro D3 Drops', 'Navigen Product 5']

export function ReportFilters({
  filters,
  onChangeFilters,
  role = 'admin',
  currentUserName = 'Alex Morgan',
  currentUserId,
  businessUnit,
  availableFilters,
}: ReportFiltersProps) {
  const { t, lang } = useT()
  const [openDropdown, setOpenDropdown] = useState<'month' | 'region' | 'rep' | 'product' | null>(null)

  const [draftMonth, setDraftMonth] = useState(filters.month)
  const [draftRegions, setDraftRegions] = useState<string[]>(filters.regions)
  const [draftReps, setDraftReps] = useState<string[]>(filters.reps)
  const [draftProducts, setDraftProducts] = useState<string[]>(filters.products)

  // Determine authorized field reps based on user role & direct reporting hierarchy
  const authorizedReps = useMemo(() => {
    if (role === 'rep') {
      return [currentUserName]
    }
    if (role === 'marketing_manager') {
      return []
    }
    const scoped = getScopedUsers({
      id: currentUserId,
      name: currentUserName,
      role,
      businessUnit,
    })
    const repUsers = scoped.filter((u) => u.roleType === 'rep' || u.role?.toLowerCase().includes('rep'))
    const names = Array.from(new Set(repUsers.map((u) => u.name))).filter(Boolean)
    if (names.length > 0) return names

    // Fallback if scoped is empty
    return role === 'admin'
      ? ['Alex Morgan', 'Maya Patel', 'Olivia Martin', 'Ahmed Samir', 'Sara Ali']
      : [currentUserName]
  }, [role, currentUserId, currentUserName, businessUnit])

  // Determine authorized regions based on role
  const authorizedRegions = useMemo(() => {
    if (role === 'admin' || role === 'marketing_manager') {
      return ALL_REGIONS_DEFAULT
    }
    const scoped = getScopedUsers({
      id: currentUserId,
      name: currentUserName,
      role,
      businessUnit,
    })
    const regions = Array.from(new Set(scoped.map((u) => u.region))).filter(Boolean) as string[]
    return regions.length > 0 ? regions : ALL_REGIONS_DEFAULT
  }, [role, currentUserId, currentUserName, businessUnit])

  const showMonth = !availableFilters || availableFilters.includes('month')
  const showRegion = !availableFilters || availableFilters.includes('region')
  const showRep = (!availableFilters || availableFilters.includes('rep')) && role !== 'marketing_manager' && role !== 'rep'
  const showProduct = !availableFilters || availableFilters.includes('product')

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
      ? t('reports.filters.allRegions')
      : filters.regions.length === 1
      ? filters.regions[0]
      : t('reports.filters.regionsCount', { count: filters.regions.length })

  const repsLabel =
    role === 'rep'
      ? currentUserName
      : filters.reps.length === 0
      ? t('reports.filters.allReps')
      : filters.reps.length === 1
      ? filters.reps[0]
      : t('reports.filters.repsCount', { count: filters.reps.length })

  const productsLabel =
    filters.products.length === 0
      ? t('reports.filters.allProducts')
      : filters.products.length === 1
      ? filters.products[0]
      : t('reports.filters.productsCount', { count: filters.products.length })

  return (
    <div className="reports-filters-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
      {/* 1. Month Dropdown */}
      {showMonth && (
        <FilterDropdown
          label={monthLabel}
          active={filters.month !== 'October 2026'}
          isOpen={openDropdown === 'month'}
          onToggle={() => openFilter('month')}
          onClose={() => setOpenDropdown(null)}
          title={t('reports.filters.selectMonth')}
          width={240}
          onReset={handleClearMonth}
          resetLabel={t('common.reset')}
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
                textAlign: 'start',
              }}
            >
              <span>{m}</span>
              {draftMonth === m && <Check style={{ width: '14px', height: '14px' }} />}
            </button>
          ))}
        </FilterDropdown>
      )}

      {/* 2. Regions Dropdown */}
      {showRegion && (
        <FilterDropdown
          label={regionsLabel}
          active={filters.regions.length > 0}
          isOpen={openDropdown === 'region'}
          onToggle={() => openFilter('region')}
          onClose={() => setOpenDropdown(null)}
          title={t('reports.filters.filterRegions')}
          width={260}
          onReset={handleClearRegions}
          resetLabel={t('common.clear')}
          onApply={handleApplyRegions}
        >
          {authorizedRegions.map((reg) => {
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
      )}

      {/* 3. Reps Dropdown (Scoped to direct reports or BU reps) */}
      {showRep && (
        <FilterDropdown
          label={repsLabel}
          active={filters.reps.length > 0}
          isOpen={openDropdown === 'rep'}
          onToggle={() => openFilter('rep')}
          onClose={() => setOpenDropdown(null)}
          title={t('reports.filters.fieldReps')}
          width={260}
          onReset={handleClearReps}
          resetLabel={t('common.clear')}
          onApply={handleApplyReps}
        >
          {authorizedReps.map((r) => {
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
                <Avatar initials={initials} size="sm" />
                <span>{r}</span>
              </label>
            )
          })}
        </FilterDropdown>
      )}

      {/* 4. Products Dropdown */}
      {showProduct && (
        <FilterDropdown
          label={productsLabel}
          active={filters.products.length > 0}
          isOpen={openDropdown === 'product'}
          onToggle={() => openFilter('product')}
          onClose={() => setOpenDropdown(null)}
          title={lang === 'ar' ? 'تصفية المنتجات' : 'Filter Products'}
          width={260}
          onReset={handleClearProducts}
          resetLabel={t('common.clear')}
          onApply={handleApplyProducts}
        >
          {ALL_PRODUCTS.map((p) => {
            const checked = draftProducts.includes(p)
            return (
              <label
                key={p}
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
                  onChange={() => toggleMultiSelect(p, draftProducts, setDraftProducts)}
                  style={{ cursor: 'pointer', accentColor: 'var(--ocean)' }}
                />
                <span>{p}</span>
              </label>
            )
          })}
        </FilterDropdown>
      )}
    </div>
  )
}
