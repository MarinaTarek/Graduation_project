import { Languages, LogOut, Moon, Sun, X } from 'lucide-react'
import { useT } from '@/lib/i18n'

export interface MenuSheetProps {
  isOpen: boolean
  onClose?: () => void
  dark: boolean
  onToggleDark: () => void
  onOpenLogout: () => void
  userName?: string
  accountType?: string
}

export function MenuSheet({
  isOpen,
  onClose,
  dark,
  onToggleDark,
  onOpenLogout,
  userName = 'User',
  accountType = 'Admin account',
}: MenuSheetProps) {
  const { t, lang, setLang } = useT()
  if (!isOpen) return null

  const displayAccountType =
    lang === 'ar'
      ? accountType === 'Admin account'
        ? 'حساب المدير'
        : 'مندوب دعاية طبية'
      : accountType

  return (
    <div className="profile-menu">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <strong>{userName}</strong>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted-text)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>
      <span>{displayAccountType}</span>
      <button onClick={onToggleDark}>
        {dark ? <Sun /> : <Moon />}
        {dark ? (lang === 'ar' ? 'الوضع الفاتح' : 'Light mode') : (lang === 'ar' ? 'الوضع الداكن' : 'Dark mode')}
        <b>{dark ? (lang === 'ar' ? 'مفعل' : 'On') : (lang === 'ar' ? 'معطل' : 'Off')}</b>
      </button>
      <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
        <Languages />
        {lang === 'ar' ? 'اللغة' : 'Language'} <b>{lang === 'ar' ? 'العربية' : 'English'}</b>
      </button>
      <button onClick={onOpenLogout}>
        <LogOut />
        {t('nav.logout')}
      </button>
    </div>
  )
}
