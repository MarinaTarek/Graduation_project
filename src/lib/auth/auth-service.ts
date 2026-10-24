import { MOCK_USERS } from './mock-users'
import type { User, AuthSession } from './types'

const STORAGE_KEY = 'medora_session'

export async function signIn(email: string, password: string): Promise<User> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 400))

  const cleanEmail = email.trim().toLowerCase()
  const found = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.passwordHash === password
  )

  if (!found) {
    throw new Error('Wrong email or password')
  }

  const { passwordHash: _, ...user } = found
  const session: AuthSession = {
    user,
    token: `token-${user.id}-${Date.now()}`,
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  }

  return user
}

export function signOut(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}
