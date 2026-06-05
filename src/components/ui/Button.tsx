import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  icon?: ReactNode
  isLoading?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-gold-400 text-night-950 hover:bg-gold-300 focus-visible:ring-gold-300 shadow-glow',
  secondary:
    'bg-white/10 text-white ring-1 ring-white/12 hover:bg-white/15 focus-visible:ring-gold-300',
  ghost: 'bg-transparent text-slate-200 hover:bg-white/8 focus-visible:ring-gold-300',
  danger: 'bg-red-500/90 text-white hover:bg-red-500 focus-visible:ring-red-300',
  success: 'bg-emerald-500 text-night-950 hover:bg-emerald-400 focus-visible:ring-emerald-300',
}

export function Button({
  className,
  children,
  variant = 'primary',
  icon,
  isLoading,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-55',
        variants[variant],
        className,
      )}
      disabled={disabled || isLoading}
      type={type}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      <span>{children}</span>
    </button>
  )
}
