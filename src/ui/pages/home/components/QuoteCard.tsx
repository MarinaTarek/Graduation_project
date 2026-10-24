import { Activity } from 'lucide-react'
import { useT } from '@/lib/i18n'

export function QuoteCard() {
  const { t } = useT()

  return (
    <section className="quote-card">
      <div className="quote-mark">“</div>
      <div>
        <p>{t('home.quote.text')}</p>
        <span>{t('home.quote.attribution')}</span>
      </div>
      <Activity />
    </section>
  )
}
