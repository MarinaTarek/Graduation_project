import { Search } from 'lucide-react'
import { Drawer } from '@/ui/design-system/components/Drawer'

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onAction: (actionText: string) => void
}

export function CommandPalette({
  isOpen,
  onClose,
  onAction,
}: CommandPaletteProps) {
  if (!isOpen) return null

  const quickActions = ['Doctors', 'Pharmacies', 'Invoices', 'Products']

  return (
    <Drawer title="Search Navigen" kicker="COMMAND PALETTE" onClose={onClose}>
      <div className="command-search">
        <Search />
        <input autoFocus placeholder="Search doctors, invoices, products..." />
      </div>
      <div className="command-group">
        <span>Recent & quick actions</span>
        {quickActions.map((x) => (
          <button
            key={x}
            onClick={() => {
              onClose()
              onAction(`Searching ${x.toLowerCase()}`)
            }}
          >
            <Search />
            {x}
            <kbd>↵</kbd>
          </button>
        ))}
      </div>
    </Drawer>
  )
}
