import { Logo } from '@/ui/layout/Logo'
import { LoginForm } from './components/LoginForm'
import { loginMockData } from './mock-data'

export interface LoginPageProps {
  onLogin?: () => void
}

export default function LoginPage({ onLogin = () => {} }: LoginPageProps) {
  return (
    <section className="content" style={{ textAlign: 'center', paddingTop: '80px' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
        <Logo />
        <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-.06em', color: 'var(--heading-text)' }}>
          {loginMockData.appTitle}
        </span>
      </div>
      <p className="story" style={{ margin: '16px auto 0' }}>
        {loginMockData.appSubtitle}
      </p>

      <LoginForm onLogin={onLogin} />
    </section>
  )
}
