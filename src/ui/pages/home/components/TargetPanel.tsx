import { useMemo } from 'react'
import { Target } from 'lucide-react'
import { ProgressRing } from '@/ui/design-system/components/ProgressRing'
import { formatCurrencyCompact } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { useStore } from '@/data/mock/store'
import { targetsStore, calculateTargetProgress } from '@/data/mock/targets'
import { invoicesStore } from '@/data/mock/invoices'
import { salesOrdersStore } from '@/data/mock/sales-orders'

export function TargetPanel() {
  const { t } = useT()
  const targets = useStore(targetsStore)
  const invoices = useStore(invoicesStore)
  const salesOrders = useStore(salesOrdersStore)

  const { totalTarget, totalAchieved, percent } = useMemo(() => {
    const totalTgt = targets.reduce((sum, item) => sum + (item.targetValue || 0), 0)
    const achieved = targets.reduce((sum, item) => {
      const prog = calculateTargetProgress(item, invoices, salesOrders)
      return sum + prog.achievedAmount
    }, 0)
    const pct = totalTgt > 0 ? Math.round((achieved / totalTgt) * 100) : 0
    return {
      totalTarget: totalTgt > 0 ? totalTgt : 310000,
      totalAchieved: achieved > 0 ? achieved : 240000,
      percent: totalTgt > 0 ? pct : 78,
    }
  }, [targets, invoices, salesOrders])

  return (
    <section className="panel target-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t('home.target.eyebrow')}</span>
          <h3>{t('home.target.title')}</h3>
        </div>
        <Target />
      </div>
      <ProgressRing percent={percent} label={t('home.target.label')} />
      <div className="target-foot">
        <span>
          {formatCurrencyCompact(totalAchieved)} <small>{t('home.target.ofAmount', { amount: formatCurrencyCompact(totalTarget) })}</small>
        </span>
        <span className={percent >= 80 ? 'green-text' : percent >= 60 ? 'amber-text' : 'rose-text'}>
          {percent}%
        </span>
      </div>
    </section>
  )
}

