'use client'

import { Bell, Moon, Search, Sun, UserCheck, Shield } from 'lucide-react'

export interface HeaderProps {
  onOpenSearch: () => void
  onOpenNotifications: () => void
  onToggleDark: () => void
  dark: boolean
  role?: 'admin' | 'rep'
  onToggleRole?: () => void
  greetingName?: string
  onOpenProfile?: () => void
}

export function Header({
  onOpenSearch,
  onOpenNotifications,
  onToggleDark,
  dark,
  role = 'admin',
  onToggleRole,
  greetingName = 'Alex',
  onOpenProfile,
}: HeaderProps) {
  return (
    <header className="page-header">
      {/* Left: Greeting */}
      <div className="header-left">
        <h1 className="header-greeting">Welcome {greetingName}!</h1>
      </div>

      {/* Right: Controls */}
      <div className="header-right">
        {/* Pill-shaped search field with 1.5px Navy border */}
        <button
          className="header-search-pill"
          onClick={onOpenSearch}
          aria-label="Search"
        >
          <Search className="search-icon" />
          <span>Search anything...</span>
          <kbd>⌘ K</kbd>
        </button>

        {/* Admin / Rep View Switcher */}
        {onToggleRole && (
          <button
            className="role-switch-pill"
            onClick={onToggleRole}
            title={`Current view: ${role.toUpperCase()}. Click to switch to ${role === 'admin' ? 'Rep' : 'Admin'} view.`}
            aria-label="Toggle user role view"
          >
            {role === 'admin' ? <Shield className="role-icon" /> : <UserCheck className="role-icon" />}
            <span>{role === 'admin' ? 'Admin' : 'Rep'} view</span>
          </button>
        )}

        {/* Light / Dark Toggle Switch */}
        <button
          className="theme-toggle-switch"
          onClick={onToggleDark}
          aria-label={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={dark ? 'Light mode' : 'Dark mode'}
        >
          <span className={`switch-thumb ${dark ? 'dark' : 'light'}`}>
            {dark ? <Moon className="switch-icon" /> : <Sun className="switch-icon" />}
          </span>
        </button>

        {/* Notification Bell with Rose Dot */}
        <button
          className="header-bell-btn"
          aria-label="Notifications"
          onClick={onOpenNotifications}
        >
          <Bell />
          <span className="bell-rose-dot" />
        </button>

        {/* User Profile Avatar (MenuSheet trigger on desktop) */}
        {onOpenProfile && (
          <button
            className="header-avatar-btn"
            onClick={onOpenProfile}
            aria-label="User profile menu"
            title="User profile menu"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--navy)',
              color: '#FFFFFF',
              border: '2px solid var(--border-subtle)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              marginLeft: '4px',
            }}
          >
            AM
          </button>
        )}
      </div>
    </header>
  )
}
