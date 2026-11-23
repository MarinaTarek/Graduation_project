import { useMemo } from 'react'
import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Avatar } from '@/ui/design-system/components/Avatar'
import { useT } from '@/lib/i18n'
import { useStore } from '@/data/mock/store'
import { usersStore } from '@/data/mock/users'
import { invoicesStore } from '@/data/mock/invoices'
import { targetsStore } from '@/data/mock/targets'
import { getAuthoritativeRepScorecard } from '@/data/mock/reportingAnalytics'
import { homeReps } from '../mock-data'

export interface TopRepsPanelProps {
  onNavigateMore: () => void
  onAction: (s: string) => void
  onSelectRep?: (repName: string) => void
}

const REGION_NAMES_AR: Record<string, string> = {
  'North region': 'المنطقة الشمالية',
  'West region': 'المنطقة الغربية',
  'Central region': 'المنطقة الوسطى',
  'East region': 'المنطقة الشرقية',
  'Tanta': 'طنطا',
  'El Mahalla El Kubra': 'المحلة الكبرى',
  'Assiut': 'أسيوط',
}

export function TopRepsPanel({
  onNavigateMore,
  onAction,
  onSelectRep,
}: TopRepsPanelProps) {
  const { t, lang } = useT()
  const users = useStore(usersStore)
  const invoices = useStore(invoicesStore)
  const targets = useStore(targetsStore)

  const repList = useMemo(() => {
    const liveReps = users.filter((u) => u.role === 'rep' && u.status !== 'disabled')
    if (liveReps.length === 0) {
      return homeReps.map(([name, region, sales, goal]) => ({
        name,
        region,
        salesText: lang === 'ar' ? sales.replace(/^EGP\s*/i, '').replace(/k/i, 'K') + ' ج.م' : sales,
        goal,
      }))
    }
    return liveReps.map((r) => {
      const card = getAuthoritativeRepScorecard(r.name)
      const salesFormatted = card.sales >= 1000
        ? `EGP ${(card.sales / 1000).toFixed(1)}k`
        : `EGP ${card.sales}`
      return {
        name: r.name,
        region: r.region || 'Central region',
        salesText: lang === 'ar' ? salesFormatted.replace(/^EGP\s*/i, '').replace(/k/i, 'K') + ' ج.م' : salesFormatted,
        goal: `${card.targetPct}%`,
      }
    })
  }, [users, invoices, targets, lang])

  return (
    <section className="panel reps-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t('home.reps.eyebrow')}</span>
          <h3>{t('home.reps.title')}</h3>
        </div>
        <Button variant="round-arrow" onClick={onNavigateMore}>
          <ArrowUpRight />
        </Button>
      </div>
      <div className="rep-list">
        {repList.map(({ name, region, salesText, goal }, i) => (
          <button
            className="rep-row"
            key={name}
            onClick={() => {
              if (onSelectRep) {
                onSelectRep(name)
              } else {
                onAction(t('home.reps.profileOpened', { name }))
              }
            }}
          >
            <Avatar
              initials={name
                .split(' ')
                .map((n) => n[0])
                .join('')}
              variant="rep"
              repIndex={i}
            />
            <div className="rep-name">
              <strong>{name}</strong>
              <span>{lang === 'ar' ? (REGION_NAMES_AR[region] || region) : region}</span>
            </div>
            <b>{salesText}</b>
            <span className="rep-goal">{goal}</span>
            <ChevronRight />
          </button>
        ))}
      </div>
    </section>
  )
}

