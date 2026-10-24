import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useAuth } from '@/lib/auth'
import { FieldError } from '@/ui/design-system/components/FieldError'

export interface LoginFormProps {
  onLogin: () => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('admin@navigenpharma.net')
  const [password, setPassword] = useState('Admin123!')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      onLogin()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Wrong email or password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel" style={{ maxWidth: '420px', margin: '40px auto 0' }}>
      <h2 style={{ fontSize: '22px', color: 'var(--heading-text)', margin: '0 0 16px' }}>Sign in to Navigen</h2>
      <form onSubmit={handleSubmit} className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
        <label>
          Work Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </label>

        <FieldError message={error} />

        <div style={{ marginTop: '16px' }}>
          <Button variant="primary" className="full-button" type="submit" loading={loading}>
            <Check data-icon="inline-start" /> {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
      </form>

      {/* Demo accounts hint (easy to delete) */}
      <div
        style={{
          marginTop: '20px',
          padding: '12px',
          borderRadius: '12px',
          background: 'var(--input-bg)',
          fontSize: '11px',
          color: 'var(--muted-text)',
          textAlign: 'left',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: 'var(--heading-text)', display: 'block', marginBottom: '4px' }}>Demo accounts:</strong>
        <div>• <b>Admin:</b> admin@navigenpharma.net / Admin123! (Alex Morgan)</div>
        <div>• <b>Rep 1:</b> ahmed@navigenpharma.net / Rep123! (Ahmed Samir)</div>
        <div>• <b>Rep 2:</b> sara@navigenpharma.net / Rep123! (Sara Ali)</div>
      </div>
    </div>
  )
}
