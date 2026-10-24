'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface DropdownPortalProps {
  isOpen: boolean
  anchorEl: HTMLElement | null
  onClose: () => void
  children: React.ReactNode
  width?: number | string
  align?: 'left' | 'right'
  className?: string
  style?: React.CSSProperties
}

export function DropdownPortal({
  isOpen,
  anchorEl,
  onClose,
  children,
  width,
  align = 'left',
  className = '',
  style = {},
}: DropdownPortalProps) {
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen || !anchorEl) return

    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const flipUp = spaceBelow < 280 && spaceAbove > spaceBelow

      const targetWidth = typeof width === 'number' ? width : 280
      const baseLeft = align === 'right' ? rect.right - targetWidth : rect.left
      const left = Math.max(12, Math.min(baseLeft, window.innerWidth - targetWidth - 16))

      if (flipUp) {
        setCoords({ bottom: window.innerHeight - rect.top + 8, left })
      } else {
        setCoords({ top: rect.bottom + 8, left })
      }
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        anchorEl &&
        !anchorEl.contains(target)
      ) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, anchorEl, onClose, width])

  if (!mounted || !isOpen || !anchorEl || !coords) return null

  return createPortal(
    <div
      ref={menuRef}
      className={`panel ${className}`}
      style={{
        position: 'fixed',
        top: coords.top !== undefined ? `${coords.top}px` : undefined,
        bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
        left: `${coords.left}px`,
        width: width ? (typeof width === 'number' ? `${width}px` : width) : 'auto',
        minWidth: '240px',
        maxHeight: 'min(420px, 80vh)',
        overflowY: 'auto',
        zIndex: 1000,
        boxShadow: 'var(--shadow)',
        borderRadius: '16px',
        padding: '16px',
        ...style,
      }}
    >
      {children}
    </div>,
    document.body
  )
}
