import type { ElementType } from 'react'
import { FileText, Home, MoreHorizontal, Package, Users } from 'lucide-react'

export interface DockItem {
  label: string
  icon: ElementType
}

export interface BottomDockProps {
  active: string
  onSelect: (label: string) => void
}

export function BottomDock({ active, onSelect }: BottomDockProps) {
  const nav: DockItem[] = [
    { label: 'Home', icon: Home },
    { label: 'Clients', icon: Users },
    { label: 'Invoices', icon: FileText },
    { label: 'Stock', icon: Package },
    { label: 'More', icon: MoreHorizontal },
  ]

  return (
    <nav className="bottom-dock" aria-label="Primary navigation">
      {nav.map(({ label, icon: Icon }) => (
        <button
          key={label}
          className={active === label ? 'active' : ''}
          onClick={() => onSelect(label)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
