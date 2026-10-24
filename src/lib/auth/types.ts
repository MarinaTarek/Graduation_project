export type UserRole = 'admin' | 'rep'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface AuthSession {
  user: User
  token: string
}
