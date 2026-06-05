import { Input } from './Input'
import { formatCurrency, parseCurrency } from '../../utils/format'

type MoneyInputProps = {
  label?: string
  value: number
  onChange: (value: number) => void
  error?: string
  name?: string
}

export function MoneyInput({ label, value, onChange, error, name }: MoneyInputProps) {
  return (
    <Input
      error={error}
      inputMode="numeric"
      label={label}
      name={name}
      onChange={(event) => onChange(parseCurrency(event.target.value))}
      value={formatCurrency(value)}
    />
  )
}
