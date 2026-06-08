import { CalendarClock, ClipboardList, PlusCircle, WalletCards } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { where } from 'firebase/firestore'
import { Button, Card, DataTable, StatusBadge } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import type { ClientQuoteView } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'

export function ClientDashboardPage() {
  const { user } = useAuth()
  const constraints = useMemo(() => [where('clientUserId', '==', user?.uid || '')], [user?.uid])
  const { data: quotes, loading } = useCollection<ClientQuoteView>('clientQuoteViews', constraints)

  const stats = useMemo(
    () => [
      {
        label: 'Orcamentos enviados',
        value: quotes.length,
        icon: ClipboardList,
      },
      {
        label: 'Aguardando entrada',
        value: quotes.filter((quote) => quote.status === 'aprovado_aguardando_entrada').length,
        icon: WalletCards,
      },
      {
        label: 'Eventos agendados',
        value: quotes.filter((quote) => quote.status === 'agendado').length,
        icon: CalendarClock,
      },
    ],
    [quotes],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Resumo</h2>
          <p className="text-sm text-slate-400">Acompanhe seus orcamentos e pagamentos.</p>
        </div>
        <Link to="/cliente/novo-orcamento">
          <Button icon={<PlusCircle className="h-4 w-4" />}>Novo orcamento</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label}>
              <Icon className="mb-4 h-7 w-7 text-gold-300" />
              <p className="text-3xl font-semibold">{item.value}</p>
              <p className="mt-1 text-sm text-slate-400">{item.label}</p>
            </Card>
          )
        })}
      </div>

      <Card title="Orcamentos recentes">
        <DataTable
          columns={[
            {
              header: 'Evento',
              cell: (quote) => (
                <div>
                  <p className="font-medium text-white">{quote.event.type}</p>
                  <p className="text-xs text-slate-400">{quote.event.city} - {formatDate(quote.event.date)}</p>
                </div>
              ),
            },
            { header: 'Status', cell: (quote) => <StatusBadge status={quote.status} /> },
            { header: 'Total', cell: (quote) => formatCurrency(quote.total) },
            {
              header: 'Detalhes',
              cell: (quote) => (
                <Link className="font-semibold text-gold-300 hover:text-gold-100" to={`/cliente/orcamentos/${quote.quoteId}`}>
                  Abrir
                </Link>
              ),
            },
          ]}
          data={quotes.slice(0, 5)}
          emptyDescription="Quando voce enviar uma solicitacao, ela aparecera aqui."
          emptyTitle="Nenhum orcamento encontrado"
          getRowKey={(quote) => quote.quoteId}
          loading={loading}
        />
      </Card>
    </div>
  )
}
