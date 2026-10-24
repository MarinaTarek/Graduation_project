import { Plus, Sparkles } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { HomeFilters } from './components/HomeFilters'
import { AttentionSection } from './components/AttentionSection'
import { SellInChartPanel } from './components/SellInChartPanel'
import { TargetPanel } from './components/TargetPanel'
import { ProductsPanel } from './components/ProductsPanel'
import { TopRepsPanel } from './components/TopRepsPanel'
import { QuoteCard } from './components/QuoteCard'
import { homeAttentionItems } from './mock-data'

export interface HomePageProps {
  onAction: (s: string) => void
  onOpen: (s: string) => void
  range: string
  setRange: (s: string) => void
  setActive: (s: string) => void
}

export default function HomePage({
  onAction,
  onOpen,
  range,
  setRange,
  setActive,
}: HomePageProps) {
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Sparkles /> Tuesday, October 24, 2026
          </span>
          <h1>Good morning, Alex.</h1>
          <p className="story">
            This month we sold{' '}
            <button onClick={() => onOpen('invoice detail')}>
              <b>$240K</b>
            </button>
            , up <em>8%</em> from last month, with <strong>12 days</strong> left to hit target.
          </p>
        </div>
        <Button variant="primary" onClick={() => onOpen('new visit')}>
          <Plus data-icon="inline-start" /> New visit
        </Button>
      </div>

      <HomeFilters range={range} setRange={setRange} />

      <AttentionSection items={homeAttentionItems} onAction={onAction} />

      <div className="bento-grid">
        <SellInChartPanel onClick={() => onOpen('sell-in')} />
        <TargetPanel />
        <ProductsPanel
          onNavigateStock={() => setActive('Stock')}
          onOpenStockDetail={() => onOpen('stock detail')}
        />
        <TopRepsPanel
          onNavigateMore={() => setActive('More')}
          onAction={onAction}
        />
      </div>

      <QuoteCard />
    </section>
  )
}
