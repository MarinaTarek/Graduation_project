import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { UploadProgress } from '@/ui/design-system/components/UploadProgress'
import { useT } from '@/lib/i18n'

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
  const { t } = useT()
  const [file, setFile] = useState<{ name: string; size: string } | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'uploading' | 'success' | 'error'>('uploading')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  if (!isOpen) return null

  const startUpload = (fileName: string, fileSize: string) => {
    setFile({ name: fileName, size: fileSize })
    setProgress(15)
    setStatus('uploading')

    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (timerRef.current) clearInterval(timerRef.current)
          setStatus('success')
          setTimeout(() => {
            onSave()
          }, 600)
          return 100
        }
        return prev + 25
      })
    }, 200)
  }

  const handleChooseFile = () => {
    startUpload('Invoice_INV-8821.pdf', '2.4 MB')
  }

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setFile(null)
    setProgress(0)
  }

  const handleRetry = () => {
    if (file) {
      startUpload(file.name, file.size)
    }
  }

  return (
    <Drawer title={t('invoices.upload.title')} kicker={t('invoices.upload.kicker')} onClose={onClose}>
      <div className="upload-zone">
        <Upload />
        <strong>{t('invoices.upload.dropzone')}</strong>
        <span>{t('invoices.upload.orChoose')}</span>
        {!file && (
          <Button variant="secondary" onClick={handleChooseFile}>
            {t('invoices.upload.chooseFile')}
          </Button>
        )}
      </div>

      {file && (
        <UploadProgress
          fileName={file.name}
          fileSize={file.size}
          progress={progress}
          status={status}
          onCancel={handleCancel}
          onRetry={handleRetry}
        />
      )}
    </Drawer>
  )
}
