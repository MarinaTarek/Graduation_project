import { ChevronRight } from 'lucide-react'
import { Drawer } from '@/ui/design-system/components/Drawer'
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
  if (!isOpen) return null

  return (
    <Drawer title="Notifications" kicker="YOUR INBOX" onClose={onClose}>
      <button
        className="text-button"
        onClick={() => onAction('All notifications marked as read')}
      >
        Mark all as read
      </button>
      <div className="notice-list">
        <span className="eyebrow">TODAY</span>
        {mockNotificationsList.map((item, i) => (
          <button key={item.id} onClick={() => onAction('Notification opened')}>
            <div className={`notice-dot ${item.dotClass || `n-${i % 3}`}`} />
            <div>
              <strong>{item.title}</strong>
              <small>{item.time}</small>
            </div>
            <ChevronRight />
          </button>
        ))}
        <span className="eyebrow">EARLIER</span>
        {earlierNotificationsList.map((item) => (
          <button key={item.id} onClick={() => onAction('Notification opened')}>
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
