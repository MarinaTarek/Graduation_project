export type UserRole = 'admin' | 'rep'

export interface UserPermissions {
  pages: string[]
  canEditPrices: boolean
  canApproveInvoices: boolean
  canExport: boolean
  canDeleteData: boolean
}

export interface User {
  id: string
  name: string
  name_ar?: string
  email: string
  role: UserRole
  region?: string
  status?: string
  permissions?: UserPermissions
}

export interface AuthSession {
  user: User
  token: string
}
