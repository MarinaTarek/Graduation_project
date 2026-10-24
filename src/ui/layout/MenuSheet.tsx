import { Languages, LogOut, Moon, Sun } from 'lucide-react'

export interface MenuSheetProps {
  isOpen: boolean
  dark: boolean
  onToggleDark: () => void
  onOpenLogout: () => void
  userName?: string
  accountType?: string
}

export function MenuSheet({
  isOpen,
  dark,
  onToggleDark,
  onOpenLogout,
  userName = 'Alex Morgan',
  accountType = 'Admin account',
}: MenuSheetProps) {
  if (!isOpen) return null

  return (
    <div className="profile-menu">
      <strong>{userName}</strong>
      <span>{accountType}</span>
      <button onClick={onToggleDark}>
        {dark ? <Sun /> : <Moon />}
        {dark ? 'Light mode' : 'Dark mode'}
        <b>{dark ? 'On' : 'Off'}</b>
      </button>
      <button>
        <Languages />
        Language <b>English</b>
      </button>
      <button onClick={onOpenLogout}>
        <LogOut />
        Log out
      </button>
    </div>
  )
}
