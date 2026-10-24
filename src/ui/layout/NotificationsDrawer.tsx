import { ChevronRight } from 'lucide-react'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { useT } from '@/lib/i18n'
import { mockNotificationsList, earlierNotificationsList } from './notifications-mock'

export interface NotificationsDrawerProps {
  isOpen: boolean
  onClose: () => void
  onAction: (s: string) => void
}

export function NotificationsDrawer({
  isOpen,
  onClose,
  onAction,
}: NotificationsDrawerProps) {
  const { t } = useT()
  if (!isOpen) return null

  return (
    <Drawer title={t('notifications.title')} kicker={t('notifications.kicker')} onClose={onClose}>
      <button
        className="text-button"
        onClick={() => onAction(t('notifications.markedAllReadToast'))}
      >
        {t('notifications.markAllRead')}
      </button>
      <div className="notice-list">
        <span className="eyebrow">{t('notifications.today')}</span>
        {mockNotificationsList.map((item, i) => (
          <button key={item.id} onClick={() => onAction(t('notifications.openedToast'))}>
            <div className={`notice-dot ${item.dotClass || `n-${i % 3}`}`} />
            <div>
              <strong>{item.title}</strong>
              <small>{item.time}</small>
            </div>
            <ChevronRight />
          </button>
        ))}
        <span className="eyebrow">{t('notifications.earlier')}</span>
        {earlierNotificationsList.map((item) => (
          <button key={item.id} onClick={() => onAction(t('notifications.openedToast'))}>
            <div className={`notice-dot ${item.dotClass || 'n-2'}`} />
            <div>
              <strong>{item.title}</strong>
              <small>{item.time}</small>
            </div>
          </button>
        ))}
      </div>
    </Drawer>
  )
}
