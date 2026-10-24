export type UserRole = 'admin' | 'rep'
export type UserStatus = 'pending' | 'active' | 'rejected' | 'disabled'

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
  phone?: string
  requestedDate?: string
  role: UserRole
  region?: string
  status?: UserStatus
  emailVerified?: boolean
  permissions?: UserPermissions
}

export interface AuthSession {
  user: User
  token: string
}
