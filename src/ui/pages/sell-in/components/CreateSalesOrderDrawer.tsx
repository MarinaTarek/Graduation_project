import { useMemo, useState } from 'react'
import { Check, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { FieldError } from '@/ui/design-system/components/FieldError'
import { ALL_MOCK_REPS } from '@/ui/design-system/components/RecordFormDrawer'
import { useAuth } from '@/lib/auth'
import { useT, localizedName } from '@/lib/i18n'
import { formatCurrency } from '@/lib/format'
import { useStore } from '@/data/mock/store'
import { customersStore } from '@/data/mock/customers'
import { productsStore } from '@/data/mock/products'
import { addSalesOrder, type SalesOrder, type SalesOrderDiscountType } from '@/data/mock/sales-orders'
import { translateSalesOrderError } from './sales-order-errors'

interface OrderLine {
  key: number
  productCode: string
  quantity: string
}

let lineKey = 0
const newLine = (): OrderLine => ({ key: ++lineKey, productCode: '', quantity: '' })

interface FormErrors {
  customer?: string
  rep?: string
  discount?: string
  general?: string
  lines?: Record<number, string>
}

export function CreateSalesOrderDrawer({
  isOpen = true,
  onClose,
  onSaved,
}: {
  isOpen?: boolean
  onClose: () => void
  onSaved: (order: SalesOrder) => void
}) {
  const { t, lang } = useT()
  const { user } = useAuth()
  const customers = useStore(customersStore)
  const products = useStore(productsStore)

  const availableCustomers = useMemo(
    () => customers.filter((c) => c.id && !c.deleted_at && c.active !== false),
    [customers],
  )

  const [customerId, setCustomerId] = useState('')
  const [repId, setRepId] = useState('')
  const [lines, setLines] = useState<OrderLine[]>([newLine()])
  const [discountType, setDiscountType] = useState<'none' | SalesOrderDiscountType>('none')
  const [discountValue, setDiscountValue] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  // Reps create orders for themselves; admins pick any representative.
  const isRep = user?.role !== 'admin'
  const ownRep = useMemo(() => {
    if (!isRep || !user) return null
    return (
      ALL_MOCK_REPS.find(
        (r) => r.id === user.id || r.name.toLowerCase() === user.name.toLowerCase(),
      ) ?? { id: user.id, name: user.name, region: '' }
    )
  }, [isRep, user])

  const priceOf = (code: string): number | null => {
    const product = products.find((p) => p.code === code)
    const price = product ? Number(product.price) : NaN
    return product && Number.isFinite(price) && price >= 0 ? price : null
  }

  const lineTotal = (line: OrderLine): number | null => {
    const qty = Number(line.quantity)
    const price = priceOf(line.productCode)
    if (!Number.isInteger(qty) || qty <= 0 || price === null) return null
    return qty * price
  }

  const subtotal = lines.reduce((sum, line) => sum + (lineTotal(line) ?? 0), 0)

  // Recomputed on every item/quantity/discount change so the summary always
  // reflects the current lines. `error` blocks submission until resolved.
  const discount = useMemo((): { amount: number; percent: number | null; error: string | null } => {
    if (discountType === 'none' || discountValue.trim() === '') {
      return { amount: 0, percent: null, error: null }
    }
    const value = Number(discountValue)
    if (!Number.isFinite(value) || value < 0) {
      return { amount: 0, percent: null, error: t('salesOrders.discountNonNegative') }
    }
    if (discountType === 'percentage' && value > 100) {
      return { amount: 0, percent: null, error: t('salesOrders.discountPercentRange') }
    }
    if (discountType === 'fixed' && value > subtotal) {
      return { amount: 0, percent: null, error: t('salesOrders.discountExceedsSubtotal') }
    }
    const amount =
      discountType === 'percentage'
        ? Math.round(subtotal * (value / 100) * 100) / 100
        : Math.round(value * 100) / 100
    return { amount, percent: discountType === 'percentage' ? value : null, error: null }
  }, [discountType, discountValue, subtotal, t])

  const total = Math.round((subtotal - discount.amount) * 100) / 100

  const updateLine = (key: number, patch: Partial<OrderLine>) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)))
    setErrors((prev) => {
      if (!prev.lines) return prev
      const { [key]: _cleared, ...rest } = prev.lines
      return { ...prev, lines: Object.keys(rest).length ? rest : undefined }
    })
  }

  const removeLine = (key: number) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((line) => line.key !== key) : prev))
  }

  const handleSubmit = () => {
    if (submitting) return

    const nextErrors: FormErrors = {}
    const lineErrors: Record<number, string> = {}

    if (!customerId) nextErrors.customer = t('salesOrders.selectCustomerRequired')

    const rep = isRep ? ownRep : ALL_MOCK_REPS.find((r) => r.id === repId) ?? null
    if (!rep) nextErrors.rep = t('salesOrders.selectRepRequired')

    const filledLines = lines.filter((line) => line.productCode || line.quantity)
    if (!filledLines.length) nextErrors.general = t('salesOrders.addAtLeastOne')

    for (const line of filledLines) {
      if (!line.productCode) {
        lineErrors[line.key] = t('salesOrders.selectProduct')
        continue
      }
      const qty = Number(line.quantity)
      if (!Number.isInteger(qty) || qty <= 0) {
        lineErrors[line.key] = t('salesOrders.invalidQuantity')
        continue
      }
      if (priceOf(line.productCode) === null) {
        lineErrors[line.key] = t('salesOrders.invalidPrice')
      }
    }
    if (Object.keys(lineErrors).length) nextErrors.lines = lineErrors

    if (discount.error) nextErrors.discount = discount.error

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length || !rep) return

    setSubmitting(true)
    try {
      const hasDiscount = discountType !== 'none' && discountValue.trim() !== '' && !discount.error
      const order = addSalesOrder({
        customerId,
        repId: rep.id,
        repName: rep.name,
        items: filledLines.map((line) => ({
          productCode: line.productCode,
          quantity: Number(line.quantity),
        })),
        discount: hasDiscount
          ? { type: discountType as SalesOrderDiscountType, value: Number(discountValue) }
          : undefined,
      })
      // Parent closes the drawer on success; submitting stays true so a
      // stray second click cannot create a duplicate order.
      onSaved(order)
    } catch (err) {
      setSubmitting(false)
      setErrors({
        general: translateSalesOrderError(
          err instanceof Error ? err.message : String(err),
          t,
        ),
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <aside className="side-sheet side-sheet--wide" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <span className="eyebrow">{t('sellIn.eyebrow')}</span>
            <h2>{t('salesOrders.createTitle')}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label={t('common.close')}>
            <X />
          </button>
        </div>

        {errors.general && (
          <div style={{ margin: '0 24px 16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--rose-text)', fontSize: '13px' }}>
            {errors.general}
          </div>
        )}

        <div className="form-grid">
          <label>
            {t('salesOrders.customer')} *
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value)
                setErrors((prev) => ({ ...prev, customer: undefined }))
              }}
            >
              <option value="">{t('salesOrders.selectCustomer')}</option>
              {availableCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {localizedName(c, lang)}
                </option>
              ))}
            </select>
          </label>
          <FieldError message={errors.customer} />

          {isRep ? (
            <div className="full">
              <label style={{ display: 'block', marginBottom: '6px' }}>{t('salesOrders.representative')} *</label>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-soft)',
                  background: 'var(--surface-raised)',
                  opacity: 0.8,
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading-text)' }}>
                  {ownRep?.name}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>{t('salesOrders.autoAssignedYou')}</span>
              </div>
            </div>
          ) : (
            <label>
              {t('salesOrders.representative')} *
              <select
                value={repId}
                onChange={(e) => {
                  setRepId(e.target.value)
                  setErrors((prev) => ({ ...prev, rep: undefined }))
                }}
              >
                <option value="">{t('salesOrders.selectRepresentative')}</option>
                {ALL_MOCK_REPS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <FieldError message={errors.rep} />

          <div className="full">
            <label style={{ display: 'block', marginBottom: '6px' }}>{t('salesOrders.products')} *</label>
            {lines.map((line) => {
              const total = lineTotal(line)
              return (
                <div key={line.key} className="so-line-row">
                  <select
                    className="so-line-select"
                    value={line.productCode}
                    onChange={(e) => updateLine(line.key, { productCode: e.target.value })}
                    aria-label={t('salesOrders.product')}
                  >
                    <option value="">{t('salesOrders.selectProduct')}</option>
                    {products.map((p) => {
                      const hasPrice = priceOf(p.code) !== null
                      const label = localizedName(p, lang)
                      return (
                        <option key={p.code} value={p.code} disabled={!hasPrice}>
                          {hasPrice ? `${label} — ${formatCurrency(Number(p.price), 'EGP', lang)}` : `${label} — ${formatCurrency(undefined, 'EGP', lang)}`}
                        </option>
                      )
                    })}
                  </select>
                  <input
                    className="so-line-qty"
                    type="number"
                    min={1}
                    step={1}
                    placeholder={t('salesOrders.quantity')}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                    aria-label={t('salesOrders.quantity')}
                  />
                  <span className="so-line-total" style={{ fontSize: '12px', color: 'var(--muted-text)', whiteSpace: 'nowrap' }}>
                    {total !== null ? formatCurrency(total, 'EGP', lang) : '—'}
                  </span>
                  <button
                    type="button"
                    className="icon-button so-line-del"
                    onClick={() => removeLine(line.key)}
                    disabled={lines.length === 1}
                    aria-label={t('salesOrders.remove')}
                  >
                    <Trash2 />
                  </button>
                  {errors.lines?.[line.key] && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <FieldError message={errors.lines[line.key]} />
                    </div>
                  )}
                </div>
              )
            })}
            <Button variant="secondary" onClick={() => setLines((prev) => [...prev, newLine()])}>
              <Plus data-icon="inline-start" /> {t('salesOrders.addLine')}
            </Button>
          </div>

          <div className="full so-discount-row">
            <label>
              {t('salesOrders.discount')}
              <select
                value={discountType}
                onChange={(e) => {
                  setDiscountType(e.target.value as 'none' | SalesOrderDiscountType)
                  setDiscountValue('')
                  setErrors((prev) => ({ ...prev, discount: undefined }))
                }}
              >
                <option value="none">{t('salesOrders.discountNone')}</option>
                <option value="percentage">{t('salesOrders.discountPercentage')}</option>
                <option value="fixed">{t('salesOrders.discountFixed')}</option>
              </select>
            </label>
            {discountType !== 'none' && (
              <label>
                {t('salesOrders.discountValueLabel')} *
                <input
                  type="number"
                  min={0}
                  max={discountType === 'percentage' ? 100 : undefined}
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => {
                    setDiscountValue(e.target.value)
                    setErrors((prev) => ({ ...prev, discount: undefined }))
                  }}
                  placeholder={t('salesOrders.discountValuePlaceholder')}
                />
                <FieldError message={errors.discount ?? discount.error} />
              </label>
            )}
          </div>

          <div
            className="full"
            style={{
              borderTop: '1px solid var(--border-soft)',
              paddingTop: '12px',
              marginTop: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px', color: 'var(--muted-text)' }}>
              <span>{t('salesOrders.subtotal')}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{formatCurrency(subtotal, 'EGP', lang)}</span>
            </div>
            {discount.amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px', color: 'var(--muted-text)' }}>
                <span>
                  {t('salesOrders.discount')}
                  {discount.percent !== null ? ` (${discount.percent}%)` : ''}
                </span>
                <span style={{ whiteSpace: 'nowrap', color: 'var(--green-text, #16a34a)' }}>
                  −{formatCurrency(discount.amount, 'EGP', lang)}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '14px' }}>
              <span style={{ fontWeight: 600 }}>{t('salesOrders.total')}</span>
              <strong style={{ whiteSpace: 'nowrap' }}>{formatCurrency(total, 'EGP', lang)}</strong>
            </div>
          </div>
        </div>

        <div className="sheet-actions">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting} loading={submitting}>
            <Check data-icon="inline-start" /> {submitting ? t('salesOrders.creating') : t('salesOrders.create')}
          </Button>
        </div>
      </aside>
    </div>
  )
}
