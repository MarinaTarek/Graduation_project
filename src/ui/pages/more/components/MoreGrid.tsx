import { ChevronRight } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { moreLinksMockData } from '../mock-data'

export interface MoreGridProps {
  onSelectPage: (page: string) => void
  onAction: (actionText: string) => void
  role?: 'admin' | 'rep'
}

export function MoreGrid({ onSelectPage, onAction, role = 'admin' }: MoreGridProps) {
  const { t, lang } = useT()
  const visibleLinks = moreLinksMockData.filter((item) => !(item.adminOnly && role === 'rep'))

  return (
    <div className="more-grid">
      {visibleLinks.map((item) => {
        const Icon = item.icon
        const displayName = lang === 'ar' && item.name_ar ? item.name_ar : item.name
        return (
          <button
            key={item.name}
            onClick={() => {
              if (item.targetPage) {
                onSelectPage(item.targetPage)
              } else {
                onAction(t('more.itemOpened', { name: displayName }))
              }
            }}
          >
            <div>
              <Icon />
            </div>
            <strong>{displayName}</strong>
            <ChevronRight />
          </button>
        )
      })}
    </div>
  )
}
