import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useAuth } from '@/lib/auth'

export interface LoginFormProps {
  onLogin: () => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('admin@medora.com')
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
      <h2 style={{ fontSize: '22px', color: 'var(--heading-text)', margin: '0 0 16px' }}>Sign in to Medora</h2>
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

        {error && (
          <div style={{ color: 'var(--rose-text)', fontSize: '13px', textAlign: 'left', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: '16px' }}>
          <Button variant="primary" className="full-button" type="submit" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
            {loading ? 'Signing in...' : 'Sign in'}
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
        <div>• <b>Admin:</b> admin@medora.com / Admin123! (Alex Morgan)</div>
        <div>• <b>Rep 1:</b> ahmed@medora.com / Rep123! (Ahmed Samir)</div>
        <div>• <b>Rep 2:</b> sara@medora.com / Rep123! (Sara Ali)</div>
      </div>
    </div>
  )
}
