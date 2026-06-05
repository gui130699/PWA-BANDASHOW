import type { TextareaHTMLAttributes } from 'react'
import { clsx } from 'clsx'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  wrapperClassName?: string
}

export function Textarea({ label, error, className, wrapperClassName, id, ...props }: TextareaProps) {
  const textareaId = id || props.name

  return (
    <label className={clsx('grid gap-2 text-sm text-slate-200', wrapperClassName)} htmlFor={textareaId}>
      {label && <span className="font-medium">{label}</span>}
      <textarea
        className={clsx(
          'min-h-28 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-white outline-none transition placeholder:text-slate-500 focus:border-gold-300/70 focus:ring-2 focus:ring-gold-300/20',
          error && 'border-red-400/70 focus:border-red-400 focus:ring-red-400/20',
          className,
        )}
        id={textareaId}
        {...props}
      />
      {error && <span className="text-xs text-red-200">{error}</span>}
    </label>
  )
}
