'use client'

import { useRef } from 'react'
import type { ElementType } from 'react'
import {
  Activity, ArrowUpRight, BarChart2, CalendarDays, ChevronLeft, ChevronRight,
  ClipboardCheck, FileText, LayoutGrid, MapPin, Package,
  Power, Settings2, Shield, Stethoscope, Target, User, Users,
} from 'lucide-react'
import { canAccessPage } from '@/lib/auth'

export interface SidebarProps {
  active: string
  onSelect: (label: string) => void
  role?: 'admin' | 'rep'
  collapsed?: boolean
  onToggleCollapse?: () => void
  onOpenLogout: () => void
  userName?: string
  userEmail?: string
}

export function Sidebar({
  active,
  onSelect,
  role = 'admin',
  collapsed = false,
  onToggleCollapse,
  onOpenLogout,
  userName = 'User',
  userEmail = '',
}: SidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  interface NavItem {
    label: string
    activeKey: string
    icon: ElementType
    badge?: string
  }

  // Standard items visible to both Admin and Rep
  const baseNav: NavItem[] = [
    { label: 'Dashboard', activeKey: 'Home', icon: LayoutGrid },
    { label: 'Clients', activeKey: 'Clients', icon: Users },
    { label: 'Invoices', activeKey: 'Invoices', icon: FileText, badge: '5' },
    { label: 'Stock', activeKey: 'Stock', icon: Package },
    { label: 'Sell-in', activeKey: 'Sell-in', icon: ArrowUpRight },
    { label: 'Sell-out', activeKey: 'Sell-out', icon: Activity },
    { label: 'Targets', activeKey: 'Targets', icon: Target },
    { label: 'Visits', activeKey: 'Visits', icon: Stethoscope },
    { label: 'Visit plan', activeKey: 'Visit plan', icon: CalendarDays },
  ]

  // Admin-only items
  const adminNav: NavItem[] = [
    { label: 'Reports', activeKey: 'Reports', icon: BarChart2 },
    { label: 'Admin', activeKey: 'Admin', icon: Shield },
    { label: 'Users', activeKey: 'Users', icon: Users },
    { label: 'Products & Batches', activeKey: 'Products & Batches', icon: Package },
    { label: 'Territories', activeKey: 'Territories', icon: MapPin },
    { label: 'Audit log', activeKey: 'Audit log', icon: ClipboardCheck },
    { label: 'Settings', activeKey: 'Settings', icon: Settings2 },
  ]

  // Rep-only items
  const repNav: NavItem[] = [
    { label: 'My scorecard', activeKey: 'Reports', icon: BarChart2 },
    { label: 'My profile', activeKey: 'Profile', icon: User },
  ]

  const navItems: NavItem[] = canAccessPage('Admin', role)
    ? [...baseNav, ...adminNav]
    : [...baseNav, ...repNav]

  return (
    <aside
      className={`app-sidebar ${collapsed ? 'is-collapsed' : ''}`}
      aria-label="Main Navigation"
    >
      {/* Top Profile Zone (Fixed) */}
      <div className="sidebar-top">
        <div className="sidebar-avatar-wrap">
          <div className="sidebar-avatar" aria-hidden="true">
            {userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        </div>

        {!collapsed && (
          <div className="sidebar-profile-info">
            <span className="sidebar-user-name">{userName}</span>
            <span className="sidebar-user-email">{userEmail}</span>
          </div>
        )}

        {onToggleCollapse && (
          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        )}
      </div>

      {/* Middle Nav Items Zone (Scrollable with thin scrollbar & edge mask) */}
      <div ref={scrollRef} className="sidebar-scroll-zone">
        <nav className="sidebar-nav-list" aria-label="Sidebar Links">
          {navItems.map((item) => {
            const Icon = item.icon
            const isItemActive = active === item.activeKey || (item.activeKey === 'Home' && active === 'Dashboard')
            return (
              <button
                key={item.label}
                className={`sidebar-nav-item ${isItemActive ? 'active' : ''}`}
                onClick={() => onSelect(item.activeKey)}
                title={item.label}
                aria-label={item.label}
              >
                <div className="sidebar-item-icon">
                  <Icon />
                </div>
                {!collapsed && (
                  <span className="sidebar-item-label">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="sidebar-item-badge">{item.badge}</span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom Log out Zone (Fixed) */}
      <div className="sidebar-bottom">
        <button
          className="sidebar-logout-btn"
          onClick={onOpenLogout}
          title="Log out"
          aria-label="Log out"
        >
          <div className="sidebar-item-icon">
            <Power />
          </div>
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  )
}
