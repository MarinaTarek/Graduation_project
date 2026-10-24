import { CalendarDays } from 'lucide-react'
import { useT } from '@/lib/i18n'

export function PlanCalendar() {
  const { t } = useT()

  return (
    <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <CalendarDays style={{ width: '32px', height: '32px', color: 'var(--ocean)' }} />
      <div>
        <strong>{t('visitPlan.todayRoute')}</strong>
        <span style={{ display: 'block', color: 'var(--muted-text)', fontSize: '12px' }}>
          {t('visitPlan.confirmedStops')}
        </span>
      </div>
    </div>
  )
}
