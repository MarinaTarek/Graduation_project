'use client'

import { useState } from 'react'

export interface LogoProps {
  size?: number
  textSize?: number
  className?: string
  showText?: boolean
  textColor?: string
}

export function Logo({
  size = 48,
  textSize,
  className = '',
  showText = false,
  textColor = '#FFFFFF',
}: LogoProps) {
  const [hasError, setHasError] = useState(false)
  const actualTextSize = textSize ?? (size >= 64 ? 28 : 22)
  const radius = size >= 64 ? 16 : 12

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }} className={className}>
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${radius}px`,
          padding: '6px',
          background: '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          flexShrink: 0,
        }}
      >
        {!hasError ? (
          <img
            src="/logo.png"
            alt="Navigen"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={() => setHasError(true)}
          />
        ) : (
          <span style={{ fontWeight: 800, fontSize: `${Math.round(size * 0.45)}px`, color: '#1B3554' }}>N</span>
        )}
      </div>
      {showText && (
        <span
          style={{
            fontWeight: 700,
            fontSize: `${actualTextSize}px`,
            color: textColor,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          Navigen
        </span>
      )}
    </div>
  )
}
