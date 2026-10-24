import { MapPin } from 'lucide-react'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { planStopsMockData } from '../mock-data'

export function RouteStops() {
  return (
    <div style={{ marginTop: '24px' }} className="collection-list">
      {planStopsMockData.map((stop) => (
        <div key={stop.client} className="collection-item">
          <div className="item-icon">
            <MapPin />
          </div>
          <div>
            <strong>{stop.time} — {stop.client}</strong>
            <span>{stop.address} · {stop.purpose}</span>
          </div>
          <StatusPill status={stop.priority === 'Class A' ? 'Healthy' : 'Pending'} />
        </div>
      ))}
    </div>
  )
}
