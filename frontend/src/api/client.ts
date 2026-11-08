import axios from 'axios'
import { API_URL } from '../config.ts'
import { clearToken, getToken } from './token.ts'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
})

let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token'lı istek 401 dönerse oturum düşmüştür; hatalı şifre (login 401) bu akışa girmez
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const isLogin = error.config?.url?.includes('/auth/login') ?? false
      const sentToken = Boolean(error.config?.headers?.Authorization)
      if (!isLogin && sentToken) {
        clearToken()
        unauthorizedHandler?.()
      }
    }
    return Promise.reject(error)
  },
)

export function cleanParams<T extends object>(params: T): Partial<T> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue
    }
    if (typeof value === 'string' && value.trim() === '') {
      continue
    }
    result[key] = value
  }
  return result as Partial<T>
}
