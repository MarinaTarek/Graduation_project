import { useState } from 'react'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { InvoiceDetailCard } from './components/InvoiceDetailCard'
import { InvoiceReviewActions } from './components/InvoiceReviewActions'
import { invoiceReviewMockData } from './mock-data'
import { useUndo } from '@/lib/useUndo'
import { addStockMovement, stockMovementsStore } from '@/data/mock/stockDerived'
import { useT } from '@/lib/i18n'

export interface InvoiceReviewPageProps {
  onClose: () => void
  onAction: (msg: string, onUndo?: () => void) => void
}

export default function InvoiceReviewPage({
  onClose,
  onAction,
}: InvoiceReviewPageProps) {
  const { t } = useT()
  const data = invoiceReviewMockData
  const [loadingAction, setLoadingAction] = useState<'approve' | 'reject' | null>(null)
  const { trigger } = useUndo(8000)

  const handleReject = () => {
    if (!window.confirm(t('invoiceReview.confirmReject', { id: data.id }))) {
      return
    }
    setLoadingAction('reject')
    setTimeout(() => {
      setLoadingAction(null)
      onClose()
      trigger(
        t('invoiceReview.rejectedToast', { id: data.id }),
        () => onAction(t('invoiceReview.rejectionFinalized', { id: data.id })),
        () => onAction(t('invoiceReview.rejectionUndone', { id: data.id }))
      )
      onAction(t('invoiceReview.rejectedWithUndo', { id: data.id }), () => onAction(t('invoiceReview.restored', { id: data.id })))
    }, 400)
  }

  const handleApprove = () => {
    setLoadingAction('approve')
    setTimeout(() => {
      setLoadingAction(null)

      // Create sell_in movement from approved invoice
      const movement = addStockMovement({
        productName: 'Bevato',
        quantity: 20,
        type: 'sell_in',
        date: new Date().toISOString().split('T')[0],
        customerName: data.client,
        notes: t('invoiceReview.approvedNotes', { id: data.id }),
      })

      onClose()
      trigger(
        t('invoiceReview.approvedToast', { id: data.id }),
        () => onAction(t('invoiceReview.approvalFinalized', { id: data.id })),
        () => {
          stockMovementsStore.update((list) => list.filter((m) => m.id !== movement.id))
          onAction(t('invoiceReview.approvalUndone', { id: data.id }))
        }
      )
      onAction(t('invoiceReview.approvedWithUndo', { id: data.id }), () => {
        stockMovementsStore.update((list) => list.filter((m) => m.id !== movement.id))
        onAction(t('invoiceReview.revertedToPending', { id: data.id }))
      })
    }, 400)
  }

  return (
    <Drawer title={data.id} kicker={data.kicker} onClose={onClose}>
      <InvoiceDetailCard
        client={data.client}
        amount={data.amount}
        meta={data.meta}
      />
      <InvoiceReviewActions
        onReject={handleReject}
        onApprove={handleApprove}
        loadingAction={loadingAction}
      />
    </Drawer>
  )
}
