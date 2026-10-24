import { Check } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'

export interface InvoiceReviewActionsProps {
  onReject: () => void
  onApprove: () => void
}

export function InvoiceReviewActions({
  onReject,
  onApprove,
}: InvoiceReviewActionsProps) {
  return (
    <div className="sheet-actions">
      <Button variant="secondary" onClick={onReject}>
        Reject
      </Button>
      <Button variant="primary" onClick={onApprove}>
        <Check data-icon="inline-start" /> Approve
      </Button>
    </div>
  )
}
