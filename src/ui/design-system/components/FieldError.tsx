import React from 'react'

export interface FieldErrorProps {
  message?: string | null
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null
  return (
    <span
      role="alert"
      style={{
        display: 'block',
        color: 'var(--rose-text)',
        fontSize: '12px',
        marginTop: '4px',
        fontWeight: 500,
      }}
    >
      {message}
    </span>
  )
}
