import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './Button'

export interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`panel ${className}`}
      style={{
        padding: '24px',
        borderRadius: '20px',
        background: 'var(--rose-bg)',
        border: '1px solid var(--rose)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AlertCircle style={{ width: '24px', height: '24px', color: 'var(--rose-text)', flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--rose-text)', fontSize: '15px', display: 'block' }}>
            {title}
          </strong>
          <span style={{ color: 'var(--muted-text)', fontSize: '13px' }}>{message}</span>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="secondary"
          onClick={onRetry}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
        >
          <RefreshCw style={{ width: '14px', height: '14px' }} />
          Retry
        </Button>
      )}
    </div>
  )
}
