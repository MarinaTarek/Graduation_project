import { Logo } from '@/ui/layout/Logo'
import { LoginForm } from './components/LoginForm'
import { LanguageSwitch } from '@/ui/design-system/components/LanguageSwitch'
import { useT } from '@/lib/i18n'

export interface LoginPageProps {
  onLogin?: () => void
}

export default function LoginPage({ onLogin = () => {} }: LoginPageProps) {
  const { t } = useT()

  return (
    <section className="content" style={{ textAlign: 'center', paddingTop: '80px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '24px', insetInlineEnd: '24px' }}>
        <LanguageSwitch />
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Logo showText size={64} textColor="var(--heading-text)" />
      </div>
      <p className="story" style={{ margin: '16px auto 0' }}>
        {t('login.subtitle')}
      </p>

      <LoginForm onLogin={onLogin} />
    </section>
  )
}
