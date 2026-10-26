import { Languages, LogOut, Moon, Sun } from 'lucide-react'
import { useT } from '@/lib/i18n'

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
      <strong>{userName}</strong>
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
