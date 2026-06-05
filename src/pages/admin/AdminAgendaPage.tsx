import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, DataTable, Select, StatusBadge } from '../../components/ui'
import { useCollection } from '../../hooks/useCollection'
import type { Quote, QuoteStatus } from '../../types'
import { quoteStatusMeta } from '../../utils/constants'
import { formatCurrency, formatDate } from '../../utils/format'

const agendaStatuses: QuoteStatus[] = ['agendado', 'entrada_confirmada', 'realizado', 'cancelado']

export function AdminAgendaPage() {
  const { data: quotes, loading } = useCollection<Quote>('quotes')
  const [status, setStatus] = useState('')

  const events = useMemo(
    () =>
      quotes
        .filter((quote) => agendaStatuses.includes(quote.status))
        .filter((quote) => (status ? quote.status === status : true))
        .sort((a, b) => a.event.date.localeCompare(b.event.date)),
    [quotes, status],
  )

  return (
    <div className="space-y-6">
      <Card
        action={
          <Select
            onChange={(event) => setStatus(event.target.value)}
            options={agendaStatuses.map((item) => ({ label: quoteStatusMeta[item].label, value: item }))}
            placeholder="Todos"
            value={status}
          />
        }
        description="Eventos confirmados entram aqui automaticamente apos confirmacao da entrada."
        title="Agenda"
      >
        <DataTable
          columns={[
            { header: 'Data', cell: (quote) => formatDate(quote.event.date) },
            {
              header: 'Cliente e local',
              cell: (quote) => (
                <div>
                  <p className="font-medium text-white">{quote.clientSnapshot.name}</p>
                  <p className="text-xs text-slate-400">{quote.event.venueName} - {quote.event.city}/{quote.event.state}</p>
                </div>
              ),
            },
            { header: 'Status', cell: (quote) => <StatusBadge status={quote.status} /> },
            { header: 'Valor', cell: (quote) => formatCurrency(quote.total) },
            {
              header: 'Servicos',
              cell: (quote) => quote.items.map((item) => item.serviceName).join(', '),
            },
            {
              header: 'Detalhes',
              cell: (quote) => (
                <Link className="font-semibold text-gold-300 hover:text-gold-100" to={`/admin/orcamentos/${quote.id}`}>
                  Abrir
                </Link>
              ),
            },
          ]}
          data={events}
          emptyDescription="Confirme uma entrada para que o evento apareca na agenda."
          emptyTitle="Nenhum evento na agenda"
          getRowKey={(quote) => quote.id}
          loading={loading}
        />
      </Card>
    </div>
  )
}
