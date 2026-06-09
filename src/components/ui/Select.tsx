import type { SelectHTMLAttributes } from 'react'
import { clsx } from 'clsx'

type Option = {
  label: string
  value: string
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  options: Option[]
  placeholder?: string
  wrapperClassName?: string
}

export function Select({
  label,
  error,
  options,
  placeholder,
  className,
  wrapperClassName,
  id,
  ...props
}: SelectProps) {
  const selectId = id || props.name

  return (
    <label className={clsx('grid gap-2 text-sm text-slate-200', wrapperClassName)} htmlFor={selectId}>
      {label && <span className="font-semibold text-ivory-100">{label}</span>}
      <select
        className={clsx(
          'min-h-11 rounded-md border border-white/12 bg-night-800 px-3 py-2 text-ivory-50 outline-none transition hover:border-white/20 focus:border-gold-300/70 focus:ring-2 focus:ring-gold-300/15',
          error && 'border-red-400/70 focus:border-red-400 focus:ring-red-400/20',
          className,
        )}
        id={selectId}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-200">{error}</span>}
    </label>
  )
}
