import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { DoctorHero } from './components/DoctorHero'
import { DoctorTimeline } from './components/DoctorTimeline'
import { doctorProfileMockData } from './mock-data'

export interface DoctorProfilePageProps {
  onClose: () => void
  onNewVisit: () => void
  onSave: () => void
}

export default function DoctorProfilePage({
  onClose,
  onNewVisit,
  onSave,
}: DoctorProfilePageProps) {
  const data = doctorProfileMockData

  return (
    <Drawer
      title={data.name}
      kicker={data.kicker}
      onClose={onClose}
    >
      <DoctorHero
        initials={data.initials}
        region={data.region}
        assignedRep={data.assignedRep}
      />
      <DoctorTimeline events={data.timeline} />
      <div className="sheet-actions">
        <Button variant="secondary" onClick={onNewVisit}>
          + New visit
        </Button>
        <Button variant="primary" onClick={onSave}>
          Edit doctor
        </Button>
      </div>
    </Drawer>
  )
}
