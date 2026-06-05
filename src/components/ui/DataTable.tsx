import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'
import { Loading } from './Loading'

type Column<T> = {
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

type DataTableProps<T> = {
  data: T[]
  columns: Column<T>[]
  getRowKey: (row: T) => string
  emptyTitle: string
  emptyDescription?: string
  loading?: boolean
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  emptyTitle,
  emptyDescription,
  loading,
}: DataTableProps<T>) {
  if (loading) return <Loading />
  if (data.length === 0) return <EmptyState description={emptyDescription} title={emptyTitle} />

  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/[0.04]">
            <tr>
              {columns.map((column) => (
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                  key={column.header}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {data.map((row) => (
              <tr className="bg-transparent transition hover:bg-white/[0.03]" key={getRowKey(row)}>
                {columns.map((column) => (
                  <td className={column.className || 'px-4 py-3 text-sm text-slate-200'} key={column.header}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
