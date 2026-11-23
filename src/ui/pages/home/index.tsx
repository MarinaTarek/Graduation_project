import { useState, useEffect, useMemo } from 'react'
import { Plus, Users, Clock3, FileText, Stethoscope } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useAuth, canAccessPage } from '@/lib/auth'
import { storedUsersStore } from '@/lib/auth/mock-users'
import { useStore } from '@/data/mock/store'
import { batchesStore, stockMovementsStore, getBatchesNearExpiry } from '@/data/mock/stockDerived'
import { invoicesStore } from '@/data/mock/invoices'
import { targetsStore } from '@/data/mock/targets'
import { getAuthoritativeRepScorecard } from '@/data/mock/reportingAnalytics'
import { useT, interpolate } from '@/lib/i18n'
import { formatCurrencyCompact } from '@/lib/format'
import {
  getCurrentMonthYearLabel,
  getSystemCurrentYearMonth,
  monthLabelToYearMonth,
  MONTH_NAMES_AR,
} from '@/lib/dateUtils'
import { HomeFilters, type HomeFiltersState } from './components/HomeFilters'
import { AttentionSection } from './components/AttentionSection'
import { SellInChartPanel } from './components/SellInChartPanel'
import { TargetPanel } from './components/TargetPanel'
import { ProductsPanel } from './components/ProductsPanel'
import { TopRepsPanel } from './components/TopRepsPanel'
import { QuoteCard } from './components/QuoteCard'
import {
  KpiStrip,
  VisitCoverageByClass,
  SamplesPanel,
  ExpiringBatchesPanel,
  RegionsPanel,
  ReceivablesPanel,
  ReturnsPanel,
} from './components/PharmaSections'
import { homeAttentionItems, homeProducts, homeReps } from './mock-data'

export interface HomePageProps {
  onAction: (s: string) => void
  onOpen: (s: string) => void
  range: string
  setRange: (s: string) => void
  setActive: (s: string) => void
  onNavigateWithFilter?: (page: string, options?: { filter?: string; overlay?: string }) => void
  onSelectRep?: (repName: string) => void
}

export default function HomePage({
  onAction,
  onOpen,
  range,
  setRange,
  setActive,
  onNavigateWithFilter,
  onSelectRep,
}: HomePageProps) {
  const { user, role } = useAuth()
  const { t, lang } = useT()
  const [daysRemaining, setDaysRemaining] = useState(12)
  const pendingCount = useStore(storedUsersStore).filter((u) => u.status === 'pending').length
  const allInvoices = useStore(invoicesStore)
  const allTargets = useStore(targetsStore)

  useEffect(() => {
    const now = new Date()
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    setDaysRemaining(Math.max(1, totalDays - now.getDate()))
  }, [])

  // Rep ID for role-scoped pharma data
  const repId = role === 'rep' ? (user?.id ?? undefined) : undefined

  const [filters, setFilters] = useState<HomeFiltersState>(() => ({
    month: getCurrentMonthYearLabel('en'),
    regions: [],
    reps: [],
    products: [],
  }))

  // Dynamic products filtering reacting to Product filter
  const displayedProducts = filters.products.length > 0
    ? homeProducts.filter((p) => filters.products.includes(p.name))
    : homeProducts

  // Dynamic reps filtering reacting to Rep and Region filters
  const displayedReps = homeReps.filter(([name, region]) => {
    const matchesRep = filters.reps.length === 0 || filters.reps.includes(name)
    const matchesRegion = filters.regions.length === 0 || filters.regions.includes(region)
    return matchesRep && matchesRegion
  })

  const currentMonthLabel = getCurrentMonthYearLabel('en')
  const currentYM = getSystemCurrentYearMonth()

  // Headline metrics reacting to filters and live data
  const headlineSalesVal = useMemo(() => {
    if (filters.reps.length === 1) {
      const card = getAuthoritativeRepScorecard(filters.reps[0])
      return card.sales > 0 ? card.sales : (filters.reps[0] === 'Olivia Martin' ? 42800 : 39400)
    }
    if (filters.reps.length > 1) {
      return filters.reps.reduce((sum, r) => sum + getAuthoritativeRepScorecard(r).sales, 0)
    }
    const ym = monthLabelToYearMonth(filters.month)
    const validInvoices = allInvoices.filter(
      (inv) => !inv.needsReconciliation && inv.status !== 'Rejected' && inv.status !== 'Voided'
    )
    const matchingMonth = validInvoices.filter((inv) => {
      const invDate = inv.issueDate || (inv.created_at ? inv.created_at.slice(0, 10) : '')
      return ym ? invDate.startsWith(ym) : true
    })
    const monthSum = matchingMonth.reduce((sum, inv) => sum + (inv.originalAmount || 0), 0)
    if (monthSum > 0 || ym === currentYM) {
      return monthSum
    }
    const totalAll = validInvoices.reduce((sum, inv) => sum + (inv.originalAmount || 0), 0)
    return totalAll > 0 ? totalAll : 240000
  }, [filters.reps, filters.month, allInvoices, allTargets, currentYM])

  let headlineGrowth = '8%'
  let headlineDays = range === 'Week' ? t('home.hero.days', { count: 4 }) : t('home.hero.days', { count: daysRemaining })

  if (filters.reps.length === 1) {
    headlineGrowth = '12%'
  } else if (filters.month !== currentMonthLabel) {
    headlineGrowth = '6.4%'
    headlineDays = t('home.hero.completedPeriod')
  }

  const headlineSales = formatCurrencyCompact(headlineSalesVal, 'EGP', lang)

  const repScorecard = useMemo(() => {
    const repIdentifier = repId || user?.name || ''
    return getAuthoritativeRepScorecard(repIdentifier)
  }, [repId, user?.name, allInvoices, allTargets])

  const repMetric = {
    amount: formatCurrencyCompact(repScorecard.sales > 0 ? repScorecard.sales : 42800, 'EGP', lang),
    percent: repScorecard.targetPct > 0 ? `${repScorecard.targetPct}%` : '94%',
  }

  const monthRaw = filters.month.split(' ')[0]
  const monthDisplay = lang === 'ar' ? (MONTH_NAMES_AR[monthRaw] || monthRaw) : monthRaw

  const allBatches = useStore(batchesStore)
  const allMovements = useStore(stockMovementsStore)
  const expiringBatchesList = getBatchesNearExpiry(allMovements, allBatches, 90)
  const firstExpiringBatch = expiringBatchesList[0]

  const dynamicAttentionItems = [
    canAccessPage('Invoices', role, user) && {
      icon: FileText,
      label: t('home.attention.invoices'),
      count: '5',
      tone: 'amber' as const,
      detail: t('home.attention.invoicesDetail'),
    },
    canAccessPage('Clients', role, user) && {
      icon: Stethoscope,
      label: t('home.attention.doctors'),
      count: '3',
      tone: 'rose' as const,
      detail: t('home.attention.doctorsDetail'),
    },
    canAccessPage('Stock', role, user) && {
      icon: Clock3,
      label: t('home.attention.batchExpiring'),
      count: String(expiringBatchesList.length),
      tone: 'blue' as const,
      detail: firstExpiringBatch
        ? t('home.attention.batchExpiringDetail', { product: firstExpiringBatch.productName, days: firstExpiringBatch.days_to_expiry })
        : t('home.attention.allBatchesHealthy'),
    },
  ].filter(Boolean) as typeof homeAttentionItems

  const handleNav = (page: string, options?: { filter?: string; overlay?: string }) => {
    if (onNavigateWithFilter) {
      onNavigateWithFilter(page, options)
    } else {
      if (!canAccessPage(page, role, user)) {
        onAction(t('app.toastNoPageAccess'))
        return
      }
      setActive(page)
    }
  }

  return (
    <section className="content">
      <div className="home-hero-row">
        <div style={{ flex: '1 1 auto', maxWidth: '760px' }}>
          {role === 'rep' ? (
            <h1
              className="story"
              style={{
                fontSize: 'clamp(28px, 2.6vw, 36px)',
                fontWeight: 300,
                letterSpacing: '-0.03em',
                lineHeight: 1.3,
                color: 'var(--heading-text)',
                margin: 0,
              }}
            >
              {interpolate(t('home.hero.storyRep'), {
                amount: (
                  <button onClick={() => onOpen('invoice detail')}>
                    <b>{repMetric.amount}</b>
                  </button>
                ),
                percent: <em>{repMetric.percent}</em>,
                days: <strong>{headlineDays}</strong>,
              })}
            </h1>
          ) : (
            <h1
              className="story"
              style={{
                fontSize: 'clamp(28px, 2.6vw, 36px)',
                fontWeight: 300,
                letterSpacing: '-0.03em',
                lineHeight: 1.3,
                color: 'var(--heading-text)',
                margin: 0,
              }}
            >
              {interpolate(t('home.hero.storyManager'), {
                month: monthDisplay,
                amount: (
                  <button onClick={() => onOpen('invoice detail')}>
                    <b>{headlineSales}</b>
                  </button>
                ),
                growth: <em>{headlineGrowth}</em>,
                days: <strong>{headlineDays}</strong>,
              })}
            </h1>
          )}
        </div>
        <div className="home-hero-action">
          <Button
            variant="primary"
            onClick={() => onOpen('new visit')}
            style={{
              height: '48px',
              minHeight: '48px',
              padding: '0 24px',
              fontSize: '14px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Plus style={{ width: '18px', height: '18px' }} /> {t('home.hero.newVisit')}
          </Button>
        </div>
      </div>

      <HomeFilters
        range={range}
        setRange={setRange}
        filters={filters}
        onChangeFilters={setFilters}
      />

      <AttentionSection
        items={
          role === 'admin' && canAccessPage('Users', role, user) && pendingCount > 0
            ? [
                {
                  icon: Users,
                  label: t('home.attention.accountRequests'),
                  count: String(pendingCount),
                  tone: 'amber' as const,
                  detail: t('home.attention.pendingReview', { count: pendingCount }),
                },
                ...dynamicAttentionItems,
              ]
            : dynamicAttentionItems
        }
        onAction={onAction}
        onOpenNotifications={() => onOpen('notifications')}
        onNavigateWithFilter={onNavigateWithFilter}
      />

      <div className="bento-grid">
        <SellInChartPanel onClick={() => handleNav('Sell-in')} />
        <TargetPanel />
        <ProductsPanel
          onNavigateStock={() => handleNav('Stock')}
          onOpenStockDetail={() => onOpen('stock detail')}
        />
        <TopRepsPanel
          onNavigateMore={() => handleNav('More')}
          onAction={onAction}
          onSelectRep={onSelectRep}
        />
      </div>

      <QuoteCard />

      {/* KPI Strip */}
      <div style={{ marginTop: '18px' }}>
        <KpiStrip repId={repId} onNav={onNavigateWithFilter} />
      </div>

      {/* Pharma bento grid */}
      <div className="pharma-bento">
        {/* Visit Coverage by Class */}
        <VisitCoverageByClass repId={repId} onNav={onNavigateWithFilter} />

        {/* Samples */}
        <SamplesPanel repId={repId} onNav={(p) => onNavigateWithFilter?.(p)} />

        {/* Expiring Batches */}
        <ExpiringBatchesPanel onOpenDetail={() => onOpen('stock detail')} />

        {/* Returns tile — full width on mobile, 1 col here */}
        <ReturnsPanel repId={repId} />

        {/* Admin-only: Regions and Receivables */}
        {role === 'admin' && (
          <>
            <RegionsPanel onNav={onNavigateWithFilter} />
            <ReceivablesPanel />
          </>
        )}
      </div>
    </section>
  )
}
