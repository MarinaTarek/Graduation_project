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
  userInitials?: string
  onOpenProfile?: () => void
}

export function Header({
  onOpenSearch,
  onOpenNotifications,
  onToggleDark,
  dark,
  role = 'admin',
  greetingName = 'User',
  userInitials,
  onOpenProfile,
}: HeaderProps) {
  const displayInitials = userInitials || (greetingName ? greetingName.slice(0, 2).toUpperCase() : 'U')

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
          title="Notifications"
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
            {displayInitials}
          </button>
        )}
      </div>
    </header>
  )
}
