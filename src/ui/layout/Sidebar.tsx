'use client'

import { useState, useEffect, useRef } from 'react'
import type { ElementType } from 'react'
import {
  Activity, ArrowUpRight, BarChart2, CalendarDays, ChevronLeft, ChevronRight,
  ClipboardCheck, FileText, LayoutGrid, MapPin, Package,
  Power, Settings2, Shield, Stethoscope, Target, User, Users,
} from 'lucide-react'
import { canAccessPage, type User as AuthUser } from '@/lib/auth'
import { getPendingUsersCount } from '@/lib/auth/mock-users'
import { Logo } from './Logo'

export interface SidebarProps {
  active: string
  onSelect: (label: string) => void
  role?: 'admin' | 'rep'
  collapsed?: boolean
  onToggleCollapse?: () => void
  onOpenLogout: () => void
  userName?: string
  userEmail?: string
  user?: AuthUser | null
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
  user,
}: SidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [pendingCount, setPendingCount] = useState<number>(() =>
    typeof window !== 'undefined' ? getPendingUsersCount() : 0
  )

  useEffect(() => {
    const updateCount = () => setPendingCount(getPendingUsersCount())
    updateCount()
    window.addEventListener('navigen_users_updated', updateCount)
    return () => window.removeEventListener('navigen_users_updated', updateCount)
  }, [])

  interface NavItem {
    label: string
    activeKey: string
    icon: ElementType
    badge?: string
    badgeTone?: 'amber'
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
    {
      label: 'Users',
      activeKey: 'Users',
      icon: Users,
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
      badgeTone: 'amber',
    },
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

  const candidateItems: NavItem[] = canAccessPage('Admin', role, user)
    ? [...baseNav, ...adminNav]
    : [...baseNav, ...repNav]

  const navItems: NavItem[] = candidateItems.filter((item) =>
    item.activeKey === 'Profile' || canAccessPage(item.activeKey, role, user)
  )

  return (
    <aside
      className={`app-sidebar ${collapsed ? 'is-collapsed' : ''}`}
      aria-label="Main Navigation"
    >
      {/* Brand Logo & Name */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          overflow: 'visible',
        }}
      >
        <Logo showText={!collapsed} textColor="#FFFFFF" />
      </div>

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
                  <span
                    className="sidebar-item-badge"
                    style={{
                      background: item.badgeTone === 'amber' ? 'var(--amber, #f59e0b)' : undefined,
                      color: item.badgeTone === 'amber' ? '#fff' : undefined,
                      fontWeight: 700,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: item.badgeTone === 'amber' ? 'var(--amber, #f59e0b)' : 'var(--ocean)',
                    }}
                  />
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
