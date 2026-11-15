import type { InputHTMLAttributes } from 'react'

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string | null
}

// Görünür etiketli form alanı; hata mesajı alanın hemen altında okunur
export default function AuthField({ id, label, error, ...inputProps }: AuthFieldProps) {
  const errorId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium text-mute">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="field"
        {...inputProps}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-[13px] text-neg">
          {error}
        </p>
      )}
    </div>
  )
}
