import type { LoginRequest, RegisterRequest, TokenResponse, User } from '../types.ts'
import { api } from './client.ts'

export async function register(body: RegisterRequest): Promise<User> {
  const response = await api.post<User>('/auth/register', body)
  return response.data
}

export async function login(body: LoginRequest): Promise<TokenResponse> {
  const params = new URLSearchParams()
  params.append('username', body.username)
  params.append('password', body.password)
  const response = await api.post<TokenResponse>('/auth/login', params)
  return response.data
}

export async function getMe(): Promise<User> {
  const response = await api.get<User>('/users/me')
  return response.data
}
