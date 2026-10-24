export interface AdminUserRecord {
  name: string
  role: string
  region: string
  status: string
}

export const adminUsersMockData: AdminUserRecord[] = [
  { name: 'Alex Morgan', role: 'System Admin', region: 'HQ - Global', status: 'Active' },
  { name: 'Olivia Martin', role: 'Medical Representative', region: 'North region', status: 'Active' },
  { name: 'Maya Patel', role: 'Medical Representative', region: 'West region', status: 'Active' },
  { name: 'James Wilson', role: 'Medical Representative', region: 'Central region', status: 'Active' },
  { name: 'Sofia Chen', role: 'Medical Representative', region: 'East region', status: 'Active' },
]
