export interface TerritoryRecord {
  name: string
  leadRep: string
  accountsCount: number
  target: string
}

export const adminTerritoriesMockData: TerritoryRecord[] = [
  { name: 'North region', leadRep: 'Olivia Martin', accountsCount: 84, target: '$120,000' },
  { name: 'West region', leadRep: 'Maya Patel', accountsCount: 68, target: '$90,000' },
  { name: 'Central region', leadRep: 'James Wilson', accountsCount: 52, target: '$100,000' },
  { name: 'East region', leadRep: 'Sofia Chen', accountsCount: 46, target: '$85,000' },
]
