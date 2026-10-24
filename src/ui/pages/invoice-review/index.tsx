import { useState } from 'react'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { InvoiceDetailCard } from './components/InvoiceDetailCard'
import { InvoiceReviewActions } from './components/InvoiceReviewActions'
import { invoiceReviewMockData } from './mock-data'
import { useUndo } from '@/lib/useUndo'

export interface InvoiceReviewPageProps {
  onClose: () => void
  onAction: (msg: string, onUndo?: () => void) => void
}

export default function InvoiceReviewPage({
  onClose,
  onAction,
}: InvoiceReviewPageProps) {
  const data = invoiceReviewMockData
  const [loadingAction, setLoadingAction] = useState<'approve' | 'reject' | null>(null)
  const { trigger } = useUndo(8000)

  const handleReject = () => {
    if (!window.confirm(`Are you sure you want to reject ${data.id}?`)) {
      return
    }
    setLoadingAction('reject')
    setTimeout(() => {
      setLoadingAction(null)
      onClose()
      trigger(
        `Invoice ${data.id} rejected`,
        () => onAction(`Invoice ${data.id} rejection finalized`),
        () => onAction(`Invoice ${data.id} rejection undone`)
      )
      onAction(`Invoice ${data.id} rejected (Click Undo within 8s)`, () => onAction(`Invoice ${data.id} restored`))
    }, 400)
  }

  const handleApprove = () => {
    setLoadingAction('approve')
    setTimeout(() => {
      setLoadingAction(null)
      onClose()
      trigger(
        `Invoice ${data.id} approved`,
        () => onAction(`Invoice ${data.id} approval finalized`),
        () => onAction(`Invoice ${data.id} approval undone`)
      )
      onAction(`Invoice ${data.id} approved (Click Undo within 8s)`, () => onAction(`Invoice ${data.id} reverted to pending`))
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
