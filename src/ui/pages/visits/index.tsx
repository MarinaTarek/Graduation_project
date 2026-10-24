import { Plus, Stethoscope } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { VisitListItem } from './components/VisitListItem'
import { visitsMockData } from './mock-data'

export interface VisitsPageProps {
  onNewVisit: () => void
}

export default function VisitsPage({ onNewVisit }: VisitsPageProps) {
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Stethoscope /> FIELD ENGAGEMENTS
          </span>
          <h1>Visits</h1>
          <p className="story">
            Direct clinical details, sample hand-offs, and physician interactions.
          </p>
        </div>
        <Button variant="primary" onClick={onNewVisit}>
          <Plus data-icon="inline-start" /> New visit
        </Button>
      </div>

      <div style={{ marginTop: '36px' }} className="collection-list">
        {visitsMockData.map((visit) => (
          <VisitListItem key={visit.id} item={visit} />
        ))}
      </div>

      <EmptyState message="All logged interactions synced to field records" />
    </section>
  )
}
