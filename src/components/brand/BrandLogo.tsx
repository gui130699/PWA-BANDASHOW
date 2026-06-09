import { clsx } from 'clsx'
import logo from '../../assets/brand/logo-dvanera-light.png'
import mark from '../../assets/brand/mark-dvanera.png'

type BrandLogoProps = {
  compact?: boolean
  className?: string
}

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <img
      alt="Dvanera"
      className={clsx(
        compact ? 'aspect-square object-contain' : 'aspect-[2/1] object-contain object-left',
        className,
      )}
      decoding="async"
      src={compact ? mark : logo}
    />
  )
}
