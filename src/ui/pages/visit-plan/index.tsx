import { CalendarDays } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { useT } from '@/lib/i18n'
import { PlanCalendar } from './components/PlanCalendar'
import { RouteStops } from './components/RouteStops'

export default function VisitPlanPage() {
  const { t } = useT()

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <CalendarDays /> {t('visitPlan.eyebrow')}
          </span>
          <h1>{t('visitPlan.title')}</h1>
          <p className="story">
            {t('visitPlan.subtitle')}
          </p>
        </div>
      </div>

      <div style={{ marginTop: '36px' }}>
        <PlanCalendar />
        <RouteStops />
      </div>

      <EmptyState message={t('visitPlan.emptyState')} />
    </section>
  )
}
