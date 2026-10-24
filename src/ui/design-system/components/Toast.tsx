import type { ReactNode } from 'react'
import { ClipboardCheck } from 'lucide-react'

export interface ToastProps {
  message?: string
  children?: ReactNode
  className?: string
  onUndo?: () => void
}

export function Toast({ message, children, className = '', onUndo }: ToastProps) {
  return (
    <div className={`toast ${className}`} role="status" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <ClipboardCheck />
      <span>{message || children}</span>
      {onUndo && (
        <button
          onClick={onUndo}
          style={{
            background: 'var(--mist)',
            color: 'var(--navy)',
            border: 'none',
            borderRadius: '99px',
            padding: '2px 10px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            marginLeft: '8px',
          }}
        >
          Undo
        </button>
      )}
    </div>
  )
}
