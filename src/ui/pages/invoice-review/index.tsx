import { Drawer } from '@/ui/design-system/components/Drawer'
import { InvoiceDetailCard } from './components/InvoiceDetailCard'
import { InvoiceReviewActions } from './components/InvoiceReviewActions'
import { invoiceReviewMockData } from './mock-data'

export interface InvoiceReviewPageProps {
  onClose: () => void
  onAction: (msg: string) => void
}

export default function InvoiceReviewPage({
  onClose,
  onAction,
}: InvoiceReviewPageProps) {
  const data = invoiceReviewMockData

  const handleReject = () => {
    onAction('Invoice rejected')
  }

  const handleApprove = () => {
    onClose()
    onAction('Invoice approved')
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
      />
    </Drawer>
  )
}
