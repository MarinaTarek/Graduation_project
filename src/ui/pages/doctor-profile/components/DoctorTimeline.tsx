import { Timeline } from '@/ui/design-system/components/Timeline'

export interface DoctorTimelineProps {
  events: { date: string; detail: string }[]
}

export function DoctorTimeline({ events }: DoctorTimelineProps) {
  return <Timeline events={events} />
}
