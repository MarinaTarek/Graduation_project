import { LogOut } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
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
  if (!isOpen) return null

  return (
    <Drawer title="Log out of Medora?" kicker="CONFIRMATION" onClose={onClose}>
      <p className="sheet-copy">{loginMockData.sessionNotice}</p>
      <div className="sheet-actions">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirmLogout}>
          <LogOut data-icon="inline-start" /> Log out
        </Button>
      </div>
    </Drawer>
  )
}
