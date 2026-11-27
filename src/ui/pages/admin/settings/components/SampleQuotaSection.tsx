'use client'

import { useState } from 'react'
import {
  Boxes,
  ShieldAlert,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
} from 'lucide-react'
import { useT } from '@/lib/i18n'
import { useStore } from '@/data/mock/store'
import {
  doctorQuotaPoliciesStore,
  sampleQuotaOverridesStore,
  sampleDistributionRequestsStore,
  upsertDoctorQuotaPolicy,
  reviewQuotaOverride,
  type DoctorQuotaPolicy,
  type SampleQuotaOverride,
} from '@/data/mock/sampleQuota'
import { productsStore } from '@/data/mock/products'
import { customersStore } from '@/data/mock/customers'
import { useAuth } from '@/lib/auth/AuthProvider'

export function SampleQuotaSection() {
  const { t, lang } = useT()
  const isAr = lang === 'ar'
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const policies = useStore(doctorQuotaPoliciesStore)
  const overrides = useStore(sampleQuotaOverridesStore)
  const products = useStore(productsStore)
  const customers = useStore(customersStore)

  const [activeTab, setActiveTab] = useState<'policies' | 'overrides'>('policies')
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Add policy state
  const [selectedDoctorId, setSelectedDoctorId] = useState(customers[0]?.id || 'c-1')
  const [selectedProductCode, setSelectedProductCode] = useState(products[0]?.code || 'PRD-01')
  const [allowedQty, setAllowedQty] = useState(20)
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly' | 'semiannual'>('monthly')

  const pendingOverrides = overrides.filter((o) => o.status === 'pending')

  const handleAddPolicy = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const doc = customers.find((c) => c.id === selectedDoctorId)
    const prod = products.find((p) => p.code === selectedProductCode)

    try {
      upsertDoctorQuotaPolicy(
        {
          doctorId: selectedDoctorId,
          doctorName: doc?.name || selectedDoctorId,
          productId: selectedProductCode,
          productName: prod?.name || selectedProductCode,
          allowedQuantity: Number(allowedQty),
          periodType,
          startDate: '2026-10-01',
          endDate: '2026-12-31',
          status: 'active',
          createdBy: user?.id || 'u-admin-1',
        },
        user || 'Admin'
      )
      setSuccessMsg(isAr ? 'تم حفظ حصة الطبيب بنجاح' : 'Doctor quota policy saved successfully.')
      setIsAddOpen(false)
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const handleReviewOverride = (overrideId: string, action: 'approve' | 'reject') => {
    setErrorMsg(null)
    try {
      reviewQuotaOverride(overrideId, action, user || 'Admin')
      setSuccessMsg(
        isAr
          ? action === 'approve'
            ? 'تم اعتماد التجاوز بنجاح'
            : 'تم رفض التجاوز'
          : `Override request ${action}d successfully.`
      )
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const filteredPolicies = policies.filter((p) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (p.doctorName || p.doctorId).toLowerCase().includes(term) ||
      (p.productName || p.productId).toLowerCase().includes(term)
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'policies' ? 'none' : '1px solid var(--border-soft)',
              background: activeTab === 'policies' ? 'var(--navy-primary)' : 'var(--surface-raised)',
              color: activeTab === 'policies' ? '#fff' : 'var(--body-text)',
            }}
          >
            {isAr ? 'حصص الأطباء المعتمدة' : 'Doctor Quota Policies'} ({policies.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('overrides')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'overrides' ? 'none' : '1px solid var(--border-soft)',
              background: activeTab === 'overrides' ? 'var(--navy-primary)' : 'var(--surface-raised)',
              color: activeTab === 'overrides' ? '#fff' : 'var(--body-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isAr ? 'طلبات التجاوز الاستثنائية' : 'Quota Overrides'}
            {pendingOverrides.length > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '11px',
                }}
              >
                {pendingOverrides.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'policies' && isAdmin && (
          <button
            type="button"
            onClick={() => setIsAddOpen(!isAddOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'var(--navy-primary)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            {isAr ? 'إضافة حصة طبيب جديدة' : 'Add Doctor Quota'}
          </button>
        )}
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} />
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#dcfce7', color: '#166534', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {/* Add Policy Form Drawer / Panel */}
      {isAddOpen && (
        <form
          onSubmit={handleAddPolicy}
          style={{
            background: 'var(--surface-raised)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border-soft)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--heading-text)' }}>
            {isAr ? 'تحديد حصة عينات للطبيب حسب الصنف' : 'Configure Product Quota for Doctor'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)', display: 'block', marginBottom: '4px' }}>
                {isAr ? 'الطبيب' : 'Doctor'}
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-soft)', background: 'var(--surface)' }}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)', display: 'block', marginBottom: '4px' }}>
                {isAr ? 'الصنف الدوائي' : 'Product'}
              </label>
              <select
                value={selectedProductCode}
                onChange={(e) => setSelectedProductCode(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-soft)', background: 'var(--surface)' }}
              >
                {products.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)', display: 'block', marginBottom: '4px' }}>
                {isAr ? 'الكمية المسموحة' : 'Allowed Units'}
              </label>
              <input
                type="number"
                min="1"
                value={allowedQty}
                onChange={(e) => setAllowedQty(Number(e.target.value))}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-soft)', background: 'var(--surface)' }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)', display: 'block', marginBottom: '4px' }}>
                {isAr ? 'فترة الحصة' : 'Quota Period'}
              </label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as any)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-soft)', background: 'var(--surface)' }}
              >
                <option value="monthly">{isAr ? 'شهرياً' : 'Monthly'}</option>
                <option value="quarterly">{isAr ? 'كل 3 أشهر (ربع سنوي)' : 'Quarterly'}</option>
                <option value="semiannual">{isAr ? 'كل 6 أشهر (نصف سنوي)' : 'Semi-annual'}</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-soft)', background: 'transparent', cursor: 'pointer' }}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--navy-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
            >
              {isAr ? 'حفظ الحصة' : 'Save Quota'}
            </button>
          </div>
        </form>
      )}

      {/* Policies View */}
      {activeTab === 'policies' && (
        <div style={{ background: 'var(--surface-raised)', borderRadius: '12px', border: '1px solid var(--border-soft)', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} color="var(--muted-text)" />
            <input
              type="text"
              placeholder={isAr ? 'البحث عن طبيب أو صنف...' : 'Filter by doctor or product...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', textAlign: isAr ? 'right' : 'left' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--muted-text)', fontWeight: 600 }}>{isAr ? 'الطبيب' : 'Doctor'}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--muted-text)', fontWeight: 600 }}>{isAr ? 'الصنف' : 'Product'}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--muted-text)', fontWeight: 600 }}>{isAr ? 'الحصة' : 'Quota'}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--muted-text)', fontWeight: 600 }}>{isAr ? 'الفترة' : 'Period'}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--muted-text)', fontWeight: 600 }}>{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--heading-text)' }}>
                      {p.doctorName || p.doctorId}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{p.productName || p.productId}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--navy-primary)' }}>
                      {p.allowedQuantity} {isAr ? 'وحدة' : 'units'}
                    </td>
                    <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{p.periodType}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: p.status === 'active' ? '#dcfce7' : '#f1f5f9',
                          color: p.status === 'active' ? '#166534' : '#475569',
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overrides View */}
      {activeTab === 'overrides' && (
        <div style={{ background: 'var(--surface-raised)', borderRadius: '12px', border: '1px solid var(--border-soft)', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-soft)' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--heading-text)' }}>
              {isAr ? 'سجل طلبات تجاوز الحصة الإدارية' : 'Administrative Quota Overrides Queue'}
            </h4>
          </div>
          {overrides.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-text)', fontSize: '13px' }}>
              {isAr ? 'لا توجد طلبات تجاوز حالياً' : 'No quota override requests found.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', textAlign: isAr ? 'right' : 'left' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--muted-text)', fontWeight: 600 }}>{isAr ? 'الطبيب' : 'Doctor'}</th>
                    <th style={{ padding: '12px 16px', color: 'var(--muted-text)', fontWeight: 600 }}>{isAr ? 'المندوب' : 'Rep'}</th>
                    <th style={{ padding: '12px 16px', color: 'var(--muted-text)', fontWeight: 600 }}>{isAr ? 'الصنف' : 'Product'}</th>
                    <th style={{ padding: '12px 16px', color: 'var(--muted-text)', fontWeight: 600 }}>{isAr ? 'الكمية المطلوبة' : 'Req Qty'}</th>
                    <th style={{ padding: '12px 16px', color: 'var(--muted-text)', fontWeight: 600 }}>{isAr ? 'الزيادة الإضافية' : 'Excess Approved'}</th>
                    <th style={{ padding: '12px 16px', color: 'var(--muted-text)', fontWeight: 600 }}>{isAr ? 'الحالة' : 'Status'}</th>
                    <th style={{ padding: '12px 16px', color: 'var(--muted-text)', fontWeight: 600 }}>{isAr ? 'إجراء' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {overrides.map((o) => (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{o.doctorName || o.doctorId}</td>
                      <td style={{ padding: '12px 16px' }}>{o.repName || o.repId}</td>
                      <td style={{ padding: '12px 16px' }}>{o.productName || o.productId}</td>
                      <td style={{ padding: '12px 16px' }}>{o.requestedQuantity}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#b45309' }}>+{o.approvedExcessQuantity}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background:
                              o.status === 'approved' ? '#dcfce7' : o.status === 'pending' ? '#fef3c7' : '#fee2e2',
                            color:
                              o.status === 'approved' ? '#166534' : o.status === 'pending' ? '#92400e' : '#991b1b',
                          }}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {o.status === 'pending' && isAdmin ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleReviewOverride(o.id, 'approve')}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                background: '#16a34a',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              {isAr ? 'موافقة' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewOverride(o.id, 'reject')}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                background: '#dc2626',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              {isAr ? 'رفض' : 'Reject'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
                            {o.reviewedBy ? `${isAr ? 'بواسطة' : 'by'} ${o.reviewedBy}` : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
