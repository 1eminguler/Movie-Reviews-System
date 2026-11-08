import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './AuthContext.ts'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth, AuthProvider içinde kullanılmalı')
  }
  return context
}
