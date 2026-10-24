import { ChevronRight } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { moreLinksMockData } from '../mock-data'

export interface MoreGridProps {
  onSelectPage: (page: string) => void
  onAction: (actionText: string) => void
}

export function MoreGrid({ onSelectPage, onAction }: MoreGridProps) {
  const { t } = useT()
  return (
    <div className="more-grid">
      {moreLinksMockData.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.name}
            onClick={() => {
              if (item.targetPage) {
                onSelectPage(item.targetPage)
              } else {
                onAction(t('more.itemOpened', { name: item.name }))
              }
            }}
          >
            <div>
              <Icon />
            </div>
            <strong>{item.name}</strong>
            <ChevronRight />
          </button>
        )
      })}
    </div>
  )
}
