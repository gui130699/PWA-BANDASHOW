import { CalendarClock, ClipboardList, PlusCircle, WalletCards } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { where } from 'firebase/firestore'
import { Button, Card, DataTable, MetricCard, PageHeader, StatusBadge } from '../../components/ui'
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
        tone: 'gold' as const,
      },
      {
        label: 'Aguardando entrada',
        value: quotes.filter((quote) => quote.status === 'aprovado_aguardando_entrada').length,
        icon: WalletCards,
        tone: 'blue' as const,
      },
      {
        label: 'Eventos agendados',
        value: quotes.filter((quote) => quote.status === 'agendado').length,
        icon: CalendarClock,
        tone: 'green' as const,
      },
    ],
    [quotes],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Link to="/cliente/novo-orcamento">
            <Button icon={<PlusCircle className="h-4 w-4" />}>Novo orcamento</Button>
          </Link>
        }
        description="Acompanhe seus orcamentos, eventos e pagamentos em um unico lugar."
        eyebrow="Painel do cliente"
        title="Seu resumo"
      />

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => <MetricCard key={item.label} {...item} />)}
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
