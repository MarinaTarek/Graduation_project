import { LogOut } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { useT } from '@/lib/i18n'
import { loginMockData } from '../mock-data'

export interface LogoutConfirmDialogProps {
  isOpen?: boolean
  onClose: () => void
  onConfirmLogout: () => void
}

export function LogoutConfirmDialog({
  isOpen = true,
  onClose,
  onConfirmLogout,
}: LogoutConfirmDialogProps) {
  const { t, lang } = useT()
  if (!isOpen) return null

  const title = lang === 'ar' ? 'هل تريد تسجيل الخروج من نافيجين؟' : 'Log out of Navigen?'
  const kicker = lang === 'ar' ? 'تأكيد' : 'CONFIRMATION'
  const sessionNotice = lang === 'ar' ? loginMockData.sessionNotice_ar : loginMockData.sessionNotice

  return (
    <Drawer title={title} kicker={kicker} onClose={onClose}>
      <p className="sheet-copy">{sessionNotice}</p>
      <div className="sheet-actions">
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" onClick={onConfirmLogout}>
          <LogOut data-icon="inline-start" /> {t('nav.logout')}
        </Button>
      </div>
    </Drawer>
  )
}
