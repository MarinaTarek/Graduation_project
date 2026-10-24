import { Check } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useT } from '@/lib/i18n'

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
  const { t } = useT()
  return (
    <div className="sheet-actions">
      <Button
        variant="secondary"
        onClick={onReject}
        loading={loadingAction === 'reject'}
        disabled={Boolean(loadingAction)}
      >
        {t('common.reject')}
      </Button>
      <Button
        variant="primary"
        onClick={onApprove}
        loading={loadingAction === 'approve'}
        disabled={Boolean(loadingAction)}
      >
        <Check data-icon="inline-start" /> {t('common.approve')}
      </Button>
    </div>
  )
}
