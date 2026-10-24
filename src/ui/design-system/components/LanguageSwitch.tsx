import { useT } from '@/lib/i18n'

export interface LanguageSwitchProps {
  className?: string
  style?: React.CSSProperties
}

export function LanguageSwitch({ className = '', style }: LanguageSwitchProps) {
  const { lang, setLang } = useT()

  return (
    <div
      className={`home-range-segmented ${className}`}
      role="group"
      aria-label="Language switch"
      style={{
        height: '40px',
        minHeight: '40px',
        margin: 0,
        direction: 'ltr',
        ...style,
      }}
    >
      <button
        type="button"
        className={lang === 'en' ? 'active' : ''}
        onClick={() => setLang('en')}
        style={{
          height: '34px',
          padding: '0 12px',
          fontSize: '12px',
          fontWeight: lang === 'en' ? 700 : 500,
        }}
      >
        EN
      </button>
      <button
        type="button"
        className={lang === 'ar' ? 'active' : ''}
        onClick={() => setLang('ar')}
        style={{
          height: '34px',
          padding: '0 12px',
          fontSize: '12px',
          fontWeight: lang === 'ar' ? 700 : 500,
          fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif",
        }}
      >
        عربي
      </button>
    </div>
  )
}
