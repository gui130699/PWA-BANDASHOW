import { where } from 'firebase/firestore'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, DataTable, StatusBadge } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import type { Quote } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'

export function ClientQuotesPage() {
  const { user } = useAuth()
  const constraints = useMemo(() => [where('clientUserId', '==', user?.uid || '')], [user?.uid])
  const { data: quotes, loading } = useCollection<Quote>('quotes', constraints)

  return (
    <Card title="Meus orcamentos">
      <DataTable
        columns={[
          { header: 'Data', cell: (quote) => formatDate(quote.event.date) },
          {
            header: 'Evento',
            cell: (quote) => (
              <div>
                <p className="font-medium text-white">{quote.event.type}</p>
                <p className="text-xs text-slate-400">{quote.event.venueName}</p>
              </div>
            ),
          },
          { header: 'Cidade', cell: (quote) => `${quote.event.city}/${quote.event.state}` },
          { header: 'Status', cell: (quote) => <StatusBadge status={quote.status} /> },
          { header: 'Total', cell: (quote) => formatCurrency(quote.total) },
          {
            header: 'Acao',
            cell: (quote) => (
              <Link className="font-semibold text-gold-300 hover:text-gold-100" to={`/cliente/orcamentos/${quote.id}`}>
                Ver detalhes
              </Link>
            ),
          },
        ]}
        data={quotes}
        emptyDescription="Solicite um novo orcamento para acompanhar por aqui."
        emptyTitle="Voce ainda nao possui orcamentos"
        getRowKey={(quote) => quote.id}
        loading={loading}
      />
    </Card>
  )
}
