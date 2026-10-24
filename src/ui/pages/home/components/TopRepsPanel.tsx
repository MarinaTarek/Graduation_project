import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Avatar } from '@/ui/design-system/components/Avatar'
import { homeReps } from '../mock-data'

export interface TopRepsPanelProps {
  onNavigateMore: () => void
  onAction: (s: string) => void
  onSelectRep?: (repName: string) => void
}

export function TopRepsPanel({
  onNavigateMore,
  onAction,
  onSelectRep,
}: TopRepsPanelProps) {
  return (
    <section className="panel reps-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">FIELD TEAM</span>
          <h3>Top reps this month</h3>
        </div>
        <Button variant="round-arrow" onClick={onNavigateMore}>
          <ArrowUpRight />
        </Button>
      </div>
      <div className="rep-list">
        {homeReps.map(([name, region, sales, goal], i) => (
          <button
            className="rep-row"
            key={name}
            onClick={() => {
              if (onSelectRep) {
                onSelectRep(name)
              } else {
                onAction(`${name}'s profile opened`)
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
              <span>{region}</span>
            </div>
            <b>{sales}</b>
            <span className="rep-goal">{goal}</span>
            <ChevronRight />
          </button>
        ))}
      </div>
    </section>
  )
}
