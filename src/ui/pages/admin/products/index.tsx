import { Package } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { useT } from '@/lib/i18n'
import { CatalogTable } from './components/CatalogTable'

export default function AdminProductsPage() {
  const { t } = useT()
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Package /> {t('admin.catalog.eyebrow')}
          </span>
          <h1>{t('admin.catalog.title')}</h1>
          <p className="story">{t('admin.catalog.story')}</p>
        </div>
      </div>
      <div style={{ marginTop: '36px' }}>
        <CatalogTable />
      </div>
      <EmptyState message={t('admin.catalog.emptyState')} />
    </section>
  )
}
