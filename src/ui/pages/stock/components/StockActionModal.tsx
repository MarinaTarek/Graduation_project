import { useState, useMemo } from 'react'
import { X, Check, AlertCircle, ArrowDownLeft, Sliders, Send, ShoppingBag } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { ALL_MOCK_REPS } from '@/ui/design-system/components/RecordFormDrawer'
import { clientsMockData } from '@/ui/pages/clients/mock-data'
import {
  batchesStore,
  stockMovementsStore,
  addStockMovement,
  addBatch,
  deriveProductStock,
  type MovementType,
} from '@/data/mock/stockDerived'
import { addAuditLog } from '@/data/mock/audit'
import { useStore } from '@/data/mock/store'
import { useT } from '@/lib/i18n'

export type StockActionType = 'receive' | 'adjustment' | 'transfer' | 'sell_out'

export interface StockActionModalProps {
  actionType: StockActionType | null
  onClose: () => void
  onSuccess: (message: string) => void
  role?: 'admin' | 'rep'
  currentUserName?: string
}

export function StockActionModal({
  actionType,
  onClose,
  onSuccess,
  role = 'admin',
  currentUserName = 'Alex Morgan',
}: StockActionModalProps) {
  const { t } = useT()
  const batches = useStore(batchesStore)
  const movements = useStore(stockMovementsStore)

  const productOptions = ['Bevato', 'Naviro D3 50,000 IU', 'Naviro D3 10,000 IU', 'Naviro D3 Drops', 'Navigen Product 5']

  const [productName, setProductName] = useState(productOptions[0])
  const [batchNo, setBatchNo] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [qty, setQty] = useState<number>(100)
  const [reason, setReason] = useState('')
  const [targetRep, setTargetRep] = useState(ALL_MOCK_REPS[0].name)
  const [targetCustomer, setTargetCustomer] = useState(clientsMockData[1].name) // Pharmacy default
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Derived stock for the selected product
  const currentDerived = useMemo(() => {
    return deriveProductStock(productName, movements, batches, role, currentUserName)
  }, [productName, movements, batches, role, currentUserName])

  // Batches for the selected product
  const productBatches = useMemo(() => {
    return batches.filter((b) => b.productName.toLowerCase() === productName.toLowerCase())
  }, [batches, productName])

  if (!actionType) return null

  const handleExecute = () => {
    setErrorMsg(null)

    if (qty <= 0 && actionType !== 'adjustment') {
      setErrorMsg(t('stock.modal.errQtyZero'))
      return
    }

    const today = new Date().toISOString().split('T')[0]

    // 1. RECEIVE STOCK
    if (actionType === 'receive') {
      if (!batchNo.trim()) {
        setErrorMsg(t('stock.modal.errBatchRequired'))
        return
      }
      if (!expiryDate) {
        setErrorMsg(t('stock.modal.errExpiryRequired'))
        return
      }

      // Check if batch exists or add it
      const existingBatch = batches.find(
        (b) => b.batch_no.toLowerCase() === batchNo.trim().toLowerCase() && b.productName === productName
      )

      if (!existingBatch) {
        addBatch({
          batch_no: batchNo.trim().toUpperCase(),
          productName,
          expiry_date: expiryDate,
          initial_qty: qty,
        })
      }

      addStockMovement({
        productName,
        batchNumber: batchNo.trim().toUpperCase(),
        quantity: qty,
        type: 'receipt',
        date: today,
        notes: 'Warehouse stock receipt',
      })

      addAuditLog({
        action: 'Stock Received',
        actor: currentUserName,
        time: 'Just now',
        details: `Received ${qty} units of ${productName} (Batch ${batchNo.trim().toUpperCase()})`,
      })

      onSuccess(t('stock.modal.receivedSuccess', { qty, product: productName }))
      onClose()
      return
    }

    // 2. ADJUSTMENT (Admin only)
    if (actionType === 'adjustment') {
      if (role !== 'admin') {
        setErrorMsg(t('stock.modal.errAdminOnly'))
        return
      }
      if (!reason.trim()) {
        setErrorMsg(t('stock.modal.errReasonRequired'))
        return
      }

      // Prevent negative stock: if negative adjustment, check warehouse stock
      if (qty < 0 && Math.abs(qty) > currentDerived.in_warehouse) {
        setErrorMsg(
          t('stock.modal.errCannotDeduct', {
            qty: Math.abs(qty),
            warehouse: currentDerived.in_warehouse,
          })
        )
        return
      }

      const selectedBatchNo = batchNo || (productBatches[0] ? productBatches[0].batch_no : 'BV-2401')

      addStockMovement({
        productName,
        batchNumber: selectedBatchNo,
        quantity: qty,
        type: 'adjustment',
        date: today,
        reason: reason.trim(),
      })

      addAuditLog({
        action: 'Stock Adjustment',
        actor: currentUserName,
        time: 'Just now',
        details: `Adjusted ${qty > 0 ? `+${qty}` : qty} units of ${productName} (${selectedBatchNo}). Reason: ${reason.trim()}`,
      })

      onSuccess(t('stock.modal.adjustedSuccess', { qty: qty > 0 ? `+${qty}` : qty, product: productName }))
      onClose()
      return
    }

    // 3. TRANSFER TO REP
    if (actionType === 'transfer') {
      // Prevent negative warehouse stock
      if (qty > currentDerived.in_warehouse) {
        setErrorMsg(
          t('stock.modal.errCannotTransfer', {
            qty,
            warehouse: currentDerived.in_warehouse,
          })
        )
        return
      }

      const repObj = ALL_MOCK_REPS.find((r) => r.name === targetRep)
      const selectedBatchNo = batchNo || (productBatches[0] ? productBatches[0].batch_no : 'BV-2401')

      addStockMovement({
        productName,
        batchNumber: selectedBatchNo,
        quantity: qty,
        type: 'transfer_rep',
        date: today,
        rep_id: repObj?.id || 'rep-alex',
        repName: targetRep,
        notes: `Buffer transfer to rep ${targetRep}`,
      })

      addAuditLog({
        action: 'Rep Transfer',
        actor: currentUserName,
        time: 'Just now',
        details: `Transferred ${qty} units of ${productName} to ${targetRep}`,
      })

      onSuccess(t('stock.modal.transferredSuccess', { qty, product: productName, rep: targetRep }))
      onClose()
      return
    }

    // 4. RECORD SELL-OUT
    if (actionType === 'sell_out') {
      if (qty > currentDerived.in_market) {
        setErrorMsg(
          t('stock.modal.errCannotSellOut', {
            qty,
            market: currentDerived.in_market,
          })
        )
        return
      }

      const selectedBatchNo = batchNo || (productBatches[0] ? productBatches[0].batch_no : 'BV-2401')

      addStockMovement({
        productName,
        batchNumber: selectedBatchNo,
        quantity: qty,
        type: 'sell_out',
        date: today,
        customerName: targetCustomer,
        notes: `Consumer sell-out from ${targetCustomer}`,
      })

      addAuditLog({
        action: 'Sell-out Recorded',
        actor: currentUserName,
        time: 'Just now',
        details: `Recorded sell-out of ${qty} units of ${productName} from ${targetCustomer}`,
      })

      onSuccess(t('stock.modal.sellOutSuccess', { qty, customer: targetCustomer }))
      onClose()
      return
    }
  }

  const titles: Record<StockActionType, { title: string; kicker: string; icon: React.ReactNode }> = {
    receive: { title: t('stock.modal.receiveTitle'), kicker: t('stock.modal.receiveKicker'), icon: <ArrowDownLeft size={20} /> },
    adjustment: { title: t('stock.modal.adjustmentTitle'), kicker: t('stock.modal.adjustmentKicker'), icon: <Sliders size={20} /> },
    transfer: { title: t('stock.modal.transferTitle'), kicker: t('stock.modal.transferKicker'), icon: <Send size={20} /> },
    sell_out: { title: t('stock.modal.sellOutTitle'), kicker: t('stock.modal.sellOutKicker'), icon: <ShoppingBag size={20} /> },
  }

  const config = titles[actionType]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <aside
        className="side-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100vh',
          width: '100%',
          maxWidth: '520px',
        }}
      >
        <div className="sheet-head" style={{ flexShrink: 0 }}>
          <div>
            <span className="eyebrow">{config.kicker}</span>
            <h2>{config.title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label={t('common.close')}>
            <X />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                margin: '16px 0',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--rose-text, #ef4444)',
                fontSize: '13px',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="form-grid" style={{ marginTop: '16px' }}>
            {/* Product */}
            <label className="full">
              {t('stock.modal.productLabel')}
              <select value={productName} onChange={(e) => setProductName(e.target.value)}>
                {productOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            {/* Warehouse stock info card */}
            <div
              className="full"
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--surface-raised, rgba(0,0,0,0.02))',
                border: '1px solid var(--border-soft)',
                fontSize: '12px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{t('stock.modal.warehouseStock', { count: currentDerived.in_warehouse.toLocaleString() })}</span>
              <span>{t('stock.modal.inMarket', { count: currentDerived.in_market.toLocaleString() })}</span>
            </div>

            {/* RECEIVE SPECIFICS */}
            {actionType === 'receive' && (
              <>
                <label>
                  {t('stock.modal.batchNumberLabel')}
                  <input
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    placeholder={t('stock.modal.batchPlaceholder')}
                  />
                </label>
                <label>
                  {t('stock.modal.expiryDateLabel')}
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </label>
                <label className="full">
                  {t('stock.modal.unitsReceivedLabel')}
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                  />
                </label>
              </>
            )}

            {/* ADJUSTMENT SPECIFICS */}
            {actionType === 'adjustment' && (
              <>
                <label>
                  {t('stock.modal.batchLabel')}
                  <select value={batchNo} onChange={(e) => setBatchNo(e.target.value)}>
                    <option value="">{t('stock.modal.selectBatch')}</option>
                    {productBatches.map((b) => (
                      <option key={b.id} value={b.batch_no}>
                        {b.batch_no} (Exp: {b.expiry_date})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t('stock.modal.qtyAdjustmentLabel')}
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    placeholder={t('stock.modal.qtyAdjustmentPlaceholder')}
                  />
                </label>
                <label className="full">
                  {t('stock.modal.reasonLabel')}
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t('stock.modal.reasonPlaceholder')}
                  />
                </label>
              </>
            )}

            {/* TRANSFER SPECIFICS */}
            {actionType === 'transfer' && (
              <>
                <label>
                  {t('stock.modal.assignRepLabel')}
                  <select value={targetRep} onChange={(e) => setTargetRep(e.target.value)}>
                    {ALL_MOCK_REPS.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name} ({r.region})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t('stock.modal.batchLabel')}
                  <select value={batchNo} onChange={(e) => setBatchNo(e.target.value)}>
                    <option value="">{t('stock.modal.earliestFefo')}</option>
                    {productBatches.map((b) => (
                      <option key={b.id} value={b.batch_no}>
                        {b.batch_no}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="full">
                  {t('stock.modal.unitsToTransferLabel')}
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                  />
                </label>
              </>
            )}

            {/* SELL-OUT SPECIFICS */}
            {actionType === 'sell_out' && (
              <>
                <label className="full">
                  {t('stock.modal.customerLabel')}
                  <select value={targetCustomer} onChange={(e) => setTargetCustomer(e.target.value)}>
                    {clientsMockData.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.specialty})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="full">
                  {t('stock.modal.unitsSoldLabel')}
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                  />
                </label>
              </>
            )}
          </div>
        </div>

        <div
          className="sheet-actions"
          style={{
            position: 'sticky',
            bottom: 0,
            background: 'var(--surface, #ffffff)',
            padding: '16px 24px',
            borderTop: '1px solid var(--border-soft)',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={handleExecute}>
            <Check size={16} style={{ marginRight: '6px' }} /> {t('stock.modal.confirmAction')}
          </Button>
        </div>
      </aside>
    </div>
  )
}
