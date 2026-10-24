import { ChevronRight } from 'lucide-react'
import { Drawer } from '@/ui/design-system/components/Drawer'

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

  const todayNotices = [
    'Invoice approval requested',
    'Bevato is low in North warehouse',
    'Batch CW-2401 expires in 12 days',
  ]

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
        {todayNotices.map((x, i) => (
          <button key={x} onClick={() => onAction('Notification opened')}>
            <div className={`notice-dot n-${i}`} />
            <div>
              <strong>{x}</strong>
              <small>{i + 1} hour ago</small>
            </div>
            <ChevronRight />
          </button>
        ))}
        <span className="eyebrow">EARLIER</span>
        <button onClick={() => onAction('Notification opened')}>
          <div className="notice-dot n-2" />
          <div>
            <strong>Invoice INV-1042 was rejected</strong>
            <small>Yesterday</small>
          </div>
        </button>
      </div>
    </Drawer>
  )
}
