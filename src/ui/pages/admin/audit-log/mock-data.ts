export interface AuditRecord {
  id: string
  action: string
  actor: string
  time: string
  details: string
}

export const adminAuditLogMockData: AuditRecord[] = [
  { id: 'LOG-409', action: 'Invoice Approved', actor: 'Alex Morgan', time: '10 mins ago', details: 'INV-1048 approved for Green Cross Pharmacy (EGP 8,420.00)' },
  { id: 'LOG-408', action: 'Doctor Profile Updated', actor: 'Olivia Martin', time: '2 hours ago', details: 'Added clinical visit notes for Dr. Sarah Kim' },
  { id: 'LOG-407', action: 'Batch Expiry Alert', actor: 'System Worker', time: '5 hours ago', details: 'Batch CW-2401 nearing 12-day threshold' },
  { id: 'LOG-406', action: 'Stock Count Completed', actor: 'Warehouse Manager', time: 'Yesterday', details: 'Count verified for North storage depot' },
]
