import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export interface DrawerProps {
  title: string
  kicker: string
  isOpen?: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Drawer({
  title,
  kicker,
  isOpen = true,
  onClose,
  children,
  className = '',
}: DrawerProps) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <aside
        className={`side-sheet ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head">
          <div>
            <span className="eyebrow">{kicker}</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        {children}
      </aside>
    </div>
  )
}
