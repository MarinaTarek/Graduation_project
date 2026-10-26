import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, Eye, EyeOff, ArrowLeft, Mail, ShieldCheck, KeyRound, Send } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useAuth } from '@/lib/auth'
import { FieldError } from '@/ui/design-system/components/FieldError'
import * as authService from '@/lib/auth/auth-service'
import { useT } from '@/lib/i18n'

export interface LoginFormProps {
  onLogin: () => void
}

type Screen =
  | 'login'
  | 'signup'
  | 'verify-email'
  | 'pending-approval'
  | 'forgot-password'
  | 'reset-code'
  | 'reset-success'
  | 'email-link'
  | 'email-link-sent'

// ─── Password strength ────────────────────────────────────
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[a-zA-Z]/.test(pw) && /[0-9]/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  if (pw.length >= 12) score++

  if (score <= 1) return { score, label: 'Weak', color: 'var(--rose, #d9798b)' }
  if (score === 2) return { score, label: 'Fair', color: 'var(--amber-text, #d4a24c)' }
  if (score === 3) return { score, label: 'Good', color: 'var(--ocean, #3f6593)' }
  return { score, label: 'Strong', color: 'var(--story-em, #3e9a78)' }
}

function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null
  const { score, label, color } = getPasswordStrength(password)
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: i <= score ? color : 'var(--border-subtle)',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '11px', color }}>{label}</span>
    </div>
  )
}

// ─── Countdown hook ───────────────────────────────────────
function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(0)
  const start = useCallback(() => setRemaining(seconds), [seconds])

  useEffect(() => {
    if (remaining <= 0) return
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining])

  return { remaining, isActive: remaining > 0, start }
}

// ─── Password input with toggle ──────────────────────────
function PasswordInput({
  value,
  onChange,
  disabled,
  placeholder,
  id,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  placeholder?: string
  id?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        required
        style={{ paddingRight: '40px' }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(!show)}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--muted-text)',
          padding: '4px',
          display: 'flex',
        }}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

// ─── Segmented Tabs ──────────────────────────────────────
function SegmentedTabs({ active, onChange }: { active: 'login' | 'signup'; onChange: (v: 'login' | 'signup') => void }) {
  const { t } = useT()
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--input-bg)',
        borderRadius: '12px',
        padding: '4px',
        marginBottom: '20px',
      }}
    >
      {(['login', 'signup'] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: active === tab ? 'var(--card-bg, #fff)' : 'transparent',
            color: active === tab ? 'var(--heading-text)' : 'var(--muted-text)',
            boxShadow: active === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          {tab === 'login' ? t('login.loginTab') : t('login.createAccountTab')}
        </button>
      ))}
    </div>
  )
}

// ─── Back Link ────────────────────────────────────────────
function BackLink({ onClick, label }: { onClick: () => void; label?: string }) {
  const { t } = useT()
  const displayLabel = label || t('common.back')
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'none',
        border: 'none',
        color: 'var(--ocean, #3f6593)',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        padding: 0,
        marginBottom: '16px',
      }}
    >
      <ArrowLeft size={14} />
      {label}
    </button>
  )
}

// ─── Main Component ──────────────────────────────────────
export function LoginForm({ onLogin }: LoginFormProps) {
  const { signIn } = useAuth()
  const [screen, setScreen] = useState<Screen>('login')

  // Login state
  const [email, setEmail] = useState('admin@navigenpharma.net')
  const [password, setPassword] = useState('Admin123!')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPw, _setShowPw] = useState(false)
  const [failCount, setFailCount] = useState(0)
  const lockout = useCountdown(30)

  // Signup state
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [signupAgree, setSignupAgree] = useState(false)
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({})
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState<string | null>(null)

  // Verify state
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const resendCountdown = useCountdown(30)

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)

  // Reset password state
  const [resetCode, setResetCode] = useState('')
  const [resetNewPw, setResetNewPw] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  // Email link state
  const [linkEmail, setLinkEmail] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  const firstInvalidRef = useRef<HTMLInputElement>(null)

  // ─── Handlers ────────────────────────────────────────────
  const errorMessage = (code: string): string => {
    switch (code) {
      case 'VERIFY_EMAIL':
        return 'VERIFY_EMAIL'
      case 'PENDING_APPROVAL':
        return 'Your account is waiting for admin approval.'
      case 'REJECTED':
        return 'Your request was rejected. Contact your admin.'
      case 'DISABLED':
        return 'Account disabled. Contact your admin.'
      default:
        return code
    }
  }

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (lockout.isActive) return
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      setFailCount(0)
      onLogin()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Wrong email or password'
      if (msg === 'VERIFY_EMAIL') {
        setVerifyEmail(email)
        setScreen('verify-email')
      } else {
        const displayMsg = errorMessage(msg)
        setError(displayMsg)
        const newCount = failCount + 1
        setFailCount(newCount)
        if (newCount >= 5) {
          lockout.start()
          setFailCount(0)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const validateSignup = (): Record<string, string> => {
    const errs: Record<string, string> = {}
    if (!signupName.trim()) errs.name = 'Full name is required'
    if (!signupEmail.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) errs.email = 'Invalid email format'
    if (!signupPassword) errs.password = 'Password is required'
    else if (signupPassword.length < 8) errs.password = 'Minimum 8 characters'
    else if (!/[a-zA-Z]/.test(signupPassword) || !/[0-9]/.test(signupPassword))
      errs.password = 'Must contain a letter and a number'
    if (signupPassword !== signupConfirm) errs.confirm = 'Passwords do not match'
    if (!signupAgree) errs.agree = 'You must agree to the terms'
    return errs
  }

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const errs = validateSignup()
    setSignupErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSignupLoading(true)
    setSignupError(null)
    try {
      const user = await authService.signUp({
        name: signupName,
        email: signupEmail,
        phone: signupPhone || undefined,
        password: signupPassword,
      })
      setVerifyEmail(user.email)
      setScreen('verify-email')
    } catch (err: unknown) {
      setSignupError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setSignupLoading(false)
    }
  }

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setVerifyLoading(true)
    setVerifyError(null)
    try {
      await authService.verifyEmail(verifyEmail, verifyCode)
      setScreen('pending-approval')
    } catch (err: unknown) {
      setVerifyError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleResend = async () => {
    resendCountdown.start()
    try {
      await authService.resendCode(verifyEmail)
    } catch {
      // ignore in mock
    }
  }

  const handleForgotSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setForgotLoading(true)
    setForgotError(null)
    try {
      await authService.requestPasswordReset(forgotEmail)
      setScreen('reset-code')
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (resetNewPw.length < 8 || !/[a-zA-Z]/.test(resetNewPw) || !/[0-9]/.test(resetNewPw)) {
      setResetError('Password must be 8+ chars with a letter and number')
      return
    }
    if (resetNewPw !== resetConfirm) {
      setResetError('Passwords do not match')
      return
    }
    setResetLoading(true)
    setResetError(null)
    try {
      await authService.resetPassword(forgotEmail, resetCode, resetNewPw)
      setScreen('reset-success')
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setResetLoading(false)
    }
  }

  const handleEmailLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLinkLoading(true)
    setLinkError(null)
    try {
      // Just check account exists
      await authService.requestPasswordReset(linkEmail) // reuse to check existence
      setScreen('email-link-sent')
    } catch (err: unknown) {
      setLinkError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLinkLoading(false)
    }
  }

  const handleSimulateLink = async () => {
    setLinkLoading(true)
    setLinkError(null)
    try {
      await authService.signInWithEmailLink(linkEmail)
      const { signIn: ctxSignIn } = { signIn }
      // sign in through context too
      // Actually we need to go through the auth provider properly
      // The signInWithEmailLink already saves session, we need to reload
      window.location.reload()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed'
      setLinkError(errorMessage(msg))
    } finally {
      setLinkLoading(false)
    }
  }

  const goToLogin = () => {
    setScreen('login')
    setError(null)
    setVerifyError(null)
    setForgotError(null)
    setResetError(null)
    setLinkError(null)
  }

  // ─── Shared styles ──────────────────────────────────────
  const fieldErrorStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'var(--rose, #d9798b)',
    marginTop: '4px',
  }

  // ─── Screens ────────────────────────────────────────────

  // LOGIN + SIGNUP SCREENS — the signup form is wider so its fields can sit
  // in a balanced two-column grid on desktop (single column on mobile).
  if (screen === 'login' || screen === 'signup') {
    return (
      <div className="panel" style={{ maxWidth: screen === 'signup' ? '600px' : '420px', margin: '40px auto 0' }}>
        <SegmentedTabs active={screen} onChange={(v) => { setScreen(v); setError(null); setSignupError(null) }} />

        {screen === 'login' ? (
          <>
            <h2 style={{ fontSize: '22px', color: 'var(--heading-text)', margin: '0 0 16px' }}>
              Sign in to Navigen
            </h2>
            <form onSubmit={handleLogin} className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <label>
                Work Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || lockout.isActive}
                  required
                />
              </label>
              <label>
                Password
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  disabled={loading || lockout.isActive}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--ocean)' }}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => { setForgotEmail(email); setForgotError(null); setScreen('forgot-password') }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ocean, #3f6593)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div style={{ ...fieldErrorStyle, fontSize: '13px', padding: '8px 12px', borderRadius: '8px', background: 'var(--rose-bg, rgba(217,121,139,0.1))' }}>
                  {error}
                </div>
              )}

              {lockout.isActive && (
                <div style={{ fontSize: '13px', color: 'var(--rose, #d9798b)', textAlign: 'center' }}>
                  Too many attempts. Try again in {lockout.remaining}s
                </div>
              )}

              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Button variant="primary" className="full-button" type="submit" loading={loading} disabled={lockout.isActive}>
                  <Check data-icon="inline-start" /> {loading ? 'Signing in...' : 'Sign in'}
                </Button>
                <Button
                  variant="text"
                  className="full-button"
                  type="button"
                  onClick={() => { setLinkEmail(email); setLinkError(null); setScreen('email-link') }}
                >
                  <Mail data-icon="inline-start" size={16} /> Email me a sign-in link
                </Button>
              </div>
            </form>

            {/* Demo accounts hint */}
            <div
              style={{
                marginTop: '20px',
                padding: '12px',
                borderRadius: '12px',
                background: 'var(--input-bg)',
                fontSize: '11px',
                color: 'var(--muted-text)',
                textAlign: 'start',
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: 'var(--heading-text)', display: 'block', marginBottom: '4px' }}>Demo accounts:</strong>
              <div>• <b>Admin:</b> admin@navigenpharma.net / Admin123! (Alex Morgan)</div>
              <div>• <b>Rep 1:</b> ahmed@navigenpharma.net / Rep123! (Ahmed Samir)</div>
              <div>• <b>Rep 2:</b> sara@navigenpharma.net / Rep123! (Sara Ali)</div>
            </div>
          </>
        ) : (
          /* SIGNUP SCREEN */
          <>
            <h2 style={{ fontSize: '22px', color: 'var(--heading-text)', margin: '0 0 16px' }}>
              Create your account
            </h2>
            <form
              onSubmit={handleSignup}
              className="form-grid signup-grid"
              noValidate
            >
              <label>
                Full Name *
                <input
                  ref={signupErrors.name ? firstInvalidRef : undefined}
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  onBlur={() => {
                    if (!signupName.trim()) setSignupErrors((p) => ({ ...p, name: 'Full name is required' }))
                    else setSignupErrors((p) => { const { name, ...rest } = p; return rest })
                  }}
                  disabled={signupLoading}
                  placeholder="e.g. Mohamed Khalil"
                />
                {signupErrors.name && <span style={fieldErrorStyle}>{signupErrors.name}</span>}
              </label>

              <label>
                Work Email *
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  onBlur={() => {
                    if (!signupEmail.trim()) setSignupErrors((p) => ({ ...p, email: 'Email is required' }))
                    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) setSignupErrors((p) => ({ ...p, email: 'Invalid email format' }))
                    else setSignupErrors((p) => { const { email, ...rest } = p; return rest })
                  }}
                  disabled={signupLoading}
                  placeholder="name@company.com"
                />
                {signupErrors.email && <span style={fieldErrorStyle}>{signupErrors.email}</span>}
              </label>

              <label className="full">
                Phone <span style={{ color: 'var(--muted-text)', fontWeight: 400 }}>(optional)</span>
                <input
                  type="tel"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  disabled={signupLoading}
                  placeholder="+20 1xx xxx xxxx"
                />
              </label>

              <label>
                Password *
                <PasswordInput
                  value={signupPassword}
                  onChange={(v) => {
                    setSignupPassword(v)
                    if (signupErrors.password) setSignupErrors((p) => { const { password, ...rest } = p; return rest })
                  }}
                  disabled={signupLoading}
                />
                <PasswordStrengthMeter password={signupPassword} />
                {signupErrors.password && <span style={fieldErrorStyle}>{signupErrors.password}</span>}
              </label>

              <label>
                Confirm Password *
                <PasswordInput
                  value={signupConfirm}
                  onChange={(v) => {
                    setSignupConfirm(v)
                    if (signupErrors.confirm) setSignupErrors((p) => { const { confirm, ...rest } = p; return rest })
                  }}
                  disabled={signupLoading}
                />
                {signupErrors.confirm && <span style={fieldErrorStyle}>{signupErrors.confirm}</span>}
              </label>

              <label className="full" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px', flexDirection: 'row' }}>
                <input
                  type="checkbox"
                  checked={signupAgree}
                  onChange={(e) => {
                    setSignupAgree(e.target.checked)
                    if (signupErrors.agree) setSignupErrors((p) => { const { agree, ...rest } = p; return rest })
                  }}
                  style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: 'var(--ocean)' }}
                />
                <span>I agree to the terms and conditions</span>
              </label>
              {signupErrors.agree && <span style={fieldErrorStyle} className="full">{signupErrors.agree}</span>}

              {signupError && <FieldError message={signupError} />}

              <div className="full" style={{ marginTop: '8px' }}>
                <Button variant="primary" className="full-button" type="submit" loading={signupLoading}>
                  Create account
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    )
  }

  // VERIFY EMAIL SCREEN
  if (screen === 'verify-email') {
    return (
      <div className="panel" style={{ maxWidth: '420px', margin: '40px auto 0' }}>
        <BackLink onClick={goToLogin} />
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--ocean-bg, rgba(63,101,147,0.1))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <Mail size={24} style={{ color: 'var(--ocean, #3f6593)' }} />
          </div>
          <h2 style={{ fontSize: '20px', color: 'var(--heading-text)', margin: '0 0 8px' }}>Verify your email</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted-text)', margin: 0 }}>
            We sent a 6-digit code to <strong style={{ color: 'var(--heading-text)' }}>{verifyEmail}</strong>
          </p>
          <p style={{ fontSize: '11px', color: 'var(--muted-text)', margin: '4px 0 0' }}>
            (Mock code: <code style={{ background: 'var(--input-bg)', padding: '2px 6px', borderRadius: '4px' }}>123456</code>)
          </p>
        </div>
        <form onSubmit={handleVerify} className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <label>
            Verification Code
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={verifyLoading}
              placeholder="000000"
              maxLength={6}
              style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '20px', fontWeight: 600 }}
            />
          </label>

          {verifyError && <FieldError message={verifyError} />}

          <Button variant="primary" className="full-button" type="submit" loading={verifyLoading} disabled={verifyCode.length !== 6}>
            <ShieldCheck data-icon="inline-start" size={16} /> Verify
          </Button>

          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted-text)' }}>
            Didn&apos;t receive a code?{' '}
            {resendCountdown.isActive ? (
              <span>Resend in {resendCountdown.remaining}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ocean)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  padding: 0,
                }}
              >
                Resend code
              </button>
            )}
          </div>
        </form>
      </div>
    )
  }

  // PENDING APPROVAL SCREEN
  if (screen === 'pending-approval') {
    return (
      <div className="panel" style={{ maxWidth: '420px', margin: '40px auto 0', textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--story-em-bg, rgba(62,154,120,0.1))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
          }}
        >
          <ShieldCheck size={24} style={{ color: 'var(--story-em, #3e9a78)' }} />
        </div>
        <h2 style={{ fontSize: '20px', color: 'var(--heading-text)', margin: '0 0 8px' }}>Request sent</h2>
        <p style={{ fontSize: '14px', color: 'var(--secondary-text)', margin: '0 0 24px', lineHeight: 1.5 }}>
          An admin will review your account and you will get access after approval.
        </p>
        <Button variant="primary" className="full-button" onClick={goToLogin}>
          Back to Log in
        </Button>
      </div>
    )
  }

  // FORGOT PASSWORD SCREEN
  if (screen === 'forgot-password') {
    return (
      <div className="panel" style={{ maxWidth: '420px', margin: '40px auto 0' }}>
        <BackLink onClick={goToLogin} />
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--ocean-bg, rgba(63,101,147,0.1))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <KeyRound size={24} style={{ color: 'var(--ocean, #3f6593)' }} />
          </div>
          <h2 style={{ fontSize: '20px', color: 'var(--heading-text)', margin: '0 0 8px' }}>Reset your password</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted-text)', margin: 0 }}>
            Enter your email and we&apos;ll send a reset code.
          </p>
        </div>
        <form onSubmit={handleForgotSubmit} className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <label>
            Email
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              disabled={forgotLoading}
              required
            />
          </label>

          {forgotError && <FieldError message={forgotError} />}

          <Button variant="primary" className="full-button" type="submit" loading={forgotLoading}>
            <Send data-icon="inline-start" size={16} /> Send reset code
          </Button>
        </form>
      </div>
    )
  }

  // RESET CODE SCREEN
  if (screen === 'reset-code') {
    return (
      <div className="panel" style={{ maxWidth: '420px', margin: '40px auto 0' }}>
        <BackLink onClick={() => setScreen('forgot-password')} />
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--heading-text)', margin: '0 0 8px' }}>Enter reset code</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted-text)', margin: 0 }}>
            Code sent to <strong style={{ color: 'var(--heading-text)' }}>{forgotEmail}</strong>
          </p>
          <p style={{ fontSize: '11px', color: 'var(--muted-text)', margin: '4px 0 0' }}>
            (Mock code: <code style={{ background: 'var(--input-bg)', padding: '2px 6px', borderRadius: '4px' }}>123456</code>)
          </p>
        </div>
        <form onSubmit={handleResetSubmit} className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <label>
            Reset Code
            <input
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={resetLoading}
              placeholder="000000"
              maxLength={6}
              style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '20px', fontWeight: 600 }}
            />
          </label>
          <label>
            New Password
            <PasswordInput value={resetNewPw} onChange={setResetNewPw} disabled={resetLoading} />
            <PasswordStrengthMeter password={resetNewPw} />
          </label>
          <label>
            Confirm Password
            <PasswordInput value={resetConfirm} onChange={setResetConfirm} disabled={resetLoading} />
          </label>

          {resetError && <FieldError message={resetError} />}

          <Button variant="primary" className="full-button" type="submit" loading={resetLoading} disabled={resetCode.length !== 6}>
            Reset password
          </Button>
        </form>
      </div>
    )
  }

  // RESET SUCCESS SCREEN
  if (screen === 'reset-success') {
    return (
      <div className="panel" style={{ maxWidth: '420px', margin: '40px auto 0', textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--story-em-bg, rgba(62,154,120,0.1))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
          }}
        >
          <Check size={24} style={{ color: 'var(--story-em, #3e9a78)' }} />
        </div>
        <h2 style={{ fontSize: '20px', color: 'var(--heading-text)', margin: '0 0 8px' }}>Password reset</h2>
        <p style={{ fontSize: '14px', color: 'var(--secondary-text)', margin: '0 0 24px' }}>
          Your password has been updated. You can now sign in.
        </p>
        <Button variant="primary" className="full-button" onClick={goToLogin}>
          Back to Log in
        </Button>
      </div>
    )
  }

  // EMAIL LINK SCREEN
  if (screen === 'email-link') {
    return (
      <div className="panel" style={{ maxWidth: '420px', margin: '40px auto 0' }}>
        <BackLink onClick={goToLogin} />
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--ocean-bg, rgba(63,101,147,0.1))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <Mail size={24} style={{ color: 'var(--ocean, #3f6593)' }} />
          </div>
          <h2 style={{ fontSize: '20px', color: 'var(--heading-text)', margin: '0 0 8px' }}>Sign in with email link</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted-text)', margin: 0 }}>
            We&apos;ll send a magic link to your email.
          </p>
        </div>
        <form onSubmit={handleEmailLink} className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <label>
            Email
            <input
              type="email"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              disabled={linkLoading}
              required
            />
          </label>

          {linkError && <FieldError message={linkError} />}

          <Button variant="primary" className="full-button" type="submit" loading={linkLoading}>
            <Send data-icon="inline-start" size={16} /> Send link
          </Button>
        </form>
      </div>
    )
  }

  // EMAIL LINK SENT SCREEN
  if (screen === 'email-link-sent') {
    return (
      <div className="panel" style={{ maxWidth: '420px', margin: '40px auto 0', textAlign: 'center' }}>
        <BackLink onClick={() => setScreen('email-link')} />
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--story-em-bg, rgba(62,154,120,0.1))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
          }}
        >
          <Mail size={24} style={{ color: 'var(--story-em, #3e9a78)' }} />
        </div>
        <h2 style={{ fontSize: '20px', color: 'var(--heading-text)', margin: '0 0 8px' }}>Check your email</h2>
        <p style={{ fontSize: '14px', color: 'var(--secondary-text)', margin: '0 0 24px' }}>
          We sent a sign-in link to <strong>{linkEmail}</strong>
        </p>

        {linkError && (
          <div style={{ ...fieldErrorStyle, fontSize: '13px', padding: '8px 12px', borderRadius: '8px', background: 'var(--rose-bg, rgba(217,121,139,0.1))', marginBottom: '12px' }}>
            {linkError}
          </div>
        )}

        {/* Dev-only simulate button */}
        <div
          style={{
            padding: '12px',
            borderRadius: '12px',
            background: 'var(--input-bg)',
            fontSize: '12px',
            color: 'var(--muted-text)',
            marginBottom: '16px',
          }}
        >
          <div style={{ marginBottom: '8px' }}>🛠 Dev mode</div>
          <Button
            variant="text"
            className="full-button"
            onClick={handleSimulateLink}
            loading={linkLoading}
          >
            Simulate clicking the link
          </Button>
        </div>

        <Button variant="text" className="full-button" onClick={goToLogin}>
          Back to Log in
        </Button>
      </div>
    )
  }

  return null
}
