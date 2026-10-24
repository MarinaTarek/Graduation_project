import type { ReactNode } from 'react'

export interface ModalProps {
  isOpen?: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Modal({ isOpen = true, onClose, children, className = '' }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`command-palette ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
