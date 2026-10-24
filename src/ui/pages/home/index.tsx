import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useAuth } from '@/lib/auth'
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

const REP_METRICS: Record<string, { amount: string; percent: string }> = {
  'Ahmed Samir': { amount: '$42.8K', percent: '94%' },
  'Sara Ali': { amount: '$38.2K', percent: '88%' },
  'Olivia Martin': { amount: '$42.8K', percent: '98%' },
  'Maya Patel': { amount: '$39.4K', percent: '91%' },
  'James Wilson': { amount: '$35.9K', percent: '84%' },
  'Sofia Chen': { amount: '$32.6K', percent: '79%' },
}

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
  const [daysRemaining, setDaysRemaining] = useState(12)

  useEffect(() => {
    const now = new Date()
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    setDaysRemaining(Math.max(1, totalDays - now.getDate()))
  }, [])

  // Rep ID for role-scoped pharma data
  const repId = role === 'rep' ? (user?.id ?? undefined) : undefined

  const [filters, setFilters] = useState<HomeFiltersState>({
    month: 'October 2026',
    regions: [],
    reps: [],
    products: [],
  })

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

  // Headline metrics reacting to filters
  let headlineSales = '$240K'
  let headlineGrowth = '8%'
  let headlineDays = range === 'Week' ? '4 days' : `${daysRemaining} days`

  if (filters.reps.length === 1) {
    headlineSales = filters.reps[0] === 'Olivia Martin' ? '$42.8K' : '$39.4K'
    headlineGrowth = '12%'
  } else if (filters.reps.length > 1) {
    headlineSales = `$${filters.reps.length * 38}K`
  } else if (filters.month !== 'October 2026') {
    headlineSales = '$224K'
    headlineGrowth = '6.4%'
    headlineDays = 'Completed period'
  }

  const repMetric = (user?.name && REP_METRICS[user.name]) || { amount: '$42.8K', percent: '94%' }

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
              This month you sold{' '}
              <button onClick={() => onOpen('invoice detail')}>
                <b>{repMetric.amount}</b>
              </button>
              , <em>{repMetric.percent}</em> of your target, with{' '}
              <strong>{headlineDays}</strong> left.
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
              In {filters.month.split(' ')[0]} we sold{' '}
              <button onClick={() => onOpen('invoice detail')}>
                <b>{headlineSales}</b>
              </button>
              , up <em>{headlineGrowth}</em> from previous benchmark, with{' '}
              <strong>{headlineDays}</strong> to target.
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
            <Plus style={{ width: '18px', height: '18px' }} /> New visit
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
        items={homeAttentionItems}
        onAction={onAction}
        onOpenNotifications={() => onOpen('notifications')}
        onNavigateWithFilter={onNavigateWithFilter}
      />

      <div className="bento-grid">
        <SellInChartPanel onClick={() => setActive('Sell-in')} />
        <TargetPanel />
        <ProductsPanel
          onNavigateStock={() => setActive('Stock')}
          onOpenStockDetail={() => onOpen('stock detail')}
        />
        <TopRepsPanel
          onNavigateMore={() => setActive('More')}
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
