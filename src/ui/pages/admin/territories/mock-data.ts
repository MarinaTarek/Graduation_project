export interface TerritoryRecord {
  name: string
  name_ar?: string
  leadRep: string
  accountsCount: number
  target: string
  target_ar?: string
}

export const adminTerritoriesMockData: TerritoryRecord[] = [
  { name: 'North region', name_ar: 'المنطقة الشمالية', leadRep: 'Olivia Martin', accountsCount: 84, target: 'EGP 120,000', target_ar: '120,000 ج.م' },
  { name: 'West region', name_ar: 'المنطقة الغربية', leadRep: 'Maya Patel', accountsCount: 68, target: 'EGP 90,000', target_ar: '90,000 ج.م' },
  { name: 'Central region', name_ar: 'المنطقة الوسطى', leadRep: 'James Wilson', accountsCount: 52, target: 'EGP 100,000', target_ar: '100,000 ج.م' },
  { name: 'East region', name_ar: 'المنطقة الشرقية', leadRep: 'Sofia Chen', accountsCount: 46, target: 'EGP 85,000', target_ar: '85,000 ج.م' },
  { name: 'Tanta', name_ar: 'طنطا (محافظة الغربية)', leadRep: 'Olivia Martin', accountsCount: 38, target: 'EGP 75,000', target_ar: '75,000 ج.م' },
  { name: 'El Mahalla El Kubra', name_ar: 'المحلة الكبرى (محافظة الغربية)', leadRep: 'Olivia Martin', accountsCount: 32, target: 'EGP 65,000', target_ar: '65,000 ج.م' },
  { name: 'Assiut', name_ar: 'أسيوط (محافظة أسيوط)', leadRep: 'James Wilson', accountsCount: 44, target: 'EGP 80,000', target_ar: '80,000 ج.م' },
]
