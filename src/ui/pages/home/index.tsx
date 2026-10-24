import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { HomeFilters, type HomeFiltersState } from './components/HomeFilters'
import { AttentionSection } from './components/AttentionSection'
import { SellInChartPanel } from './components/SellInChartPanel'
import { TargetPanel } from './components/TargetPanel'
import { ProductsPanel } from './components/ProductsPanel'
import { TopRepsPanel } from './components/TopRepsPanel'
import { QuoteCard } from './components/QuoteCard'
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
  let headlineDays = range === 'Week' ? '4 days' : '12 days'

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

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Sparkles /> Tuesday, October 24, 2026
          </span>
          <h1>Good morning, Alex.</h1>
          <p className="story">
            In {filters.month.split(' ')[0]} we sold{' '}
            <button onClick={() => onOpen('invoice detail')}>
              <b>{headlineSales}</b>
            </button>
            , up <em>{headlineGrowth}</em> from previous benchmark, with{' '}
            <strong>{headlineDays}</strong> to target.
          </p>
        </div>
        <Button variant="primary" onClick={() => onOpen('new visit')}>
          <Plus data-icon="inline-start" /> New visit
        </Button>
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
    </section>
  )
}
