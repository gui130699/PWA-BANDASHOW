import { where } from 'firebase/firestore'
import { useMemo } from 'react'
import { useCollection } from '../../hooks/useCollection'
import type { AdminOption } from '../../types'
import { Select } from '../ui'

type AdminOptionSelectProps = {
  collectionName: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  required?: boolean
  currentValue?: string
  wrapperClassName?: string
}

export function AdminOptionSelect({
  collectionName,
  label,
  value,
  onChange,
  placeholder = 'Selecione',
  error,
  required,
  currentValue,
  wrapperClassName,
}: AdminOptionSelectProps) {
  const constraints = useMemo(() => [where('active', '==', true)], [])
  const { data, loading, error: loadError } = useCollection<AdminOption>(
    collectionName,
    constraints,
  )
  const options = useMemo(() => {
    const activeOptions = [...data].sort(
      (first, second) =>
        (first.order ?? Number.MAX_SAFE_INTEGER) -
          (second.order ?? Number.MAX_SAFE_INTEGER) ||
        first.name.localeCompare(second.name, 'pt-BR'),
    )
    const values = activeOptions.map((item) => item.name)

    if (currentValue && !values.includes(currentValue)) {
      values.unshift(currentValue)
    }

    return values.map((name) => ({ label: name, value: name }))
  }, [currentValue, data])

  return (
    <div className={wrapperClassName}>
      <Select
        disabled={loading}
        error={error}
        label={label}
        onChange={(event) => onChange(event.target.value)}
        options={options}
        placeholder={loading ? 'Carregando opções...' : placeholder}
        required={required}
        value={value}
      />
      {loadError && (
        <p className="mt-1 text-xs text-red-200">Não foi possível carregar as opções.</p>
      )}
      {!loading && !loadError && options.length === 0 && (
        <p className="mt-1 text-xs text-amber-200">
          Nenhuma opção ativa. Cadastre ou reative uma opção.
        </p>
      )}
    </div>
  )
}
