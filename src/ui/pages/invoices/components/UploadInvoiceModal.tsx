import { useState, useRef, useMemo } from 'react'
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { UploadProgress } from '@/ui/design-system/components/UploadProgress'
import { useT } from '@/lib/i18n'
import { addInvoice, generateInvoiceNumber } from '@/data/mock/invoices'
import { addNotification } from '@/data/mock/notifications'
import { customersStore } from '@/data/mock/customers'
import { useStore } from '@/data/mock/store'
import { getSystemCurrentDate, getSystemNow } from '@/lib/dateUtils'

export interface UploadInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  currentUserName?: string
}

export function UploadInvoiceModal({
  isOpen,
  onClose,
  onSave,
  currentUserName = 'Alex Morgan',
}: UploadInvoiceModalProps) {
  const { t, lang } = useT()
  const customers = useStore(customersStore)
  const activeCustomers = useMemo(() => customers.filter((c) => !c.deleted_at), [customers])

  const [file, setFile] = useState<{ name: string; size: string } | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'uploading' | 'success' | 'error'>('uploading')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Structured Invoice Form Fields
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [issueDate, setIssueDate] = useState<string>(() => getSystemCurrentDate())
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = getSystemNow()
    d.setDate(d.getDate() + 30)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen) return null

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setFile(null)
    setProgress(0)
    setStatus('uploading')
    setIsSubmitting(false)
    setErrorMessage(null)
    setSelectedCustomerId('')
    setInvoiceNumber('')
    setAmount('')
    onClose()
  }

  const startUpload = (fileName: string, fileSize: string) => {
    setFile({ name: fileName, size: fileSize })
    setProgress(15)
    setStatus('uploading')
    setErrorMessage(null)

    if (!selectedCustomerId && activeCustomers.length > 0) {
      setSelectedCustomerId(activeCustomers[0].id || '')
    }
    if (!invoiceNumber) {
      setInvoiceNumber(generateInvoiceNumber())
    }

    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (timerRef.current) clearInterval(timerRef.current)
          setStatus('success')
          return 100
        }
        return prev + 25
      })
    }, 150)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    const sizeStr =
      selectedFile.size > 1024 * 1024
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(selectedFile.size / 1024)} KB`
    startUpload(selectedFile.name, sizeStr)
  }

  const handleChooseFile = () => {
    fileInputRef.current?.click()
  }

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setFile(null)
    setProgress(0)
    setStatus('uploading')
    setErrorMessage(null)
  }

  const handleRetry = () => {
    if (file) {
      startUpload(file.name, file.size)
    }
  }

  // Explicit user event handler for creating the invoice with structured fields
  const handleConfirmInvoice = () => {
    setErrorMessage(null)
    if (!file || isSubmitting) return

    const parsedAmount = parseFloat(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage(
        lang === 'ar'
          ? 'يرجى إدخال مبلغ صالح للفاتورة (أكبر من صفر).'
          : 'Please enter a valid invoice amount greater than zero.',
      )
      return
    }

    const customer = activeCustomers.find((c) => c.id === selectedCustomerId)
    if (!customer || !customer.id) {
      setErrorMessage(
        lang === 'ar' ? 'يرجى اختيار العميل التابع للفاتورة.' : 'Please select a valid customer for the invoice.',
      )
      return
    }

    if (!invoiceNumber.trim()) {
      setErrorMessage(
        lang === 'ar' ? 'رقم الفاتورة مطلوب.' : 'Invoice number is required.',
      )
      return
    }

    if (new Date(dueDate).getTime() < new Date(issueDate).getTime()) {
      setErrorMessage(
        lang === 'ar'
          ? 'تاريخ الاستحقاق لا يمكن أن يكون قبل تاريخ الإصدار.'
          : 'Due date cannot be earlier than issue date.',
      )
      return
    }

    setIsSubmitting(true)

    try {
      const createdInvoice = addInvoice({
        customerId: customer.id,
        customerName: customer.name,
        customerName_ar: customer.name_ar,
        invoiceNumber: invoiceNumber.trim(),
        originalAmount: parsedAmount,
        currency: 'EGP',
        issueDate,
        dueDate,
        status: 'Pending',
        source: 'Web upload',
        dateRange: 'Today',
        repName: currentUserName,
        attachmentFileName: file.name,
        attachmentFileSize: file.size,
        notes: `Document upload: ${file.name} (${file.size})`,
      })

      addNotification({
        title: 'Invoice Uploaded',
        title_ar: 'تم رفع فاتورة',
        message: `${createdInvoice.name} has been uploaded and is pending review.`,
        message_ar: `تم رفع ${createdInvoice.name} وهي بانتظار المراجعة.`,
        category: 'invoices',
        priority: 'info',
        time: 'Just now',
        targetPage: 'Invoices & Sell-in',
        actionLabel: 'Review Invoice',
        actionLabel_ar: 'مراجعة الفاتورة',
      })

      handleClose()
      onSave()
    } catch (err: any) {
      setIsSubmitting(false)
      setErrorMessage(err.message || 'Failed to save invoice.')
    }
  }

  return (
    <Drawer title={t('invoices.upload.title')} kicker={t('invoices.upload.kicker')} onClose={handleClose}>
      <div className="upload-zone">
        <Upload />
        <strong>{t('invoices.upload.dropzone')}</strong>
        <span>{t('invoices.upload.orChoose')}</span>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv"
          style={{ display: 'none' }}
        />
        {!file && (
          <Button variant="secondary" onClick={handleChooseFile}>
            {t('invoices.upload.chooseFile')}
          </Button>
        )}
      </div>

      {file && (
        <div style={{ marginTop: '16px' }}>
          <UploadProgress
            fileName={file.name}
            fileSize={file.size}
            progress={progress}
            status={status}
            onCancel={handleCancel}
            onRetry={handleRetry}
          />

          {status === 'success' && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'var(--subtle-bg, #f8f9fa)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--muted-text)' }}>
                  {lang === 'ar'
                    ? 'تم إرفاق المستند بنجاح. يرجى تأكيد بيانات الفاتورة المحاسبية أدناه:'
                    : 'Document attached successfully. Please confirm the invoice accounting details below:'}
                </p>

                {errorMessage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--rose-text)', fontSize: '13px', marginBottom: '10px' }}>
                    <AlertCircle size={15} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      {lang === 'ar' ? 'العميل *' : 'Customer *'}
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}
                    >
                      {activeCustomers.map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.name} {cust.type ? `(${cust.type})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      {lang === 'ar' ? 'رقم الفاتورة *' : 'Invoice Number *'}
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="INV-1051"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      {lang === 'ar' ? 'المبلغ الإجمالي (ج.م) *' : 'Grand Total (EGP) *'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 15000"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      {lang === 'ar' ? 'تاريخ الإصدار *' : 'Issue Date *'}
                    </label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      {lang === 'ar' ? 'تاريخ الاستحقاق *' : 'Due Date *'}
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={handleCancel}>
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmInvoice}
                  disabled={isSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle2 size={16} />
                  <span>{lang === 'ar' ? 'تأكيد وإضافة الفاتورة' : 'Confirm & Add Invoice'}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}
