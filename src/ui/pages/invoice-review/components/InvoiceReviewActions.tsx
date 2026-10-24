import { Check } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'

export interface InvoiceReviewActionsProps {
  onReject: () => void
  onApprove: () => void
  loadingAction?: 'approve' | 'reject' | null
}

export function InvoiceReviewActions({
  onReject,
  onApprove,
  loadingAction,
}: InvoiceReviewActionsProps) {
  return (
    <div className="sheet-actions">
      <Button
        variant="secondary"
        onClick={onReject}
        loading={loadingAction === 'reject'}
        disabled={Boolean(loadingAction)}
      >
        Reject
      </Button>
      <Button
        variant="primary"
        onClick={onApprove}
        loading={loadingAction === 'approve'}
        disabled={Boolean(loadingAction)}
      >
        <Check data-icon="inline-start" /> Approve
      </Button>
    </div>
  )
}
