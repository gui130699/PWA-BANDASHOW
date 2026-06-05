import { Input } from './Input'

type DateInputProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  name?: string
}

export function DateInput({ label, value, onChange, error, name }: DateInputProps) {
  return (
    <Input
      error={error}
      label={label}
      name={name}
      onChange={(event) => onChange(event.target.value)}
      type="date"
      value={value}
    />
  )
}
