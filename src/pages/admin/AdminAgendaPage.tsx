import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, DataTable, Input, PageHeader, Select, StatusBadge } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { cancelQuote, markQuoteAsDone } from '../../services/quoteService'
import type { Quote, QuoteStatus } from '../../types'
import { quoteStatusMeta } from '../../utils/constants'
import { formatCurrency, formatDate } from '../../utils/format'

const agendaStatuses: QuoteStatus[] = ['agendado', 'realizado', 'cancelado']

export function AdminAgendaPage() {
  const { user, profile } = useAuth()
  const { data: quotes, loading } = useCollection<Quote>('quotes')
  const [status, setStatus] = useState('')
  const [city, setCity] = useState('')
  const [client, setClient] = useState('')
  const [type, setType] = useState('')
  const actor = { userId: user?.uid || 'admin', userName: profile?.name || 'Admin' }

  const events = useMemo(
    () =>
      quotes
        .filter((quote) => agendaStatuses.includes(quote.status))
        .filter((quote) => (status ? quote.status === status : true))
        .filter((quote) => quote.event.city.toLowerCase().includes(city.toLowerCase()))
        .filter((quote) => quote.clientSnapshot.name.toLowerCase().includes(client.toLowerCase()))
        .filter((quote) => quote.event.type.toLowerCase().includes(type.toLowerCase()))
        .sort((a, b) => a.event.date.localeCompare(b.event.date)),
    [city, client, quotes, status, type],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        description="Eventos confirmados entram aqui automaticamente após a confirmação da entrada."
        eyebrow="Operacao"
        title="Agenda de eventos"
      />
      <Card>
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Select
              aria-label="Filtrar por status"
              onChange={(event) => setStatus(event.target.value)}
              options={agendaStatuses.map((item) => ({ label: quoteStatusMeta[item].label, value: item }))}
              placeholder="Todos"
              value={status}
            />
            <Input onChange={(event) => setCity(event.target.value)} placeholder="Cidade" value={city} />
            <Input onChange={(event) => setClient(event.target.value)} placeholder="Cliente" value={client} />
            <Input onChange={(event) => setType(event.target.value)} placeholder="Tipo" value={type} />
        </div>
        <DataTable
          columns={[
            { header: 'Data', cell: (quote) => formatDate(quote.event.date) },
            {
              header: 'Cliente, contato e local',
              cell: (quote) => (
                <div>
                  <p className="font-medium text-white">{quote.clientSnapshot.name}</p>
                  <p className="text-xs text-slate-400">{quote.clientSnapshot.phone}</p>
                  <p className="text-xs text-slate-400">{quote.event.venueName} - {quote.event.city}/{quote.event.state}</p>
                </div>
              ),
            },
            { header: 'Tipo', cell: (quote) => quote.event.type },
            { header: 'Status', cell: (quote) => <StatusBadge status={quote.status} /> },
            { header: 'Valor', cell: (quote) => formatCurrency(quote.total) },
            { header: 'Entrada', cell: (quote) => formatCurrency(quote.depositAmount) },
            { header: 'Restante', cell: (quote) => formatCurrency(quote.remainingAmount) },
            {
              header: 'Serviços',
              cell: (quote) => quote.items.map((item) => item.serviceName).join(', '),
            },
            {
              header: 'Ações',
              cell: (quote) => (
                <div className="flex flex-wrap gap-2">
                  <Link className="font-semibold text-gold-300 hover:text-gold-100" to={`/admin/orcamentos/${quote.id}`}>
                    Abrir
                  </Link>
                  <Button className="h-8 px-2" disabled={quote.status !== 'agendado'} onClick={() => markQuoteAsDone(quote.id, actor)} variant="secondary">
                    Realizado
                  </Button>
                  <Button className="h-8 px-2" disabled={quote.status === 'cancelado'} onClick={() => cancelQuote(quote.id, actor)} variant="danger">
                    Cancelar
                  </Button>
                </div>
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
