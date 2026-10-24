import { CalendarDays } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { PlanCalendar } from './components/PlanCalendar'
import { RouteStops } from './components/RouteStops'

export default function VisitPlanPage() {
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <CalendarDays /> TERRITORY ROUTING
          </span>
          <h1>Visit Plan</h1>
          <p className="story">
            Optimized route sequencing, appointment slots, and travel pacing.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '36px' }}>
        <PlanCalendar />
        <RouteStops />
      </div>

      <EmptyState message="Route and travel pacing synced with Google Maps GPS" />
    </section>
  )
}
