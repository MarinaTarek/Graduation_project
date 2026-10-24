import { MapPin } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { TerritoryGrid } from './components/TerritoryGrid'

export default function AdminTerritoriesPage() {
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <MapPin /> GEOGRAPHIC COVERAGE
          </span>
          <h1>Territories</h1>
          <p className="story">Regional zone partitions, postal zoning, and representative portfolio balance.</p>
        </div>
      </div>
      <div style={{ marginTop: '36px' }}>
        <TerritoryGrid />
      </div>
      <EmptyState message="All 4 territories balanced and assigned" />
    </section>
  )
}
