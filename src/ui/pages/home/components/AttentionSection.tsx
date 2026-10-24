import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import type { HomeAttentionItem } from '../mock-data'

export interface AttentionSectionProps {
  items: HomeAttentionItem[]
  onAction: (s: string) => void
}

export function AttentionSection({ items, onAction }: AttentionSectionProps) {
  return (
    <section className="attention-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">KEEPING THINGS MOVING</span>
          <h2>Needs your attention</h2>
        </div>
        <Button variant="text" onClick={() => onAction('Everything is up to date')}>
          View all <ArrowUpRight />
        </Button>
      </div>
      <div className="attention-row">
        {items.map(({ icon: Icon, label, count, tone, detail }) => (
          <button
            key={label}
            className={`attention-card ${tone}`}
            onClick={() => onAction(`Opening ${label.toLowerCase()}`)}
          >
            <div className="attention-icon">
              <Icon />
            </div>
            <div>
              <span>{label}</span>
              <strong>{count}</strong>
              <small>{detail}</small>
            </div>
            <ChevronRight />
          </button>
        ))}
      </div>
    </section>
  )
}
