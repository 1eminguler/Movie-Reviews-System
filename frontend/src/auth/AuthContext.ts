import { createContext } from 'react'
import type { LoginRequest, RegisterRequest, User } from '../types.ts'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login(body: LoginRequest): Promise<void>
  register(body: RegisterRequest): Promise<void>
  logout(): void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
