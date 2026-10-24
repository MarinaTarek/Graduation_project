'use client'

import { useState } from 'react'

export interface LogoProps {
  size?: number
  className?: string
  showText?: boolean
}

export function Logo({ size = 32, className = '', showText = false }: LogoProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className={`brand-mark ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span />
        <span />
        <span />
        <span style={{ fontWeight: 800, fontSize: `${Math.round(size * 0.55)}px`, color: 'var(--heading-text)', letterSpacing: '-0.03em' }}>
          Navigen
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} className={className}>
      <img
        src="/logo.png"
        alt="Navigen"
        width={size}
        height={size}
        onError={() => setHasError(true)}
        style={{ objectFit: 'contain', verticalAlign: 'middle', borderRadius: '6px' }}
      />
      {showText && (
        <span style={{ fontWeight: 800, fontSize: `${Math.round(size * 0.6)}px`, color: 'var(--heading-text)', letterSpacing: '-0.03em' }}>
          Navigen
        </span>
      )}
    </div>
  )
}
