import { Avatar } from '@/ui/design-system/components/Avatar'

export interface DoctorHeroProps {
  name?: string
  initials: string
  region: string
  assignedRep: string
}

export function DoctorHero({
  initials,
  region,
  assignedRep,
}: DoctorHeroProps) {
  return (
    <div className="profile-hero">
      <Avatar initials={initials} size="lg" />
      <div>
        <strong>{region}</strong>
        <span>{assignedRep}</span>
      </div>
    </div>
  )
}
