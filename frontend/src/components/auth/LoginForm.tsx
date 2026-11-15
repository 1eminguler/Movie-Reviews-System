import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../../api/errors.ts'
import { useAuth } from '../../auth/useAuth.ts'
import AuthField from './AuthField.tsx'
import FormError from './FormError.tsx'
import { validatePassword, validateUsername } from './passwordRules.ts'

// Giriş formu: başarılı girişte kullanıcı geldiği sayfaya döner
export default function LoginForm({ from }: { from: string }) {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setUsernameError(null)
    setPasswordError(null)
    setErrorMsg(null)

    const trimmedUsername = username.trim()
    const userErr = validateUsername(trimmedUsername)
    if (userErr) return setUsernameError(userErr)
    const passErr = validatePassword(password)
    if (passErr) return setPasswordError(passErr)

    setIsSubmitting(true)
    try {
      await login({ username: trimmedUsername, password })
      navigate(from, { replace: true })
    } catch (err) {
      setErrorMsg(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormError message={errorMsg} />
      <AuthField
        id="login-username"
        label="Username"
        type="text"
        required
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        error={usernameError}
        placeholder="your_username"
      />
      <AuthField
        id="login-password"
        label="Password"
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={passwordError}
        placeholder="At least 8 characters"
      />
      <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
