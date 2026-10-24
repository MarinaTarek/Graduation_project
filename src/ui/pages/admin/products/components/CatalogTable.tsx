import { useState } from 'react'
import { Pencil, Check, X, Settings2 } from 'lucide-react'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { Button } from '@/ui/design-system/components/Button'
import { Toast } from '@/ui/design-system/components/Toast'
import { FieldError } from '@/ui/design-system/components/FieldError'
import { useAuth } from '@/lib/auth'
import { useT } from '@/lib/i18n'
import { formatCurrency } from '@/lib/format'
import { updateProductPrice } from '@/lib/productService'
import { productsStore } from '@/data/mock/products'
import { useStore } from '@/data/mock/store'
import { type CatalogProduct } from '../mock-data'

export function CatalogTable() {
  const { t } = useT()
  const { role, user } = useAuth()
  const products = useStore(productsStore)
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [inlinePrice, setInlinePrice] = useState<string>('')
  const [inlineError, setInlineError] = useState<string | null>(null)

  // Edit product form state
  const [modalProduct, setModalProduct] = useState<CatalogProduct | null>(null)
  const [modalPrice, setModalPrice] = useState<string>('')
  const [modalError, setModalError] = useState<string | null>(null)

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    window.setTimeout(() => setToastMessage(null), 3000)
  }

  // --- Inline Edit Handlers ---
  const handleStartInlineEdit = (item: CatalogProduct) => {
    if (role !== 'admin') return
    setEditingCode(item.code)
    setInlinePrice(String(item.price ?? ''))
    setInlineError(null)
  }

  const handleCancelInlineEdit = () => {
    setEditingCode(null)
    setInlinePrice('')
    setInlineError(null)
  }

  const handleSaveInlineEdit = (item: CatalogProduct) => {
    // Component-level role check
    if (role !== 'admin') {
      setInlineError('Not allowed: Only admins can change prices')
      return
    }

    const num = Number(inlinePrice)
    if (inlinePrice.trim() === '' || isNaN(num) || num < 0) {
      setInlineError('Price must be a number >= 0')
      return
    }

    try {
      const { oldPrice, newPrice } = updateProductPrice({
        productIdOrCode: item.code,
        newPrice: num,
        role,
        userName: user?.name || 'Admin',
      })

      setEditingCode(null)
      setInlineError(null)
      showToast(`Price changed: ${item.name} ${oldPrice} -> ${newPrice} by ${user?.name || 'Admin'}`)
    } catch (err: any) {
      setInlineError(err.message || 'Failed to update price')
    }
  }

  // --- Edit Product Form Modal Handlers ---
  const handleOpenEditModal = (item: CatalogProduct) => {
    if (role !== 'admin') return
    setModalProduct(item)
    setModalPrice(String(item.price ?? ''))
    setModalError(null)
  }

  const handleCloseEditModal = () => {
    setModalProduct(null)
    setModalPrice('')
    setModalError(null)
  }

  const handleSaveEditModal = () => {
    if (!modalProduct) return
    // Component-level role check
    if (role !== 'admin') {
      setModalError('Not allowed: Only admins can change prices')
      return
    }

    const num = Number(modalPrice)
    if (modalPrice.trim() === '' || isNaN(num) || num < 0) {
      setModalError('Price is required and must be 0 or greater')
      return
    }

    try {
      const { oldPrice, newPrice } = updateProductPrice({
        productIdOrCode: modalProduct.code,
        newPrice: num,
        role,
        userName: user?.name || 'Admin',
      })

      handleCloseEditModal()
      showToast(`Price changed: ${modalProduct.name} ${oldPrice} -> ${newPrice} by ${user?.name || 'Admin'}`)
    } catch (err: any) {
      setModalError(err.message || 'Failed to update price')
    }
  }

  const isAdmin = role === 'admin'

  return (
    <>
      <div className="collection-list">
        {products.map((item) => {
          const isInlineEditing = editingCode === item.code

          return (
            <div
              key={item.code}
              className="collection-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                padding: '14px 18px',
              }}
            >
              {/* Product Info */}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '15px' }}>{item.code} · {item.name}</strong>
                  <StatusPill status={item.status} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '2px', fontSize: '12px', color: 'var(--muted-text)' }}>
                  <span>{item.category} · {item.standardPack}</span>
                  {item.updated_at && (
                    <span style={{ opacity: 0.8 }}>
                      {t('admin.catalog.updatedTime', { time: new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
                    </span>
                  )}
                </div>
              </div>

              {/* Price & Actions Area */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isInlineEditing ? (
                  // Admin: Active inline edit
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted-text)' }}>EGP</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={inlinePrice}
                        onChange={(e) => setInlinePrice(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveInlineEdit(item)
                          if (e.key === 'Escape') handleCancelInlineEdit()
                        }}
                        style={{
                          width: '90px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-soft)',
                          background: 'var(--surface)',
                          color: 'var(--heading-text)',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveInlineEdit(item)}
                        title={t('admin.catalog.savePrice')}
                        style={{
                          background: 'var(--ocean)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelInlineEdit}
                        title={t('common.cancel')}
                        style={{
                          background: 'var(--surface-raised)',
                          color: 'var(--muted-text)',
                          border: '1px solid var(--border-soft)',
                          borderRadius: '6px',
                          padding: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <X style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                    {inlineError && <FieldError message={inlineError} />}
                  </div>
                ) : (
                  // Display mode: Admin (editable) vs Rep (read-only)
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isAdmin ? (
                      <>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '15px',
                            color: 'var(--heading-text)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: 'var(--surface-raised)',
                            border: '1px solid var(--border-soft)',
                          }}
                        >
                          {formatCurrency(item.price)}
                        </div>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => handleStartInlineEdit(item)}
                          title={t('admin.catalog.inlineEditPrice')}
                          aria-label={t('admin.catalog.inlineEditPrice')}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-soft)',
                            background: 'var(--surface)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--muted-text)',
                          }}
                        >
                          <Pencil style={{ width: '14px', height: '14px' }} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => handleOpenEditModal(item)}
                          title={t('admin.catalog.editProductFormulation')}
                          aria-label={t('admin.catalog.editProductFormulation')}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-soft)',
                            background: 'var(--surface)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--muted-text)',
                          }}
                        >
                          <Settings2 style={{ width: '14px', height: '14px' }} />
                        </button>
                      </>
                    ) : (
                      // Rep: sees prices read-only (no edit button, input disabled, tooltip)
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="text"
                          disabled
                          value={formatCurrency(item.price)}
                          title={t('admin.catalog.onlyAdminsChangePrices')}
                          style={{
                            width: '110px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-soft)',
                            background: 'var(--surface-raised)',
                            color: 'var(--muted-text)',
                            cursor: 'not-allowed',
                            fontSize: '14px',
                            fontWeight: 700,
                            textAlign: 'center',
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit Product Modal Form (Admin only) */}
      {modalProduct && isAdmin && (
        <div className="modal-backdrop" onClick={handleCloseEditModal}>
          <div
            className="dialog-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              borderRadius: '20px',
              background: 'var(--surface)',
              boxShadow: 'var(--shadow-raised)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <span className="eyebrow">{t('admin.catalog.editProductEyebrow')}</span>
                <h3 style={{ margin: '4px 0 0', fontSize: '18px', color: 'var(--heading-text)' }}>
                  {modalProduct.name}
                </h3>
              </div>
              <button
                className="icon-button"
                onClick={handleCloseEditModal}
                aria-label={t('common.close')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <X style={{ width: '18px', height: '18px', color: 'var(--muted-text)' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)', marginBottom: '4px' }}>
                  {t('admin.catalog.productCodeCategory')}
                </label>
                <input
                  type="text"
                  disabled
                  value={`${modalProduct.code} · ${modalProduct.category}`}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--surface-raised)',
                    color: 'var(--muted-text)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)', marginBottom: '4px' }}>
                  {t('admin.catalog.standardPack')}
                </label>
                <input
                  type="text"
                  disabled
                  value={modalProduct.standardPack}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--surface-raised)',
                    color: 'var(--muted-text)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--heading-text)', marginBottom: '4px' }}>
                  {t('admin.catalog.priceEgp')}
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '8px',
                    border: `1px solid ${modalError ? 'var(--rose-text)' : 'var(--border-soft)'}`,
                    background: 'var(--surface)',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      padding: '8px 12px',
                      background: 'var(--surface-raised)',
                      borderRight: '1px solid var(--border-soft)',
                      color: 'var(--muted-text)',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    EGP
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={modalPrice}
                    onChange={(e) => setModalPrice(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      flex: 1,
                      background: 'transparent',
                      color: 'var(--heading-text)',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                    autoFocus
                  />
                </div>
                {modalError && <FieldError message={modalError} />}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
              <Button variant="secondary" onClick={handleCloseEditModal}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" onClick={handleSaveEditModal}>
                <Check data-icon="inline-start" /> {t('admin.catalog.saveChanges')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100 }}>
          <Toast message={toastMessage} />
        </div>
      )}
    </>
  )
}
