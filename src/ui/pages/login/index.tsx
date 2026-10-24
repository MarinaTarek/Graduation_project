import { Logo } from '@/ui/layout/Logo'
import { LoginForm } from './components/LoginForm'
import { loginMockData } from './mock-data'

export interface LoginPageProps {
  onLogin?: () => void
}

export default function LoginPage({ onLogin = () => {} }: LoginPageProps) {
  return (
    <section className="content" style={{ textAlign: 'center', paddingTop: '80px' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Logo showText size={64} textColor="var(--heading-text)" />
      </div>
      <p className="story" style={{ margin: '16px auto 0' }}>
        {loginMockData.appSubtitle}
      </p>

      <LoginForm onLogin={onLogin} />
    </section>
  )
}
