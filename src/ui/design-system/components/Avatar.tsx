export interface AvatarProps {
  initials: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ocean' | 'navy' | 'rep'
  repIndex?: number
  className?: string
}

export function Avatar({
  initials,
  size = 'md',
  variant = 'ocean',
  repIndex,
  className = '',
}: AvatarProps) {
  if (size === 'lg') {
    return <div className={`large-avatar ${className}`}>{initials}</div>
  }

  if (variant === 'rep' && typeof repIndex === 'number') {
    return <div className={`rep-avatar rep-${repIndex % 4} ${className}`}>{initials}</div>
  }

  return <div className={`avatar ${className}`}>{initials}</div>
}
