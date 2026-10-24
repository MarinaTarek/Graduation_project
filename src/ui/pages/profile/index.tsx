import { useState } from 'react'
import { Moon, Send, Sun, User } from 'lucide-react'
import { Avatar } from '@/ui/design-system/components/Avatar'
import { Button } from '@/ui/design-system/components/Button'
import { StatusPill } from '@/ui/design-system/components/StatusPill'

export interface ProfilePageProps {
  userName?: string
  userEmail?: string
  dark: boolean
  onToggleDark: () => void
  onAction: (msg: string) => void
}

export default function ProfilePage({
  userName = 'User',
  userEmail = '',
  dark,
  onToggleDark,
  onAction,
}: ProfilePageProps) {
  const [telegramLinked, setTelegramLinked] = useState(false)

  const handleLinkTelegram = () => {
    setTelegramLinked(!telegramLinked)
    onAction(
      !telegramLinked
        ? 'Telegram notifications linked successfully'
        : 'Telegram notifications unlinked'
    )
  }

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <User /> FIELD REPRESENTATIVE
          </span>
          <h1>My profile</h1>
          <p className="story">
            Personal preferences, real-time dispatch alerts, and workspace credentials.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '36px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
        {/* User Identity Card */}
        <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Avatar initials="AM" size="lg" />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '20px', color: 'var(--heading-text)', margin: '0 0 4px' }}>
              {userName}
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--muted-text)', display: 'block' }}>
              {userEmail}
            </span>
            <div style={{ marginTop: '8px' }}>
              <StatusPill status="Healthy" />
            </div>
          </div>
        </div>

        {/* Link Telegram Card */}
        <div className="panel">
          <div style={{ display: 'flex', gap: '16px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--blue-tint)',
                color: 'var(--ocean)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Send style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', color: 'var(--heading-text)', margin: '0 0 6px' }}>
                Telegram Notifications
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--muted-text)', margin: '0 0 12px', lineHeight: 1.5 }}>
                Receive instant dispatch alerts, doctor visit reminders, and urgent batch expiry notifications on Telegram.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>Status:</span>
                <StatusPill status={telegramLinked ? 'Healthy' : 'Pending'} />
                <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
                  {telegramLinked ? `(@${userName.toLowerCase().replace(/\s+/g, '_')}_medora linked)` : '(Not connected)'}
                </span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant={telegramLinked ? 'secondary' : 'primary'}
              onClick={handleLinkTelegram}
            >
              <Send data-icon="inline-start" />
              {telegramLinked ? 'Unlink Telegram' : 'Link Telegram'}
            </Button>
          </div>
        </div>

        {/* Dark Mode Toggle Card */}
        <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', color: 'var(--heading-text)', margin: '0 0 4px' }}>
              Interface Theme
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--muted-text)' }}>
              Currently using {dark ? 'Dark mode' : 'Light mode'}
            </span>
          </div>
          <Button variant="secondary" onClick={onToggleDark}>
            {dark ? <Sun data-icon="inline-start" /> : <Moon data-icon="inline-start" />}
            Switch to {dark ? 'Light' : 'Dark'} mode
          </Button>
        </div>
      </div>
    </section>
  )
}
