import { Menu } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { MoreGrid } from './components/MoreGrid'

export interface MorePageProps {
  onSelectPage: (page: string) => void
  onAction: (actionText: string) => void
}

export default function MorePage({ onSelectPage, onAction }: MorePageProps) {
  const { t } = useT()
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Menu /> {t('more.eyebrow')}
          </span>
          <h1>{t('more.title')}</h1>
          <p className="story">{t('more.story')}</p>
        </div>
      </div>
      <MoreGrid onSelectPage={onSelectPage} onAction={onAction} />
    </section>
  )
}
