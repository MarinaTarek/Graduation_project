import { useState } from 'react'
import { Search } from 'lucide-react'
import { Drawer } from '@/ui/design-system/components/Drawer'

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onAction: (actionText: string) => void
  onNavigate?: (page: string) => void
}

const ACTION_PAGES: Record<string, string> = {
  Doctors: 'Clients',
  Pharmacies: 'Clients',
  Invoices: 'Invoices & Sell-in',
  Stock: 'Stock',
  Visits: 'Visits',
  Reports: 'Reports',
  Products: 'Products & Batches',
  Settings: 'Settings',
}

export function CommandPalette({
  isOpen,
  onClose,
  onAction,
  onNavigate,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')

  if (!isOpen) return null

  const quickActions = [
    'Doctors',
    'Pharmacies',
    'Invoices',
    'Stock',
    'Visits',
    'Reports',
    'Products',
    'Settings',
  ]

  const filtered = quickActions.filter((x) =>
    x.toLowerCase().includes(query.trim().toLowerCase())
  )

  const handleSelectAction = (actionName: string) => {
    onClose()
    const targetPage = ACTION_PAGES[actionName]
    if (targetPage && onNavigate) {
      onNavigate(targetPage)
    } else {
      onAction(`Searching ${actionName.toLowerCase()}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filtered.length > 0) {
        handleSelectAction(filtered[0])
      } else if (query.trim()) {
        onClose()
        onAction(`Searching for "${query.trim()}"`)
      }
    }
  }

  return (
    <Drawer title="Search Navigen" kicker="COMMAND PALETTE" onClose={onClose}>
      <div className="command-search">
        <Search />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search doctors, invoices, products..."
        />
      </div>
      <div className="command-group">
        <span>Recent & quick actions</span>
        {filtered.length > 0 ? (
          filtered.map((x) => (
            <button
              key={x}
              onClick={() => handleSelectAction(x)}
            >
              <Search />
              {x}
              <kbd>↵</kbd>
            </button>
          ))
        ) : (
          <div style={{ padding: '12px 16px', color: 'var(--muted-text)', fontSize: '13px' }}>
            No matching actions found
          </div>
        )}
      </div>
    </Drawer>
  )
}
