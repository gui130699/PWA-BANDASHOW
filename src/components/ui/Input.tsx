import type { InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  wrapperClassName?: string
}

export function Input({ label, error, className, wrapperClassName, id, ...props }: InputProps) {
  const inputId = id || props.name

  return (
    <label className={clsx('grid gap-2 text-sm text-slate-200', wrapperClassName)} htmlFor={inputId}>
      {label && <span className="font-medium">{label}</span>}
      <input
        className={clsx(
          'min-h-11 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-white outline-none transition placeholder:text-slate-500 focus:border-gold-300/70 focus:ring-2 focus:ring-gold-300/20',
          error && 'border-red-400/70 focus:border-red-400 focus:ring-red-400/20',
          className,
        )}
        id={inputId}
        {...props}
      />
      {error && <span className="text-xs text-red-200">{error}</span>}
    </label>
  )
}
