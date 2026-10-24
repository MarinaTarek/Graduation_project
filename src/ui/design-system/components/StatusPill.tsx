export interface StatusPillProps {
  status: string
  className?: string
}

export function StatusPill({ status, className = '' }: StatusPillProps) {
  const normalized = status.toLowerCase().replace(/\s+/g, '-')
  return (
    <span className={`status ${normalized} ${className}`}>
      {status}
    </span>
  )
}
