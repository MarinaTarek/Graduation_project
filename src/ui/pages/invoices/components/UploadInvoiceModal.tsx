import { Upload } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'

export interface UploadInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function UploadInvoiceModal({
  isOpen,
  onClose,
  onSave,
}: UploadInvoiceModalProps) {
  if (!isOpen) return null

  return (
    <Drawer title="Upload invoice" kicker="INVOICE INTAKE" onClose={onClose}>
      <div className="upload-zone">
        <Upload />
        <strong>Drop an invoice here</strong>
        <span>or choose a file from your device</span>
        <Button variant="secondary" onClick={onSave}>
          Choose file
        </Button>
      </div>
    </Drawer>
  )
}
