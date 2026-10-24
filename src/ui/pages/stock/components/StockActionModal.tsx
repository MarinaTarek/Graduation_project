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
      setErrorMsg('Quantity must be greater than 0.')
      return
    }

    const today = new Date().toISOString().split('T')[0]

    // 1. RECEIVE STOCK
    if (actionType === 'receive') {
      if (!batchNo.trim()) {
        setErrorMsg('Batch number is required.')
        return
      }
      if (!expiryDate) {
        setErrorMsg('Expiry date is required.')
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

      onSuccess(`Received ${qty} units of ${productName}`)
      onClose()
      return
    }

    // 2. ADJUSTMENT (Admin only)
    if (actionType === 'adjustment') {
      if (role !== 'admin') {
        setErrorMsg('Only administrators can perform stock adjustments.')
        return
      }
      if (!reason.trim()) {
        setErrorMsg('A valid reason is required for audit compliance.')
        return
      }

      // Prevent negative stock: if negative adjustment, check warehouse stock
      if (qty < 0 && Math.abs(qty) > currentDerived.in_warehouse) {
        setErrorMsg(
          `Cannot deduct ${Math.abs(qty)} units: only ${currentDerived.in_warehouse} units currently in warehouse.`
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

      onSuccess(`Adjusted ${qty > 0 ? `+${qty}` : qty} units of ${productName}`)
      onClose()
      return
    }

    // 3. TRANSFER TO REP
    if (actionType === 'transfer') {
      // Prevent negative warehouse stock
      if (qty > currentDerived.in_warehouse) {
        setErrorMsg(
          `Cannot transfer ${qty} units: only ${currentDerived.in_warehouse} units currently in warehouse.`
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

      onSuccess(`Transferred ${qty} units of ${productName} to ${targetRep}`)
      onClose()
      return
    }

    // 4. RECORD SELL-OUT
    if (actionType === 'sell_out') {
      if (qty > currentDerived.in_market) {
        setErrorMsg(
          `Cannot record sell-out of ${qty} units: only ${currentDerived.in_market} units currently held in market/pharmacies.`
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

      onSuccess(`Recorded sell-out of ${qty} units from ${targetCustomer}`)
      onClose()
      return
    }
  }

  const titles: Record<StockActionType, { title: string; kicker: string; icon: React.ReactNode }> = {
    receive: { title: 'Receive Stock', kicker: 'INBOUND SHIPMENT', icon: <ArrowDownLeft size={20} /> },
    adjustment: { title: 'Stock Adjustment', kicker: 'AUDIT RECONCILIATION', icon: <Sliders size={20} /> },
    transfer: { title: 'Transfer to Rep', kicker: 'FIELD CUSTODY BUFFER', icon: <Send size={20} /> },
    sell_out: { title: 'Record Sell-out', kicker: 'DISPENSARY CONSUMPTION', icon: <ShoppingBag size={20} /> },
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
          <button className="icon-button" onClick={onClose} aria-label="Close">
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
              Product
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
              <span>Warehouse Stock: <strong>{currentDerived.in_warehouse.toLocaleString()}</strong> units</span>
              <span>In Market: <strong>{currentDerived.in_market.toLocaleString()}</strong> units</span>
            </div>

            {/* RECEIVE SPECIFICS */}
            {actionType === 'receive' && (
              <>
                <label>
                  Batch Number *
                  <input
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    placeholder="e.g. BV-2404"
                  />
                </label>
                <label>
                  Expiry Date *
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </label>
                <label className="full">
                  Units Received *
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
                  Batch
                  <select value={batchNo} onChange={(e) => setBatchNo(e.target.value)}>
                    <option value="">Select batch...</option>
                    {productBatches.map((b) => (
                      <option key={b.id} value={b.batch_no}>
                        {b.batch_no} (Exp: {b.expiry_date})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantity Adjustment (+/-) *
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    placeholder="+50 or -30"
                  />
                </label>
                <label className="full">
                  Reason for Adjustment (Required) *
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason required: Physical recount discrepancy, damaged stock, QC quarantine..."
                  />
                </label>
              </>
            )}

            {/* TRANSFER SPECIFICS */}
            {actionType === 'transfer' && (
              <>
                <label>
                  Assign to Representative
                  <select value={targetRep} onChange={(e) => setTargetRep(e.target.value)}>
                    {ALL_MOCK_REPS.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name} ({r.region})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Batch
                  <select value={batchNo} onChange={(e) => setBatchNo(e.target.value)}>
                    <option value="">Earliest FEFO batch</option>
                    {productBatches.map((b) => (
                      <option key={b.id} value={b.batch_no}>
                        {b.batch_no}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="full">
                  Units to Transfer *
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
                  Pharmacy / Customer
                  <select value={targetCustomer} onChange={(e) => setTargetCustomer(e.target.value)}>
                    {clientsMockData.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.specialty})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="full">
                  Units Sold to Patients *
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
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExecute}>
            <Check size={16} style={{ marginRight: '6px' }} /> Confirm Action
          </Button>
        </div>
      </aside>
    </div>
  )
}
