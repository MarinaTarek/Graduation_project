import { useState } from 'react'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { InvoiceDetailCard } from './components/InvoiceDetailCard'
import { InvoiceReviewActions } from './components/InvoiceReviewActions'
import { invoiceReviewMockData } from './mock-data'
import { canPerformAction, useAuth } from '@/lib/auth'
import { localizedName, useT } from '@/lib/i18n'
import { formatCurrency } from '@/lib/format'
import { useStore } from '@/data/mock/store'
import { invoicesStore, updateInvoice } from '@/data/mock/invoices'
import { salesOrdersStore } from '@/data/mock/sales-orders'
import { customersStore } from '@/data/mock/customers'
import { addAuditLog } from '@/data/mock/audit'

export interface InvoiceReviewPageProps {
  // Name of the invoice to review. When absent (e.g. opened from the Home
  // hero), the first pending invoice in the store is reviewed instead.
  invoiceName?: string | null
  onClose: () => void
  onAction: (msg: string) => void
}

function parseMetaAmount(meta: string): number | undefined {
  const match = meta.match(/EGP\s*([\d,]+(?:\.\d+)?)/)
  if (!match) return undefined
  const value = Number(match[1].replace(/,/g, ''))
  return Number.isFinite(value) ? value : undefined
}

export default function InvoiceReviewPage({
  invoiceName,
  onClose,
  onAction,
}: InvoiceReviewPageProps) {
  const { t, lang } = useT()
  const { user } = useAuth()
  const invoices = useStore(invoicesStore)
  const orders = useStore(salesOrdersStore)
  const customers = useStore(customersStore)
  const [loadingAction, setLoadingAction] = useState<'approve' | 'reject' | null>(null)

  const invoice = invoiceName
    ? invoices.find((item) => item.name === invoiceName)
    : invoices.find((item) => item.status === 'Pending')

  const linkedOrder = invoice?.order_id
    ? orders.find((order) => order.id === invoice.order_id)
    : undefined
  const linkedCustomer = linkedOrder
    ? customers.find((customer) => customer.id === linkedOrder.customerId)
    : undefined

  // Demo permission model, same authority used for sales-order approvals.
  const canReview = canPerformAction('canApproveInvoices', user)
  const isPending = invoice?.status === 'Pending'

  // Legacy fallback so the drawer still renders safely when the demo store
  // has no matching record (e.g. storage was reset mid-session).
  if (!invoice) {
    const legacy = invoiceReviewMockData
    return (
      <Drawer title={legacy.id} kicker={lang === 'ar' ? legacy.kicker_ar : legacy.kicker} onClose={onClose}>
        <InvoiceDetailCard
          client={lang === 'ar' ? legacy.client_ar : legacy.client}
          amount={formatCurrency(legacy.amount, 'EGP', lang)}
          meta={lang === 'ar' ? legacy.meta_ar : legacy.meta}
        />
      </Drawer>
    )
  }

  const client = linkedCustomer
    ? localizedName(linkedCustomer, lang)
    : linkedOrder?.customerName ??
      (invoice.name.includes('·') ? invoice.name.split('·').slice(1).join('·').trim() : invoice.name)
  const amount = linkedOrder
    ? formatCurrency(linkedOrder.total, 'EGP', lang)
    : formatCurrency(parseMetaAmount(invoice.meta), 'EGP', lang)
  const meta = lang === 'ar' ? invoice.meta_ar || invoice.meta : invoice.meta

  const handleApprove = () => {
    if (loadingAction || !isPending) return
    setLoadingAction('approve')
    try {
      updateInvoice(invoice.name, { status: 'Approved' })
      addAuditLog({
        action: 'Invoice Approved',
        actor: user?.name || 'Unknown',
        time: 'Just now',
        details: linkedOrder
          ? `Approved ${invoice.name} from sales order ${linkedOrder.id}`
          : `Approved ${invoice.name}`,
      })
      onAction(t('invoices.approveSuccess'))
      onClose()
    } finally {
      setLoadingAction(null)
    }
  }

  const handleReject = () => {
    if (loadingAction || !isPending) return
    if (!window.confirm(t('invoiceReview.confirmReject', { id: invoice.name }))) {
      return
    }
    setLoadingAction('reject')
    try {
      updateInvoice(invoice.name, { status: 'Rejected' })
      addAuditLog({
        action: 'Invoice Rejected',
        actor: user?.name || 'Unknown',
        time: 'Just now',
        details: linkedOrder
          ? `Rejected ${invoice.name} from sales order ${linkedOrder.id}`
          : `Rejected ${invoice.name}`,
      })
      onAction(t('invoices.rejectSuccess'))
      onClose()
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <Drawer title={invoice.name} kicker={t('invoices.reviewKicker')} onClose={onClose}>
      <InvoiceDetailCard client={client} amount={amount} meta={meta} />
      {linkedOrder && (
        <div style={{ margin: '-8px 24px 16px', fontSize: '12px', color: 'var(--muted-text)' }}>
          {t('invoices.createdFromOrder', { order: linkedOrder.id })}
        </div>
      )}
      {/* Discount breakdown from the originating order. The invoice amount is
          the order's final total, so the discount is shown, never re-applied. */}
      {linkedOrder && (linkedOrder.discountAmount ?? 0) > 0 && (
        <div
          style={{
            margin: '-4px 24px 16px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-soft)',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: 'var(--muted-text)' }}>{t('salesOrders.subtotal')}</span>
            <span>{formatCurrency(linkedOrder.subtotal, 'EGP', lang)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: 'var(--muted-text)' }}>
              {t('salesOrders.discount')}
              {linkedOrder.discountType === 'percentage' && linkedOrder.discountValue !== undefined
                ? ` (${linkedOrder.discountValue}%)`
                : ''}
            </span>
            <span style={{ color: 'var(--green-text, #16a34a)' }}>
              −{formatCurrency(linkedOrder.discountAmount ?? 0, 'EGP', lang)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontWeight: 700 }}>
            <span>{t('salesOrders.total')}</span>
            <span>{formatCurrency(linkedOrder.total, 'EGP', lang)}</span>
          </div>
        </div>
      )}
      {isPending && canReview && (
        <InvoiceReviewActions
          onReject={handleReject}
          onApprove={handleApprove}
          loadingAction={loadingAction}
        />
      )}
    </Drawer>
  )
}
