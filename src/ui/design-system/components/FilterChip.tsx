'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'

export interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
  isOpen?: boolean
}

export const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ label, active = false, isOpen = false, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`home-filter-chip ${active ? 'filter-active' : ''} ${className}`}
        aria-expanded={isOpen}
        {...props}
      >
        <span>{label}</span>
        <ChevronDown style={{ width: '14px', height: '14px', flexShrink: 0 }} />
      </button>
    )
  }
)

FilterChip.displayName = 'FilterChip'
