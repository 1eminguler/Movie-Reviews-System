import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../../api/errors.ts'
import { useAuth } from '../../auth/useAuth.ts'
import AuthField from './AuthField.tsx'
import FormError from './FormError.tsx'
import { validatePassword, validateUsername } from './passwordRules.ts'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Kayıt formu: hesap açılınca oturum açılır ve kullanıcı geldiği sayfaya döner
export default function RegisterForm({ from }: { from: string }) {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setUsernameError(null)
    setEmailError(null)
    setPasswordError(null)
    setErrorMsg(null)

    const trimmedUsername = username.trim()
    const userErr = validateUsername(trimmedUsername)
    if (userErr) return setUsernameError(userErr)
    const trimmedEmail = email.trim()
    if (!EMAIL_REGEX.test(trimmedEmail)) return setEmailError('Please enter a valid email address.')
    const passErr = validatePassword(password)
    if (passErr) return setPasswordError(passErr)

    setIsSubmitting(true)
    try {
      await register({ username: trimmedUsername, email: trimmedEmail, password })
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
        id="register-username"
        label="Username"
        type="text"
        required
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        error={usernameError}
        placeholder="3 to 50 characters"
      />
      <AuthField
        id="register-email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={emailError}
        placeholder="name@example.com"
      />
      <AuthField
        id="register-password"
        label="Password"
        type="password"
        required
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={passwordError}
        placeholder="At least 8 characters"
      />
      <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
