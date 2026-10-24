'use client'

import React, { useRef } from 'react'
import { FilterChip } from './FilterChip'
import { DropdownPortal } from './DropdownPortal'
import { Button } from './Button'

export interface FilterDropdownProps {
  label: string
  active?: boolean
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  title: string
  width?: number
  onReset: () => void
  resetLabel?: string
  onApply: () => void
  children: React.ReactNode
}

export function FilterDropdown({
  label,
  active = false,
  isOpen,
  onToggle,
  onClose,
  title,
  width = 240,
  onReset,
  resetLabel = 'Reset',
  onApply,
  children,
}: FilterDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} style={{ display: 'inline-block' }}>
      <FilterChip
        label={label}
        active={active}
        isOpen={isOpen}
        onClick={onToggle}
      />

      <DropdownPortal
        isOpen={isOpen}
        anchorEl={containerRef.current}
        onClose={onClose}
        width={width}
      >
        <span
          className="eyebrow"
          style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--muted-text)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
          {children}
        </div>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '14px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <Button
            type="button"
            variant="secondary"
            style={{
              flex: 1,
              height: '36px',
              minHeight: '36px',
              fontSize: '13px',
              padding: '0 8px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={onReset}
          >
            {resetLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            style={{
              flex: 1,
              height: '36px',
              minHeight: '36px',
              fontSize: '13px',
              padding: '0 8px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={onApply}
          >
            Apply
          </Button>
        </div>
      </DropdownPortal>
    </div>
  )
}
