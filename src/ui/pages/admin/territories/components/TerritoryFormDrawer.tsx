'use client'

import { useState, useEffect } from 'react'
import { Check, X, MapPin } from 'lucide-react'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { Button } from '@/ui/design-system/components/Button'
import { FieldError } from '@/ui/design-system/components/FieldError'
import { useT } from '@/lib/i18n'
import { ALL_MOCK_REPS } from '@/ui/design-system/components/RecordFormDrawer'
import {
  type TerritoryRecord,
  addTerritory,
  updateTerritory,
  territoriesStore,
} from '../mock-data'

export interface TerritoryFormDrawerProps {
  territory: TerritoryRecord | null
  isOpen: boolean
  onClose: () => void
  onSave: (message: string) => void
  currentUserName?: string
}

export function TerritoryFormDrawer({
  territory,
  isOpen,
  onClose,
  onSave,
  currentUserName = 'Admin',
}: TerritoryFormDrawerProps) {
  const { lang } = useT()
  const isEdit = Boolean(territory)

  const [name, setName] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [leadRep, setLeadRep] = useState(ALL_MOCK_REPS[0].name)
  const [accountsCount, setAccountsCount] = useState<string>('40')
  const [targetAmount, setTargetAmount] = useState<string>('100000')

  const [nameError, setNameError] = useState<string | null>(null)
  const [targetError, setTargetError] = useState<string | null>(null)
  const [genericError, setGenericError] = useState<string | null>(null)

  useEffect(() => {
    if (territory) {
      setName(territory.name)
      setNameAr(territory.name_ar || '')
      setLeadRep(territory.leadRep)
      setAccountsCount(String(territory.accountsCount || 0))
      // Extract numeric digits from target string (e.g. "EGP 120,000" -> "120000")
      const parsed = territory.target.replace(/[^\d]/g, '')
      setTargetAmount(parsed || '100000')
    } else {
      setName('')
      setNameAr('')
      setLeadRep(ALL_MOCK_REPS[0].name)
      setAccountsCount('40')
      setTargetAmount('100000')
    }
    setNameError(null)
    setTargetError(null)
    setGenericError(null)
  }, [territory, isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    setNameError(null)
    setTargetError(null)
    setGenericError(null)

    const cleanName = name.trim()
    if (!cleanName) {
      setNameError(lang === 'ar' ? 'اسم المنطقة مطلوب' : 'Territory name is required')
      return
    }

    // Check duplicate name on create
    if (!isEdit) {
      const existing = territoriesStore.get().some(
        (t) => t.name.toLowerCase() === cleanName.toLowerCase()
      )
      if (existing) {
        setNameError(lang === 'ar' ? 'هذه المنطقة مسجلة بالفعل' : 'A territory with this name already exists')
        return
      }
    }

    const targetNum = Number(targetAmount)
    if (isNaN(targetNum) || targetNum <= 0) {
      setTargetError(lang === 'ar' ? 'المبلغ المستهدف يجب أن يكون أكبر من صفر' : 'Target amount must be a number > 0')
      return
    }

    const accountsNum = parseInt(accountsCount, 10)
    if (isNaN(accountsNum) || accountsNum < 0) {
      setGenericError(lang === 'ar' ? 'عدد الحسابات يجب أن يكون رقماً صحيحاً' : 'Accounts count must be 0 or greater')
      return
    }

    const formattedTargetEn = `EGP ${targetNum.toLocaleString()}`
    const formattedTargetAr = `${targetNum.toLocaleString()} ج.م`

    const payload: TerritoryRecord = {
      name: cleanName,
      name_ar: nameAr.trim() || undefined,
      leadRep,
      accountsCount: accountsNum,
      target: formattedTargetEn,
      target_ar: formattedTargetAr,
    }

    if (isEdit && territory) {
      updateTerritory(territory.name, payload, currentUserName)
      onSave(
        lang === 'ar'
          ? `تم تحديث منطقة ${payload.name_ar || payload.name} بنجاح`
          : `Territory ${payload.name} updated successfully`
      )
    } else {
      addTerritory(payload, currentUserName)
      onSave(
        lang === 'ar'
          ? `تمت إضافة منطقة ${payload.name_ar || payload.name} بنجاح`
          : `Territory ${payload.name} created successfully`
      )
    }

    onClose()
  }

  const title = isEdit
    ? (lang === 'ar' ? 'تعديل المنطقة' : 'Edit Territory')
    : (lang === 'ar' ? 'إضافة منطقة جديدة' : 'Add New Territory')

  const kicker = lang === 'ar' ? 'التغطية الجغرافية' : 'GEOGRAPHIC COVERAGE'

  return (
    <Drawer title={title} kicker={kicker} onClose={onClose}>
      {genericError && (
        <div style={{ margin: '0 24px 16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--rose-text)', fontSize: '13px' }}>
          {genericError}
        </div>
      )}

      <div className="form-grid">
        <label>
          {lang === 'ar' ? 'اسم المنطقة (بالإنجليزية) *' : 'Territory Name (English) *'}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. North Coast region"
            disabled={isEdit} // Primary key in mock store
          />
          {nameError && <FieldError message={nameError} />}
        </label>

        <label>
          {lang === 'ar' ? 'اسم المنطقة (بالعربية)' : 'Territory Name (Arabic)'}
          <input
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="مثال: منطقة الساحل الشمالي"
          />
        </label>

        <label>
          {lang === 'ar' ? 'المندوب المسؤول (Lead Representative) *' : 'Lead Representative *'}
          <select value={leadRep} onChange={(e) => setLeadRep(e.target.value)}>
            {ALL_MOCK_REPS.map((rep) => (
              <option key={rep.id} value={rep.name}>
                {rep.name} ({rep.region})
              </option>
            ))}
          </select>
        </label>

        <label>
          {lang === 'ar' ? 'عدد الحسابات المخصصة' : 'Assigned Accounts Count'}
          <input
            type="number"
            min="0"
            step="1"
            value={accountsCount}
            onChange={(e) => setAccountsCount(e.target.value)}
          />
        </label>

        <label className="full">
          {lang === 'ar' ? 'المستهدف الشهري (جنيه مصري) *' : 'Monthly Sales Target (EGP) *'}
          <input
            type="number"
            min="1000"
            step="1000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="100000"
          />
          {targetError && <FieldError message={targetError} />}
        </label>
      </div>

      <div className="sheet-actions">
        <Button variant="secondary" onClick={onClose}>
          {lang === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button variant="primary" onClick={handleSave}>
          <Check data-icon="inline-start" />
          {isEdit
            ? (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes')
            : (lang === 'ar' ? 'إضافة المنطقة' : 'Add Territory')}
        </Button>
      </div>
    </Drawer>
  )
}
