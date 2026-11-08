import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getMe, login as apiLogin, register as apiRegister } from '../api/auth.ts'
import { setUnauthorizedHandler } from '../api/client.ts'
import { queryKeys } from '../api/queryKeys.ts'
import { clearToken, getToken, setToken } from '../api/token.ts'
import type { LoginRequest, RegisterRequest } from '../types.ts'
import { AuthContext, type AuthContextValue } from './AuthContext.ts'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken)
  const queryClient = useQueryClient()

  const { data: user = null, isPending } = useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
    enabled: Boolean(token),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const logout = useCallback(() => {
    clearToken()
    setTokenState(null)
    // Önceki kullanıcıya ait veriler önbellekte kalmasın
    queryClient.removeQueries({ queryKey: queryKeys.me })
    queryClient.removeQueries({ queryKey: queryKeys.reviews.mineAll })
    queryClient.removeQueries({ queryKey: queryKeys.reviews.myListAll })
  }, [queryClient])

  const login = useCallback(
    async (body: LoginRequest) => {
      const data = await apiLogin(body)
      setToken(data.access_token)
      setTokenState(data.access_token)
      await queryClient.fetchQuery({
        queryKey: queryKeys.me,
        queryFn: getMe,
        staleTime: 5 * 60 * 1000,
      })
    },
    [queryClient],
  )

  const register = useCallback(
    async (body: RegisterRequest) => {
      await apiRegister(body)
      await login({ username: body.username, password: body.password })
    },
    [login],
  )

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => {
      setUnauthorizedHandler(null)
    }
  }, [logout])

  const isLoading = Boolean(token) && isPending
  const isAuthenticated = Boolean(token && user)

  const value = useMemo<AuthContextValue>(
    () => ({
      user: token ? user : null,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, token, isAuthenticated, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
