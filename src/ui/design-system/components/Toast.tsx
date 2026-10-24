import type { ReactNode } from 'react'
import { ClipboardCheck } from 'lucide-react'

export interface ToastProps {
  message?: string
  children?: ReactNode
  className?: string
}

export function Toast({ message, children, className = '' }: ToastProps) {
  return (
    <div className={`toast ${className}`} role="status">
      <ClipboardCheck /> {message || children}
    </div>
  )
}
