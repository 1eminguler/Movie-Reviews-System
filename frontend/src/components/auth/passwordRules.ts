// Backend kuralları: kullanıcı adı 3-50 karakter, parola en az 8 karakter ve en fazla 72 bayt (bcrypt sınırı)
export function validateUsername(username: string): string | null {
  return username.length < 3 || username.length > 50 ? 'Username must be between 3 and 50 characters.' : null
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (new TextEncoder().encode(password).length > 72) return 'Password must be at most 72 bytes.'
  return null
}
