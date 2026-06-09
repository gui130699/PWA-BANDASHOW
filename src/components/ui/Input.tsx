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
      {label && <span className="font-semibold text-ivory-100">{label}</span>}
      <input
        className={clsx(
          'min-h-11 rounded-md border border-white/12 bg-black/25 px-3 py-2 text-ivory-50 outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-gold-300/70 focus:ring-2 focus:ring-gold-300/15',
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
