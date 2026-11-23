import { useState } from 'react'
import { MapPin, Plus } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Toast } from '@/ui/design-system/components/Toast'
import { useT } from '@/lib/i18n'
import { TerritoryGrid } from './components/TerritoryGrid'
import { TerritoryFormDrawer } from './components/TerritoryFormDrawer'
import { type TerritoryRecord } from './mock-data'

export default function AdminTerritoriesPage() {
  const { t, lang } = useT()
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryRecord | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    window.setTimeout(() => setToastMessage(null), 3500)
  }

  const handleOpenAdd = () => {
    setSelectedTerritory(null)
    setIsDrawerOpen(true)
  }

  const handleOpenEdit = (terr: TerritoryRecord) => {
    setSelectedTerritory(terr)
    setIsDrawerOpen(true)
  }

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <MapPin /> {t('admin.territories.eyebrow')}
          </span>
          <h1>{t('admin.territories.title')}</h1>
          <p className="story">{t('admin.territories.story')}</p>
        </div>

        <Button variant="primary" onClick={handleOpenAdd}>
          <Plus data-icon="inline-start" /> {lang === 'ar' ? 'إضافة منطقة' : 'Add Territory'}
        </Button>
      </div>

      <div style={{ marginTop: '36px' }}>
        <TerritoryGrid onEditTerritory={handleOpenEdit} />
      </div>

      <TerritoryFormDrawer
        territory={selectedTerritory}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          setSelectedTerritory(null)
        }}
        onSave={(msg) => {
          showToast(msg)
        }}
      />

      {toastMessage && <Toast message={toastMessage} />}
    </section>
  )
}
