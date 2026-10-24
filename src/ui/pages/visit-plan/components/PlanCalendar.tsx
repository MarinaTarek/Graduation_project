import { CalendarDays } from 'lucide-react'

export function PlanCalendar() {
  return (
    <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <CalendarDays style={{ width: '32px', height: '32px', color: 'var(--ocean)' }} />
      <div>
        <strong>Today&apos;s Scheduled Route · Tuesday, Oct 24</strong>
        <span style={{ display: 'block', color: 'var(--muted-text)', fontSize: '12px' }}>
          3 confirmed stops · Estimated driving time: 45 mins
        </span>
      </div>
    </div>
  )
}
