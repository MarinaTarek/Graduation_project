import { useState } from 'react'
import { ArrowUpRight, Plus } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Toast } from '@/ui/design-system/components/Toast'
import { useT } from '@/lib/i18n'
import { SellInMetrics } from './components/SellInMetrics'
import { SellInTable } from './components/SellInTable'
import { CreateSalesOrderDrawer } from './components/CreateSalesOrderDrawer'
import { SalesOrderDetailDrawer } from './components/SalesOrderDetailDrawer'

export default function SellInPage({
  onAction,
}: {
  onAction?: (message: string) => void
}) {
  const { t } = useT()
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  const notify = (message: string) => {
    onAction?.(message)
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <ArrowUpRight /> {t('sellIn.eyebrow')}
          </span>
          <h1>{t('sellIn.title')}</h1>
          <p className="story">{t('sellIn.story')}</p>
        </div>

        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus data-icon="inline-start" />
          {t('salesOrders.createTitle')}
        </Button>
      </div>

      <div style={{ marginTop: '36px' }}>
        <SellInMetrics />
        <SellInTable
          onSelect={setSelectedOrderId}
          onCreate={() => setCreateOpen(true)}
        />
      </div>

      {createOpen && (
        <CreateSalesOrderDrawer
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false)
            notify(t('salesOrders.createSuccess'))
          }}
        />
      )}

      {selectedOrderId && (
        <SalesOrderDetailDrawer
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onAction={notify}
        />
      )}

      {notice && !onAction && <Toast message={notice} />}
    </section>
  )
}
