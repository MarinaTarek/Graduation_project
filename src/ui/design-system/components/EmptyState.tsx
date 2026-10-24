import type { ElementType, ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'

export interface EmptyStateProps {
  icon?: ElementType
  message?: string
  children?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon = CheckCircle2,
  message = 'Everything is synced and up to date',
  children,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`empty-hint ${className}`}>
      <Icon /> {children || message}
    </div>
  )
}
