'use client'

import { ArrowLeft, Bell, Moon, Search, Sun } from 'lucide-react'
import { useGreeting } from '@/lib/useGreeting'

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
  activePage?: string
  onBack?: () => void
}

export function Header({
  onOpenSearch,
  onOpenNotifications,
  onToggleDark,
  dark,
  role = 'admin',
  greetingName = '',
  userInitials,
  onOpenProfile,
  activePage = 'Home',
  onBack,
}: HeaderProps) {
  const displayInitials = userInitials || (greetingName ? greetingName.slice(0, 2).toUpperCase() : 'U')
  const { greeting, dateLabel } = useGreeting()
  const headingText = greetingName ? `${greeting}, ${greetingName}!` : `${greeting}!`
  const showBack = activePage !== 'Home' && activePage !== 'Login' && activePage !== 'Dashboard'

  return (
    <header className="page-header">
      {/* Left: Back button + Greeting */}
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {showBack && onBack && (
          <button
            onClick={onBack}
            aria-label="Back"
            title="Back"
            className="back-pill-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '40px',
              padding: '0 14px',
              borderRadius: '999px',
              border: '1px solid var(--border-soft)',
              background: 'transparent',
              color: 'var(--heading-text)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-raised)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            <span className="back-pill-label">Back</span>
          </button>
        )}
        <div>
          <h1 className="header-greeting">{headingText}</h1>
          {dateLabel && (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-text)', fontWeight: 400, marginTop: '2px' }}>
              {dateLabel}
            </p>
          )}
        </div>
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
              color: 'var(--text-on-dark)',
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
