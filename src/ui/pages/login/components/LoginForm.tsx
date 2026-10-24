import { Check } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { loginMockData } from '../mock-data'

export interface LoginFormProps {
  onLogin: () => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  return (
    <div className="panel" style={{ maxWidth: '420px', margin: '40px auto 0' }}>
      <h2 style={{ fontSize: '22px', color: 'var(--heading-text)', margin: '0 0 16px' }}>Sign in to Medora</h2>
      <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
        <label>
          Work Email
          <input defaultValue={loginMockData.defaultEmail} />
        </label>
        <label>
          Password
          <input type="password" defaultValue="••••••••••••" />
        </label>
      </div>
      <div style={{ marginTop: '24px' }}>
        <Button variant="primary" className="full-button" onClick={onLogin}>
          <Check data-icon="inline-start" /> Sign in
        </Button>
      </div>
    </div>
  )
}
