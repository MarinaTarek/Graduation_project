import { useEffect, useRef, useState } from 'react'
import type { ElementType } from 'react'
import {
  Activity, ArrowUpRight, Bell, CalendarDays, ClipboardCheck,
  FileText, Home, LogOut, MapPin, Moon, Package,
  Plus, Search, Settings2, Stethoscope, Sun, Target, Users,
} from 'lucide-react'
import { Logo } from './Logo'

export interface SidebarProps {
  active: string
  onSelect: (label: string) => void
  dark: boolean
  onToggleDark: () => void
  onOpen: (name: string) => void
}

export function Sidebar({
  active,
  onSelect,
  dark,
  onToggleDark,
  onOpen,
}: SidebarProps) {
  const [expanded, setExpanded] = useState(false)
  const [pinned, setPinned] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const primary = [
    ['Home', Home],
    ['Clients', Users],
    ['Invoices', FileText],
    ['Stock', Package],
  ] as const

  const sales = [
    ['Sell-in', ArrowUpRight],
    ['Sell-out', Activity],
    ['Targets', Target],
  ] as const

  const field = [
    ['Visits', Stethoscope],
    ['Visit plan', CalendarDays],
  ] as const

  const manage = [
    ['Users', Users],
    ['Products & Batches', Package],
    ['Territories', MapPin],
    ['Audit log', ClipboardCheck],
    ['Settings', Settings2],
  ] as const

  const isOpen = expanded || pinned

  useEffect(() => {
    const activeItem = scrollRef.current?.querySelector('.rail-item.active')
    activeItem?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [active])

  const renderItem = (label: string, Icon: ElementType) => (
    <button
      key={label}
      className={`rail-item ${active === label ? 'active' : ''}`}
      onClick={() => onSelect(label)}
      title={!isOpen ? label : undefined}
    >
      <Icon />
      <span>{label}</span>
      {label === 'Invoices' && <b>5</b>}
    </button>
  )

  return (
    <aside
      className={`side-rail ${isOpen ? 'is-expanded' : ''} ${pinned ? 'is-pinned' : ''}`}
      onMouseEnter={() => !pinned && setExpanded(true)}
      onMouseLeave={() => !pinned && setExpanded(false)}
    >
      <div className="rail-top">
        <button
          className="rail-logo"
          aria-label="Medora home"
          onClick={() => onSelect('Home')}
        >
          <Logo />
          <span>medora</span>
        </button>
        <button className="rail-search" onClick={() => onOpen('search')}>
          <Search />
          <span>Search anything...</span>
          <kbd>⌘K</kbd>
        </button>
      </div>

      <div ref={scrollRef} className="rail-scroll-zone" aria-label="Rail navigation">
        <div className="rail-primary">
          {primary.map(([label, Icon]) => renderItem(label, Icon))}
        </div>

        <button className="visit-rail" onClick={() => onOpen('new visit')}>
          <Plus />
          <span>New visit</span>
        </button>

        <div className="rail-groups">
          <div>
            <small>SALES</small>
            {sales.map(([label, Icon]) => renderItem(label, Icon))}
          </div>
          <div>
            <small>FIELD</small>
            {field.map(([label, Icon]) => renderItem(label, Icon))}
          </div>
          <div>
            <small>MANAGE</small>
            {manage.map(([label, Icon]) => renderItem(label, Icon))}
          </div>
        </div>
      </div>

      <div className="rail-bottom">
        <button
          className="rail-item"
          onClick={() => onOpen('notifications')}
          title={!isOpen ? 'Notifications' : undefined}
        >
          <Bell />
          <span>Notifications</span>
          <i />
        </button>
        <button
          className="rail-item"
          onClick={onToggleDark}
          aria-label="Toggle dark mode"
          title={!isOpen ? 'Toggle dark mode' : undefined}
        >
          {dark ? <Sun /> : <Moon />}
          <span>{dark ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <button className="rail-item" onClick={() => onOpen('profile')}>
          <div className="rail-avatar">AM</div>
          <span>Alex Morgan</span>
        </button>
        <button className="rail-item" onClick={() => onOpen('logout')}>
          <LogOut />
          <span>Log out</span>
        </button>
      </div>

      <button
        className={`rail-pin ${pinned ? 'on' : ''}`}
        onClick={() => setPinned(!pinned)}
        aria-label={pinned ? 'Unpin rail' : 'Pin rail'}
      >
        •
      </button>
    </aside>
  )
}
