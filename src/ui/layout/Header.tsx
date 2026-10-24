import { Bell, ChevronRight, Search } from 'lucide-react'
import { Logo } from './Logo'
import { Avatar } from '@/ui/design-system/components/Avatar'

export interface HeaderProps {
  onOpenSearch: () => void
  onOpenNotifications: () => void
  onToggleProfile: () => void
  isProfileOpen?: boolean
  userName?: string
  userRole?: string
  avatarInitials?: string
}

export function Header({
  onOpenSearch,
  onOpenNotifications,
  onToggleProfile,
  userName = 'Alex Morgan',
  userRole = 'Admin',
  avatarInitials = 'AM',
}: HeaderProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <Logo />
        <span>medora</span>
      </div>
      <div className="topbar-actions">
        <button className="search-trigger" onClick={onOpenSearch}>
          <Search data-icon="inline-start" />
          <span>Search anything</span>
          <kbd>⌘ K</kbd>
        </button>
        <button
          className="icon-button"
          aria-label="Notifications"
          onClick={onOpenNotifications}
        >
          <Bell />
          <i />
        </button>
        <button className="profile" onClick={onToggleProfile}>
          <Avatar initials={avatarInitials} size="md" />
          <div>
            <strong>{userName}</strong>
            <span>{userRole}</span>
          </div>
          <ChevronRight />
        </button>
      </div>
    </header>
  )
}
