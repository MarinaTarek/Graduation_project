import { useState, type CSSProperties } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { Modal } from '@/ui/design-system/components/Modal'
import { FieldError } from '@/ui/design-system/components/FieldError'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { canPerformAction, useAuth } from '@/lib/auth'
import { localizedName, useT, type TranslationKey } from '@/lib/i18n'
import { formatCurrency, formatDate } from '@/lib/format'
import { useStore } from '@/data/mock/store'
import { customersStore } from '@/data/mock/customers'
import { productsStore } from '@/data/mock/products'
import { auditStore } from '@/data/mock/audit'
import {
  approveSalesOrder,
  rejectSalesOrder,
  salesOrdersStore,
  type SalesOrderStatus,
} from '@/data/mock/sales-orders'
import { translateSalesOrderError } from './sales-order-errors'

const STATUS_LABEL: Record<SalesOrderStatus, TranslationKey> = {
  Pending: 'salesOrders.pending',
  Approved: 'salesOrders.approved',
  Rejected: 'salesOrders.rejected',
}

const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  fontSize: '13px',
  padding: '6px 0',
  borderBottom: '1px solid var(--border-soft)',
}

const mutedStyle: CSSProperties = { color: 'var(--muted-text)' }

export function SalesOrderDetailDrawer({
  orderId,
  onClose,
  onAction,
}: {
  orderId: string
  onClose: () => void
  onAction: (message: string) => void
}) {
  const { t, lang } = useT()
  const { user } = useAuth()
  const orders = useStore(salesOrdersStore)
  const customers = useStore(customersStore)
  const products = useStore(productsStore)
  const audit = useStore(auditStore)

  const order = orders.find((o) => o.id === orderId)
  const customer = order ? customers.find((c) => c.id === order.customerId) : undefined

  // Demo permission model: approval authority is shared with invoice
  // approvals and honours per-user overrides. Frontend-only, not security.
  const canReview = canPerformAction('canApproveInvoices', user)

  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!order) return null

  const customerName = customer ? localizedName(customer, lang) : order.customerName
  const relatedAudit = audit
    .filter((entry) => entry.details.includes(order.id))
    .slice(0, 4)

  const handleApprove = () => {
    if (busy) return
    if (!canReview) {
      setConfirmApprove(false)
      setError(t('common.notAuthorized'))
      return
    }
    setBusy('approve')
    try {
      approveSalesOrder(order.id, user?.name || 'Unknown')
      setConfirmApprove(false)
      onAction(t('salesOrders.approveSuccess'))
    } catch (err) {
      // Close the confirm dialog so the error banner underneath is visible.
      setConfirmApprove(false)
      setError(translateSalesOrderError(err instanceof Error ? err.message : String(err), t))
    } finally {
      setBusy(null)
    }
  }

  const handleReject = () => {
    if (busy) return
    if (!canReview) {
      setRejectOpen(false)
      setError(t('common.notAuthorized'))
      return
    }
    if (!reason.trim()) {
      setReasonError(t('salesOrders.reasonRequired'))
      return
    }
    setBusy('reject')
    try {
      rejectSalesOrder(order.id, reason, user?.name || 'Unknown')
      setRejectOpen(false)
      setReason('')
      setReasonError(null)
      onAction(t('salesOrders.rejectSuccess'))
    } catch (err) {
      setReasonError(translateSalesOrderError(err instanceof Error ? err.message : String(err), t))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Drawer title={t('salesOrders.orderDetails')} kicker={order.id} onClose={onClose}>
      {error && (
        <div style={{ margin: '0 24px 16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--rose-text)', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <div style={{ padding: '0 24px 16px' }}>
        <div style={rowStyle}>
          <span style={mutedStyle}>{t('salesOrders.customer')}</span>
          <strong>{customerName}</strong>
        </div>
        <div style={rowStyle}>
          <span style={mutedStyle}>{t('salesOrders.representativeLabel')}</span>
          <strong>{order.repName}</strong>
        </div>
        <div style={{ ...rowStyle, alignItems: 'center' }}>
          <span style={mutedStyle}>{t('salesOrders.status')}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {t(STATUS_LABEL[order.status])} <StatusPill status={order.status} />
          </span>
        </div>
        <div style={rowStyle}>
          <span style={mutedStyle}>{t('salesOrders.createdAt')}</span>
          <span>{formatDate(order.createdAt, lang)}</span>
        </div>
        <div style={rowStyle}>
          <span style={mutedStyle}>{t('salesOrders.updatedAt')}</span>
          <span>{formatDate(order.updatedAt, lang)}</span>
        </div>
        {order.status === 'Rejected' && order.rejectionReason && (
          <div style={rowStyle}>
            <span style={mutedStyle}>{t('salesOrders.rejectReason')}</span>
            <span>{order.rejectionReason}</span>
          </div>
        )}
      </div>

      <div style={{ padding: '0 24px 16px' }}>
        <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>
          {t('salesOrders.items')}
        </strong>
        {order.items.map((item) => {
          const product = products.find((p) => p.code === item.productCode)
          return (
            <div key={item.productCode} style={rowStyle}>
              <span>{product ? localizedName(product, lang) : item.productName}</span>
              <span style={mutedStyle}>
                {item.quantity} × {formatCurrency(item.unitPrice, 'EGP', lang)}
              </span>
              <strong style={{ whiteSpace: 'nowrap' }}>{formatCurrency(item.total, 'EGP', lang)}</strong>
            </div>
          )
        })}
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <span style={mutedStyle}>{t('salesOrders.subtotal')}</span>
          <span>{formatCurrency(order.subtotal, 'EGP', lang)}</span>
        </div>
        {(order.discountAmount ?? 0) > 0 && (
          <div style={rowStyle}>
            <span style={mutedStyle}>
              {t('salesOrders.discount')}
              {order.discountType === 'percentage' && order.discountValue !== undefined
                ? ` (${order.discountValue}%)`
                : ''}
            </span>
            <span style={{ color: 'var(--green-text, #16a34a)' }}>
              −{formatCurrency(order.discountAmount ?? 0, 'EGP', lang)}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '6px 0' }}>
          <span style={{ fontWeight: 600 }}>{t('salesOrders.total')}</span>
          <strong>{formatCurrency(order.total, 'EGP', lang)}</strong>
        </div>
      </div>

      {relatedAudit.length > 0 && (
        <div style={{ padding: '0 24px 16px' }}>
          <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>
            {t('admin.audit.title')}
          </strong>
          {relatedAudit.map((entry) => (
            <div key={entry.id} style={{ fontSize: '12px', color: 'var(--muted-text)', padding: '4px 0' }}>
              {entry.action} · {entry.actor} · {entry.time}
            </div>
          ))}
        </div>
      )}

      {order.status === 'Pending' && canReview && (
        <div className="sheet-actions">
          <Button
            variant="secondary"
            onClick={() => {
              setError(null)
              setRejectOpen(true)
            }}
            disabled={busy !== null}
          >
            <X data-icon="inline-start" /> {t('salesOrders.reject')}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setError(null)
              setConfirmApprove(true)
            }}
            disabled={busy !== null}
          >
            <Check data-icon="inline-start" /> {t('salesOrders.approve')}
          </Button>
        </div>
      )}

      <Modal isOpen={confirmApprove} onClose={() => setConfirmApprove(false)}>
        <div style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>{t('salesOrders.approveTitle')}</h3>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--muted-text)' }}>
            {t('salesOrders.approveConfirm')}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setConfirmApprove(false)} disabled={busy !== null}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleApprove} loading={busy === 'approve'} disabled={busy !== null}>
              <Check data-icon="inline-start" /> {t('salesOrders.approve')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)}>
        <div style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>{t('salesOrders.rejectTitle')}</h3>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>
            {t('salesOrders.rejectReason')}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('salesOrders.enterReason')}
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box' }}
            autoFocus
          />
          {reasonError && <FieldError message={reasonError} />}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="secondary" onClick={() => setRejectOpen(false)} disabled={busy !== null}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleReject} loading={busy === 'reject'} disabled={busy !== null}>
              {t('salesOrders.confirmReject')}
            </Button>
          </div>
        </div>
      </Modal>
    </Drawer>
  )
}
