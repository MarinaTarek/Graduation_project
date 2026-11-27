import { useState, useRef, useMemo, useEffect } from 'react'
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  FileText,
} from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { useT } from '@/lib/i18n'
import { addInvoice, generateInvoiceNumber } from '@/data/mock/invoices'
import { addNotification } from '@/data/mock/notifications'
import { customersStore } from '@/data/mock/customers'
import { useStore } from '@/data/mock/store'
import { getSystemCurrentDate, getSystemNow } from '@/lib/dateUtils'
import {
  extractInvoiceDataFromImage,
  recalculateInvoiceTotals,
  createEmptyInvoiceItem,
  type ExtractedInvoiceData,
  type ExtractedInvoiceItem,
} from '@/lib/ocr/mockOcrService'
import { exportSingleInvoiceToExcel } from '@/lib/export/excelInvoiceExport'

export interface UploadInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  currentUserName?: string
  currentUserId?: string
  role?: string
}

export function UploadInvoiceModal({
  isOpen,
  onClose,
  onSave,
  currentUserName = 'Alex Morgan',
  currentUserId,
  role = 'admin',
}: UploadInvoiceModalProps) {
  const { t, lang } = useT()
  const customers = useStore(customersStore)
  const isAuthorized = role === 'admin' || role === 'rep'
  const activeCustomers = useMemo(() => customers.filter((c) => !c.deleted_at && c.active !== false), [customers])

  // Workflow stages: 'upload' | 'extracting' | 'review'
  const [stage, setStage] = useState<'upload' | 'extracting' | 'review'>('upload')
  const [file, setFile] = useState<{ name: string; size: string; dataUrl?: string } | null>(null)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [extractionStepText, setExtractionStepText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Extracted & Editable Invoice State
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [supplierName, setSupplierName] = useState('Navigen Pharmaceuticals')
  const [issueDate, setIssueDate] = useState(() => getSystemCurrentDate())
  const [dueDate, setDueDate] = useState(() => {
    const d = getSystemNow()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })
  const [currency, setCurrency] = useState('EGP')
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days')
  const [items, setItems] = useState<ExtractedInvoiceItem[]>([])
  const [confidenceMap, setConfidenceMap] = useState<Record<string, number>>({})
  const [uncertainFields, setUncertainFields] = useState<string[]>([])

  // Image preview zoom level
  const [imageZoom, setImageZoom] = useState(1)
  const [activeTab, setActiveTab] = useState<'review' | 'image'>('review')

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Totals calculated dynamically from items
  const { subtotal, totalDiscount, totalTax, grandTotal } = useMemo(() => {
    return recalculateInvoiceTotals(items)
  }, [items])

  if (!isOpen) return null

  const resetAll = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setStage('upload')
    setFile(null)
    setExtractionProgress(0)
    setExtractionStepText('')
    setIsSubmitting(false)
    setErrorMessage(null)
    setInvoiceNumber('')
    setSelectedCustomerId('')
    setCustomerName('')
    setSupplierName('Navigen Pharmaceuticals')
    setCurrency('EGP')
    setPaymentTerms('Net 30 Days')
    setItems([])
    setConfidenceMap({})
    setUncertainFields([])
    setImageZoom(1)
  }

  const handleClose = () => {
    resetAll()
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    const sizeStr =
      selected.size > 1024 * 1024
        ? `${(selected.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(selected.size / 1024)} KB`

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      const fileData = { name: selected.name, size: sizeStr, dataUrl }
      setFile(fileData)
      startExtraction(fileData)
    }
    reader.readAsDataURL(selected)
  }

  const startExtraction = async (fileData: { name: string; size: string; dataUrl?: string }) => {
    setStage('extracting')
    setExtractionProgress(15)
    setExtractionStepText(lang === 'ar' ? 'جارٍ فحص وثيقة الفاتورة ضوئياً...' : 'Scanning invoice document image...')
    setErrorMessage(null)

    if (progressTimerRef.current) clearInterval(progressTimerRef.current)

    progressTimerRef.current = setInterval(() => {
      setExtractionProgress((prev) => {
        if (prev >= 85) {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current)
          return 85
        }
        if (prev === 40) {
          setExtractionStepText(lang === 'ar' ? 'استخراج الجداول والأصناف والأسعار...' : 'Extracting tables, line items, and prices...')
        }
        return prev + 15
      })
    }, 180)

    try {
      const extracted = await extractInvoiceDataFromImage(fileData)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      setExtractionProgress(100)
      setExtractionStepText(lang === 'ar' ? 'اكتمل الاستخراج بنجاح!' : 'Extraction completed successfully!')

      // Populate form state from OCR extracted data
      setInvoiceNumber(extracted.invoiceNumber || generateInvoiceNumber())
      setIssueDate(extracted.invoiceDate || getSystemCurrentDate())
      setDueDate(extracted.dueDate || getSystemCurrentDate())
      setSupplierName(extracted.supplierName || 'Navigen Pharmaceuticals')
      setCustomerName(extracted.customerName || (activeCustomers[0]?.name ?? 'Customer'))
      setSelectedCustomerId(extracted.customerId || (activeCustomers[0]?.id ?? ''))
      setCurrency(extracted.currency || 'EGP')
      setPaymentTerms(extracted.paymentTerms || 'Net 30 Days')
      setItems(extracted.items || [])
      setConfidenceMap(extracted.confidenceMap || {})
      setUncertainFields(extracted.uncertainFields || [])

      setTimeout(() => {
        setStage('review')
      }, 400)
    } catch (err) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      setStage('upload')
      setErrorMessage(lang === 'ar' ? 'تعذر استخراج بيانات الفاتورة. يرجى المحاولة مرة أخرى.' : 'Failed to extract invoice data. Please try again.')
    }
  }

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, createEmptyInvoiceItem()])
  }

  const handleRemoveItemRow = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const handleItemChange = (id: string, field: keyof ExtractedInvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it
        const updated = { ...it, [field]: value }
        // Keep row marked as user-edited/resolved
        updated.isUncertain = false
        updated.confidence = 100
        // Update line total dynamically
        if (field === 'quantity' || field === 'unitPrice' || field === 'discount' || field === 'tax') {
          const q = Number(field === 'quantity' ? value : updated.quantity) || 0
          const p = Number(field === 'unitPrice' ? value : updated.unitPrice) || 0
          const d = Number(field === 'discount' ? value : updated.discount) || 0
          const tx = Number(field === 'tax' ? value : updated.tax) || 0
          updated.lineTotal = Number(Math.max(0, q * p - d + tx).toFixed(2))
        }
        return updated
      })
    )
  }

  const handleExportSingleExcel = () => {
    const activeCustomer = activeCustomers.find((c) => c.id === selectedCustomerId)
    exportSingleInvoiceToExcel({
      invoiceNumber: invoiceNumber.trim() || 'INV-DRAFT',
      customerName: activeCustomer?.name || customerName || 'Valued Customer',
      supplierName,
      issueDate,
      dueDate,
      currency,
      paymentTerms,
      items,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
      status: 'Pending',
      repName: currentUserName,
    })
  }

  const handleConfirmInvoice = () => {
    setErrorMessage(null)
    if (isSubmitting) return

    if (!isAuthorized) {
      setErrorMessage(lang === 'ar' ? 'غير مصرح: دور المستخدم لا يملك صلاحية رفع أو إنشاء فواتير.' : 'Unauthorized: Your role does not have permission to upload or create invoices.')
      return
    }

    if (!invoiceNumber.trim()) {
      setErrorMessage(lang === 'ar' ? 'رقم الفاتورة مطلوب.' : 'Invoice number is required.')
      return
    }

    const activeCustomer = activeCustomers.find((c) => c.id === selectedCustomerId)
    const effectiveCustomerId = activeCustomer?.id || selectedCustomerId
    const effectiveCustomerName = activeCustomer?.name || customerName

    if (!effectiveCustomerId || !effectiveCustomerName) {
      setErrorMessage(lang === 'ar' ? 'يرجى اختيار عميل صالح للفاتورة.' : 'Please select a valid customer for the invoice.')
      return
    }

    if (!Number.isFinite(grandTotal) || grandTotal <= 0) {
      setErrorMessage(lang === 'ar' ? 'المبلغ الإجمالي للفاتورة يجب أن يكون أكبر من صفر.' : 'Invoice grand total must be greater than zero.')
      return
    }

    if (new Date(dueDate).getTime() < new Date(issueDate).getTime()) {
      setErrorMessage(lang === 'ar' ? 'تاريخ الاستحقاق لا يمكن أن يكون قبل تاريخ الإصدار.' : 'Due date cannot be earlier than issue date.')
      return
    }

    setIsSubmitting(true)

    try {
      // Map items to canonical InvoiceLineItem
      // Line item reconciliation requires: originalAmount === sum(items.total) - discountAmount
      // We set originalAmount = grandTotal, discountAmount = totalDiscount
      // and items with line totals:
      const canonicalItems = items.map((it) => ({
        productCode: it.productCode || 'GEN-01',
        productName: it.productName || 'Unspecified Product',
        quantity: Math.max(1, Number(it.quantity) || 1),
        unitPrice: Math.max(0, Number(it.unitPrice) || 0),
        total: Number((it.quantity * it.unitPrice + (it.tax || 0)).toFixed(2)),
        unit: it.unit || 'Box',
        discount: Number(it.discount) || 0,
        tax: Number(it.tax) || 0,
      }))

      // Reconciled total check:
      const rawSum = canonicalItems.reduce((acc, it) => acc + it.total, 0)
      const reconciledDiscount = Number(totalDiscount.toFixed(2))
      const reconciledOriginalAmount = Number((rawSum - reconciledDiscount).toFixed(2))

      const createdInvoice = addInvoice(
        {
          customerId: effectiveCustomerId,
          customerName: effectiveCustomerName,
          customerName_ar: activeCustomer?.name_ar,
          invoiceNumber: invoiceNumber.trim(),
          originalAmount: reconciledOriginalAmount > 0 ? reconciledOriginalAmount : grandTotal,
          discountAmount: reconciledDiscount,
          currency,
          issueDate,
          dueDate,
          status: 'Pending',
          source: 'Web upload',
          dateRange: 'Today',
          repName: currentUserName,
          repId: currentUserId,
          attachmentFileName: file?.name || 'invoice-scan.jpg',
          attachmentFileSize: file?.size || '1.2 MB',
          supplierName,
          paymentTerms,
          subtotal,
          totalTax,
          rawImageUrl: file?.dataUrl,
          items: canonicalItems,
          notes: `OCR Extracted Document: ${file?.name || 'Scan'} • ${items.length} line items`,
        },
        {
          id: currentUserId,
          name: currentUserName,
          role,
        }
      )

      addNotification({
        title: 'Invoice Uploaded & Extracted',
        title_ar: 'تم رفع ومطابقة الفاتورة',
        message: `${createdInvoice.name} has been reviewed and added with ${canonicalItems.length} line items.`,
        message_ar: `تمت مراجعة وإضافة ${createdInvoice.name} وتتضمن ${canonicalItems.length} أصناف.`,
        category: 'invoices',
        priority: 'info',
        time: 'Just now',
        targetPage: 'Invoices & Sell-in',
        actionLabel: 'View Invoices',
        actionLabel_ar: 'عرض الفواتير',
      })

      handleClose()
      onSave()
    } catch (err: any) {
      setIsSubmitting(false)
      setErrorMessage(err.message || 'Failed to save reviewed invoice.')
    }
  }

  return (
    <Drawer
      title={lang === 'ar' ? 'رفع ومراجعة الفاتورة الذكية' : 'Smart Invoice Upload & OCR Review'}
      kicker={lang === 'ar' ? 'التعرف الضوئي على المستندات' : 'Intelligent Document Extraction'}
      onClose={handleClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '600px' }}>
        {/* Error notification banner */}
        {!isAuthorized && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--rose-text, #ef4444)',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <AlertCircle size={18} />
            <span>
              {lang === 'ar'
                ? 'غير مصرح: لا تملك صلاحية رفع أو إنشاء فواتير جديدة.'
                : 'Unauthorized: Your role does not have permission to upload or create invoices.'}
            </span>
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--rose-text, #ef4444)',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STAGE 1: UPLOAD ZONE */}
        {stage === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
              style={{
                cursor: 'pointer',
                border: '2px dashed var(--border-soft, #cbd5e1)',
                borderRadius: '16px',
                padding: '36px 20px',
                textAlign: 'center',
                background: 'var(--surface-raised, rgba(0,0,0,0.02))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'border-color 0.2s',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--ocean-tint, rgba(2, 132, 199, 0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ocean, #0284c7)',
                }}
              >
                <Upload size={28} />
              </div>
              <div>
                <strong style={{ fontSize: '15px', color: 'var(--heading-text)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'ar' ? 'اسحب وأفلت صورة الفاتورة هنا، أو انقر للاختيار' : 'Drag & drop invoice image here, or browse files'}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
                  {lang === 'ar'
                    ? 'يدعم صور الفواتير بجميع التنسيقات (PNG, JPG, JPEG, WEBP) بمختلف اللغات والتخطيطات'
                    : 'Supports invoice images (PNG, JPG, JPEG, WEBP) across flexible layouts and multi-item tables'}
                </span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf"
                style={{ display: 'none' }}
              />
              <Button variant="secondary" type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
                {lang === 'ar' ? 'اختيار ملف الفاتورة' : 'Select Invoice File'}
              </Button>
            </div>

            {/* Template-free flexibility note */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'var(--paper, #fff)',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                fontSize: '12px',
                color: 'var(--muted-text)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <Sparkles size={18} color="var(--ocean, #0284c7)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--heading-text)', display: 'block', marginBottom: '2px' }}>
                  {lang === 'ar' ? 'مرونة المعالجة والتعرف الذكي' : 'Template-Agnostic Extraction'}
                </strong>
                <span>
                  {lang === 'ar'
                    ? 'النموذج مصمم لاستيعاب الفواتير الطبية والمستودعات بمختلف التصاميم وعدد البنود المتغير دون التقيد بقالب ثابت.'
                    : 'Engineered to handle varied supplier layouts, dynamic product tables, discounts, and tax structures seamlessly.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2: OCR EXTRACTION LOADING */}
        {stage === 'extracting' && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '18px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(2, 132, 199, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ocean, #0284c7)',
                animation: 'spin 2s linear infinite',
              }}
            >
              <RefreshCw size={32} />
            </div>

            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 600 }}>
                {lang === 'ar' ? 'جاري تحليل واستخراج بيانات الفاتورة...' : 'Extracting Invoice Data with OCR...'}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-text)' }}>
                {extractionStepText}
              </p>
            </div>

            <div style={{ width: '100%', maxWidth: '380px', height: '8px', background: 'var(--border-soft, #e2e8f0)', borderRadius: '99px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${extractionProgress}%`,
                  background: 'var(--ocean, #0284c7)',
                  borderRadius: '99px',
                  transition: 'width 0.3s ease-out',
                }}
              />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>{extractionProgress}%</span>
          </div>
        )}

        {/* STAGE 3: REVIEW & EDITING STAGE */}
        {stage === 'review' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header Control Bar: Document Info & Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'var(--paper, #fff)',
                border: '1px solid var(--border-subtle, #e2e8f0)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(22, 163, 74, 0.1)',
                    color: 'var(--green-text, #16a34a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading-text)' }}>
                    {file?.name || 'invoice-document.jpg'} ({file?.size || '1.1 MB'})
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
                    {lang === 'ar' ? 'مرحلة التحقق والمراجعة المحاسبية' : 'Extraction Stage: Ready for Review & Verification'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Replace File Button */}
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ height: '32px', fontSize: '12px', padding: '0 10px' }}
                >
                  <RefreshCw size={13} style={{ marginInlineEnd: '4px' }} />
                  {lang === 'ar' ? 'استبدال المستند' : 'Replace Image'}
                </Button>
                {/* Export to Excel for this single reviewed invoice */}
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleExportSingleExcel}
                  style={{
                    height: '32px',
                    fontSize: '12px',
                    padding: '0 10px',
                    color: '#16a34a',
                    borderColor: 'rgba(22, 163, 74, 0.4)',
                  }}
                >
                  <FileSpreadsheet size={14} style={{ marginInlineEnd: '4px' }} />
                  {lang === 'ar' ? 'تصدير لإكسيل (XML)' : 'Export Excel (XML)'}
                </Button>
              </div>
            </div>

            {/* Mobile / Tablet Tab switch for Document Image vs Form */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid var(--border-soft, #e2e8f0)',
                paddingBottom: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('review')}
                style={{
                  background: activeTab === 'review' ? 'var(--ocean, #0284c7)' : 'transparent',
                  color: activeTab === 'review' ? '#fff' : 'var(--muted-text)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FileText size={15} />
                <span>{lang === 'ar' ? 'بيانات الفاتورة والأصناف' : 'Invoice Data & Line Items'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('image')}
                style={{
                  background: activeTab === 'image' ? 'var(--ocean, #0284c7)' : 'transparent',
                  color: activeTab === 'image' ? '#fff' : 'var(--muted-text)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Eye size={15} />
                <span>{lang === 'ar' ? 'معاينة صورة المستند الأصلية' : 'Document Image Preview'}</span>
              </button>
            </div>

            {/* TAB 1: FORM REVIEW & DYNAMIC ITEMS TABLE */}
            {activeTab === 'review' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* SECTION 1: HEADER FIELDS */}
                <div
                  style={{
                    background: 'var(--paper, #fff)',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: 'var(--heading-text)' }}>
                    {lang === 'ar' ? '1. معلومات الفاتورة والمورد' : '1. Invoice & Supplier Details'}
                  </h4>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {/* Invoice Number */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>
                          {lang === 'ar' ? 'رقم الفاتورة *' : 'Invoice Number *'}
                        </label>
                        <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600 }}>
                          {confidenceMap.invoiceNumber ? `${confidenceMap.invoiceNumber}%` : 'Extracted'}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-soft, #cbd5e1)',
                          fontSize: '13px',
                        }}
                      />
                    </div>

                    {/* Customer */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>
                          {lang === 'ar' ? 'العميل المستلم *' : 'Customer Name *'}
                        </label>
                        <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600 }}>
                          {confidenceMap.customerName ? `${confidenceMap.customerName}%` : 'Matched'}
                        </span>
                      </div>
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => {
                          setSelectedCustomerId(e.target.value)
                          const found = activeCustomers.find((c) => c.id === e.target.value)
                          if (found) setCustomerName(found.name)
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-soft, #cbd5e1)',
                          fontSize: '13px',
                          background: 'var(--surface)',
                        }}
                      >
                        {activeCustomers.map((cust) => (
                          <option key={cust.id} value={cust.id}>
                            {cust.name} {cust.type ? `(${cust.type})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Supplier Name */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        {lang === 'ar' ? 'اسم المورد' : 'Supplier Name'}
                      </label>
                      <input
                        type="text"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-soft, #cbd5e1)',
                          fontSize: '13px',
                        }}
                      />
                    </div>

                    {/* Issue Date */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        {lang === 'ar' ? 'تاريخ الفاتورة *' : 'Invoice Date *'}
                      </label>
                      <input
                        type="date"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-soft, #cbd5e1)',
                          fontSize: '13px',
                        }}
                      />
                    </div>

                    {/* Due Date (Uncertain warning indicator) */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>
                          {lang === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}
                        </label>
                        {uncertainFields.includes('dueDate') && (
                          <span style={{ fontSize: '10px', color: '#d97706', fontWeight: 600, background: 'rgba(217, 119, 6, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                            {lang === 'ar' ? 'بحاجة لمراجعة' : 'Review needed'}
                          </span>
                        )}
                      </div>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => {
                          setDueDate(e.target.value)
                          setUncertainFields((prev) => prev.filter((f) => f !== 'dueDate'))
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: uncertainFields.includes('dueDate') ? '1px solid #f59e0b' : '1px solid var(--border-soft, #cbd5e1)',
                          fontSize: '13px',
                        }}
                      />
                    </div>

                    {/* Currency & Payment Terms */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        {lang === 'ar' ? 'العملة وشروط الدفع' : 'Currency & Terms'}
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          style={{
                            width: '70px',
                            padding: '8px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-soft, #cbd5e1)',
                            fontSize: '13px',
                            textAlign: 'center',
                          }}
                        />
                        <input
                          type="text"
                          value={paymentTerms}
                          placeholder="e.g. Net 30"
                          onChange={(e) => setPaymentTerms(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-soft, #cbd5e1)',
                            fontSize: '13px',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: DYNAMIC INVOICE ITEMS TABLE */}
                <div
                  style={{
                    background: 'var(--paper, #fff)',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 600, color: 'var(--heading-text)' }}>
                        {lang === 'ar' ? '2. جدول بنود وأصناف الفاتورة' : '2. Invoice Line Items'}
                      </h4>
                      <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
                        {lang === 'ar' ? 'جدول ديناميكي يدعم إضافة وحذف أي عدد من الأصناف' : 'Dynamic table supporting dynamic rows, recalculation, and tax/discounts'}
                      </span>
                    </div>

                    <Button
                      variant="secondary"
                      type="button"
                      onClick={handleAddItemRow}
                      style={{ height: '32px', fontSize: '12px', padding: '0 12px' }}
                    >
                      <Plus size={14} style={{ marginInlineEnd: '4px' }} />
                      {lang === 'ar' ? 'إضافة صنف' : 'Add Line Item'}
                    </Button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-raised, rgba(0,0,0,0.02))', borderBottom: '1px solid var(--border-soft, #cbd5e1)' }}>
                          <th style={{ padding: '8px 10px', textAlign: lang === 'ar' ? 'right' : 'left' }}>{lang === 'ar' ? 'اسم الصنف *' : 'Product Name *'}</th>
                          <th style={{ padding: '8px 6px', width: '100px', textAlign: 'center' }}>{lang === 'ar' ? 'الكود' : 'Code'}</th>
                          <th style={{ padding: '8px 6px', width: '80px', textAlign: 'center' }}>{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                          <th style={{ padding: '8px 6px', width: '80px', textAlign: 'center' }}>{lang === 'ar' ? 'الوحدة' : 'Unit'}</th>
                          <th style={{ padding: '8px 6px', width: '100px', textAlign: 'center' }}>{lang === 'ar' ? 'السعر (ج.م)' : 'Price'}</th>
                          <th style={{ padding: '8px 6px', width: '80px', textAlign: 'center' }}>{lang === 'ar' ? 'الخصم' : 'Disc.'}</th>
                          <th style={{ padding: '8px 6px', width: '80px', textAlign: 'center' }}>{lang === 'ar' ? 'الضريبة' : 'Tax'}</th>
                          <th style={{ padding: '8px 10px', width: '110px', textAlign: lang === 'ar' ? 'left' : 'right' }}>{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
                          <th style={{ padding: '8px 6px', width: '40px', textAlign: 'center' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted-text)' }}>
                              {lang === 'ar' ? 'لا توجد أصناف. اضغط على "+ إضافة صنف" للبدء.' : 'No line items. Click "+ Add Line Item" to create one.'}
                            </td>
                          </tr>
                        ) : (
                          items.map((item) => (
                            <tr
                              key={item.id}
                              style={{
                                borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
                                background: item.isUncertain ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                              }}
                            >
                              <td style={{ padding: '6px 8px' }}>
                                <input
                                  type="text"
                                  value={item.productName}
                                  placeholder="Product Name"
                                  onChange={(e) => handleItemChange(item.id, 'productName', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-soft, #cbd5e1)',
                                    fontSize: '12px',
                                  }}
                                />
                                {item.isUncertain && (
                                  <span style={{ fontSize: '10px', color: '#d97706', display: 'block', marginTop: '2px' }}>
                                    {lang === 'ar' ? 'دقة منخفضة (78%) • يرجى التحقق' : 'Low confidence (78%) • verify'}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  value={item.productCode}
                                  placeholder="Code"
                                  onChange={(e) => handleItemChange(item.id, 'productCode', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '6px 4px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-soft, #cbd5e1)',
                                    fontSize: '12px',
                                    textAlign: 'center',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(item.id, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                                  style={{
                                    width: '100%',
                                    padding: '6px 4px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-soft, #cbd5e1)',
                                    fontSize: '12px',
                                    textAlign: 'center',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="text"
                                  value={item.unit}
                                  placeholder="Box"
                                  onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '6px 4px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-soft, #cbd5e1)',
                                    fontSize: '12px',
                                    textAlign: 'center',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unitPrice}
                                  onChange={(e) => handleItemChange(item.id, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                                  style={{
                                    width: '100%',
                                    padding: '6px 4px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-soft, #cbd5e1)',
                                    fontSize: '12px',
                                    textAlign: 'right',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.discount}
                                  onChange={(e) => handleItemChange(item.id, 'discount', Math.max(0, parseFloat(e.target.value) || 0))}
                                  style={{
                                    width: '100%',
                                    padding: '6px 4px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-soft, #cbd5e1)',
                                    fontSize: '12px',
                                    textAlign: 'right',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '6px 4px' }}>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.tax}
                                  onChange={(e) => handleItemChange(item.id, 'tax', Math.max(0, parseFloat(e.target.value) || 0))}
                                  style={{
                                    width: '100%',
                                    padding: '6px 4px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-soft, #cbd5e1)',
                                    fontSize: '12px',
                                    textAlign: 'right',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: lang === 'ar' ? 'left' : 'right', fontWeight: 600 }}>
                                {item.lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemRow(item.id)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--muted-text)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                  }}
                                  title="Delete Row"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 3: TOTALS SUMMARY CARD */}
                <div
                  style={{
                    background: 'var(--paper, #fff)',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxWidth: '420px',
                    marginInlineStart: 'auto',
                    width: '100%',
                  }}
                >
                  <h4 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: 'var(--heading-text)' }}>
                    {lang === 'ar' ? '3. ملخص الإجماليات الحسابية' : '3. Invoice Financial Summary'}
                  </h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted-text)' }}>
                    <span>{lang === 'ar' ? 'المجموع الفرعي (Subtotal):' : 'Subtotal:'}</span>
                    <strong style={{ color: 'var(--heading-text)' }}>{currency} {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted-text)' }}>
                    <span>{lang === 'ar' ? 'إجمالي الخصم (Discount):' : 'Total Discount:'}</span>
                    <strong style={{ color: '#16a34a' }}>- {currency} {totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted-text)' }}>
                    <span>{lang === 'ar' ? 'إجمالي الضريبة (Tax):' : 'Total Tax:'}</span>
                    <strong style={{ color: 'var(--heading-text)' }}>+ {currency} {totalTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid var(--border-soft, #cbd5e1)',
                      paddingTop: '8px',
                      marginTop: '4px',
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--heading-text)' }}>
                      {lang === 'ar' ? 'المبلغ الإجمالي النهائي:' : 'Grand Total:'}
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ocean, #0284c7)' }}>
                      {currency} {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* BOTTOM ACTIONS */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle, #e2e8f0)',
                  }}
                >
                  <Button variant="secondary" type="button" onClick={handleClose}>
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>

                  <Button
                    variant="primary"
                    type="button"
                    onClick={handleConfirmInvoice}
                    disabled={isSubmitting}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#16a34a',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>
                      {isSubmitting
                        ? (lang === 'ar' ? 'جارٍ الحفظ والتسجيل...' : 'Saving Invoice...')
                        : (lang === 'ar' ? 'تأكيد وحفظ الفاتورة في النظام' : 'Confirm & Save Invoice')}
                    </span>
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 2: ORIGINAL IMAGE PREVIEW */}
            {activeTab === 'image' && (
              <div
                style={{
                  background: 'var(--paper, #fff)',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>
                    {lang === 'ar' ? 'المستند الأصلي المرفوع' : 'Original Scanned Document'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setImageZoom((z) => Math.max(0.6, z - 0.2))}
                      style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                    >
                      <ZoomOut size={14} />
                    </button>
                    <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>{Math.round(imageZoom * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setImageZoom((z) => Math.min(2.5, z + 0.2))}
                      style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                    >
                      <ZoomIn size={14} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    maxHeight: '480px',
                    overflow: 'auto',
                    border: '1px solid var(--border-soft, #cbd5e1)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0f172a',
                    padding: '16px',
                  }}
                >
                  {file?.dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.dataUrl}
                      alt="Uploaded Invoice Scan"
                      style={{
                        transform: `scale(${imageZoom})`,
                        transformOrigin: 'top center',
                        transition: 'transform 0.2s ease',
                        maxWidth: '100%',
                        borderRadius: '4px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                      }}
                    />
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>
                      {lang === 'ar' ? 'لا توجد صورة مستند للمعاينة' : 'No document image available for preview.'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  )
}
