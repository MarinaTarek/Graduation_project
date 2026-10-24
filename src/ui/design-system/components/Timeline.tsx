export interface TimelineEvent {
  date: string
  detail: string
}

export interface TimelineProps {
  events: TimelineEvent[]
  className?: string
}

export function Timeline({ events, className = '' }: TimelineProps) {
  return (
    <div className={`timeline ${className}`}>
      {events.map((event, index) => (
        <div key={index}>
          <b>{event.date}</b>
          <span>{event.detail}</span>
        </div>
      ))}
    </div>
  )
}
