export interface TerritoryRecord {
  name: string
  name_ar?: string
  leadRep: string
  accountsCount: number
  target: string
}

export const adminTerritoriesMockData: TerritoryRecord[] = [
  { name: 'North region', name_ar: 'المنطقة الشمالية', leadRep: 'Olivia Martin', accountsCount: 84, target: 'EGP 120,000' },
  { name: 'West region', name_ar: 'المنطقة الغربية', leadRep: 'Maya Patel', accountsCount: 68, target: 'EGP 90,000' },
  { name: 'Central region', name_ar: 'المنطقة الوسطى', leadRep: 'James Wilson', accountsCount: 52, target: 'EGP 100,000' },
  { name: 'East region', name_ar: 'المنطقة الشرقية', leadRep: 'Sofia Chen', accountsCount: 46, target: 'EGP 85,000' },
]
