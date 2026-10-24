import { CalendarDays, ChevronRight } from 'lucide-react'
import { Chip } from '@/ui/design-system/components/Chip'

export interface HomeFiltersProps {
  range: string
  setRange: (r: string) => void
}

export function HomeFilters({ range, setRange }: HomeFiltersProps) {
  return (
    <div className="filters">
      <Chip active>
        Month <ChevronRight />
      </Chip>
      <Chip>
        All regions <ChevronRight />
      </Chip>
      <Chip>
        All reps <ChevronRight />
      </Chip>
      <Chip>
        All products <ChevronRight />
      </Chip>
      <span className="filter-spacer" />
      <button
        className="view-toggle"
        onClick={() => setRange(range === 'Month' ? 'Week' : 'Month')}
      >
        <CalendarDays /> {range}
      </button>
    </div>
  )
}
