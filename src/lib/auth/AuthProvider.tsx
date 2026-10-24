'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, UserRole } from './types'
import * as authService from './auth-service'

export interface AuthContextType {
  user: User | null
  role: UserRole
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<User>
  signOut: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = authService.getSession()
    if (session?.user) {
      setUser(session.user)
    }
    setIsLoading(false)
  }, [])

  const handleSignIn = async (email: string, password: string): Promise<User> => {
    const signedInUser = await authService.signIn(email, password)
    setUser(signedInUser)
    return signedInUser
  }

  const handleSignOut = () => {
    authService.signOut()
    setUser(null)
  }

  const role: UserRole = user?.role || 'rep'
  const isAdmin = role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        signIn: handleSignIn,
        signOut: handleSignOut,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
