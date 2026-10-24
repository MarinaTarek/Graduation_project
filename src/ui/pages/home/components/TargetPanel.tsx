import { Target } from 'lucide-react'
import { ProgressRing } from '@/ui/design-system/components/ProgressRing'
import { formatCurrencyCompact } from '@/lib/format'
import { useT } from '@/lib/i18n'

export function TargetPanel() {
  const { t } = useT()

  return (
    <section className="panel target-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t('home.target.eyebrow')}</span>
          <h3>{t('home.target.title')}</h3>
        </div>
        <Target />
      </div>
      <ProgressRing percent={78} label={t('home.target.label')} />
      <div className="target-foot">
        <span>
          {formatCurrencyCompact(240000)} <small>{t('home.target.ofAmount', { amount: formatCurrencyCompact(310000) })}</small>
        </span>
        <span className="green-text">+8.4%</span>
      </div>
    </section>
  )
}
