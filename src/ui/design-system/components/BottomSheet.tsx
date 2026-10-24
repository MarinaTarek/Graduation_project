import type { ReactNode } from 'react'

export interface BottomSheetProps {
  isOpen?: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function BottomSheet({
  isOpen = true,
  onClose,
  children,
  className = '',
}: BottomSheetProps) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`bottom-sheet-panel ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
