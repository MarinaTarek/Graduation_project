import { ChevronRight } from 'lucide-react'
import { moreLinksMockData } from '../mock-data'

export interface MoreGridProps {
  onSelectPage: (page: string) => void
  onAction: (actionText: string) => void
}

export function MoreGrid({ onSelectPage, onAction }: MoreGridProps) {
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
                onAction(`${item.name} opened`)
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
