import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, DataTable, Select, StatusBadge } from '../../components/ui'
import { useCollection } from '../../hooks/useCollection'
import type { Quote, QuoteStatus } from '../../types'
import { quoteStatusMeta } from '../../utils/constants'
import { formatCurrency, formatDate } from '../../utils/format'

const statuses = Object.keys(quoteStatusMeta) as QuoteStatus[]

export function AdminQuotesPage() {
  const { data: quotes, loading } = useCollection<Quote>('quotes')
  const [status, setStatus] = useState('')

  const filtered = useMemo(
    () => quotes.filter((quote) => (status ? quote.status === status : true)),
    [quotes, status],
  )

  return (
    <Card
      action={
        <Select
          onChange={(event) => setStatus(event.target.value)}
          options={statuses.map((item) => ({ label: quoteStatusMeta[item].label, value: item }))}
          placeholder="Todos"
          value={status}
        />
      }
      title="Orcamentos"
    >
      <DataTable
        columns={[
          { header: 'Data', cell: (quote) => formatDate(quote.event.date) },
          {
            header: 'Cliente',
            cell: (quote) => (
              <div>
                <p className="font-medium text-white">{quote.clientSnapshot.name}</p>
                <p className="text-xs text-slate-400">{quote.clientSnapshot.phone}</p>
              </div>
            ),
          },
          { header: 'Cidade', cell: (quote) => `${quote.event.city}/${quote.event.state}` },
          { header: 'Status', cell: (quote) => <StatusBadge status={quote.status} /> },
          { header: 'Total', cell: (quote) => formatCurrency(quote.total) },
          { header: 'Lucro', cell: (quote) => formatCurrency(quote.estimatedProfit) },
          {
            header: 'Ação',
            cell: (quote) => (
              <Link className="font-semibold text-gold-300 hover:text-gold-100" to={`/admin/orcamentos/${quote.id}`}>
                Analisar
              </Link>
            ),
          },
        ]}
        data={filtered}
        emptyDescription="Orçamentos enviados pelos clientes aparecem aqui."
        emptyTitle="Nenhum orçamento encontrado"
        getRowKey={(quote) => quote.id}
        loading={loading}
      />
    </Card>
  )
}
