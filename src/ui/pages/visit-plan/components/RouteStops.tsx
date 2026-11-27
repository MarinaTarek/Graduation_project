import { useMemo } from 'react'
import { MapPin } from 'lucide-react'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { useStore } from '@/data/mock/store'
import { visitPlansStore } from '@/data/mock/visit-plans'
import { filterVisitPlansByScope } from '@/data/mock/dataScope'
import type { UserRole } from '@/lib/auth/types'
import { useT } from '@/lib/i18n'
import { planStopsMockData } from '../mock-data'

export interface RouteStopsProps {
  role?: UserRole | string
  currentUserName?: string
  currentUserId?: string
  businessUnit?: string
}

export function RouteStops({
  role = 'admin',
  currentUserName = 'Alex Morgan',
  currentUserId,
  businessUnit,
}: RouteStopsProps = {}) {
  const { lang } = useT()
  const visitPlans = useStore(visitPlansStore)

  const scopedPlans = useMemo(() => {
    return filterVisitPlansByScope(visitPlans, {
      id: currentUserId,
      name: currentUserName,
      role,
      businessUnit,
    })
  }, [visitPlans, currentUserId, currentUserName, role, businessUnit])

  // Extract stops from Approved or Active plans
  const stops = useMemo(() => {
    const activePlans = scopedPlans.filter(
      (p) => p.status === 'Approved' || p.status === 'Active'
    )
    const list: Array<{
      id: string
      client: string
      address: string
      purpose: string
      time: string
      priority: string
      planName: string
    }> = []

    for (const plan of activePlans) {
      if (plan.stops && plan.stops.length > 0) {
        for (const s of plan.stops) {
          list.push({
            id: s.id || `${plan.id}-${s.clientName}`,
            client: s.clientName,
            address: s.address,
            purpose: s.purpose,
            time: s.plannedTime,
            priority: s.priority,
            planName: plan.name,
          })
        }
      }
    }
    return list
  }, [scopedPlans])

  // If no dynamic stops exist, fallback to planStopsMockData for admin, or show empty state
  const displayedStops = stops.length > 0
    ? stops
    : (role === 'admin'
        ? planStopsMockData.map((s, idx) => ({
            id: `mock-${idx}`,
            client: s.client,
            address: s.address,
            purpose: s.purpose,
            time: s.time,
            priority: s.priority,
            planName: 'Default Route',
          }))
        : [])

  if (displayedStops.length === 0) {
    return (
      <div style={{ marginTop: '16px' }}>
        <EmptyState
          message={
            lang === 'ar'
              ? 'لا توجد محطات مجدولة لليوم في الخطط المعتمدة'
              : 'No scheduled route stops found in approved visit plans for today'
          }
        />
      </div>
    )
  }

  return (
    <div style={{ marginTop: '16px' }} className="collection-list">
      {displayedStops.map((stop) => (
        <div key={stop.id} className="collection-item">
          <div className="item-icon">
            <MapPin />
          </div>
          <div>
            <strong>
              {stop.time} — {stop.client}
            </strong>
            <span>
              {stop.address} · {stop.purpose} ({stop.planName})
            </span>
          </div>
          <StatusPill status={stop.priority === 'Class A' ? 'Healthy' : 'Pending'} />
        </div>
      ))}
    </div>
  )
}
