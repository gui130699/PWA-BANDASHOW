import { where } from 'firebase/firestore'
import { useMemo } from 'react'
import { Card, DataTable, Badge } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import type { Payment } from '../../types'
import { formatCurrency } from '../../utils/format'

export function ClientPaymentsPage() {
  const { user } = useAuth()
  const constraints = useMemo(() => [where('clientId', '==', user?.uid || '')], [user?.uid])
  const { data: payments, loading } = useCollection<Payment>('payments', constraints)

  return (
    <Card title="Meus pagamentos">
      <DataTable
        columns={[
          { header: 'Tipo', cell: (payment) => payment.type.replace('_', ' ') },
          { header: 'Valor', cell: (payment) => formatCurrency(payment.amount) },
          {
            header: 'Status',
            cell: (payment) => (
              <Badge className="bg-white/8 text-slate-200 ring-white/10">{payment.status.replaceAll('_', ' ')}</Badge>
            ),
          },
          { header: 'Pix usado', cell: (payment) => payment.pixKeyUsed || '-' },
        ]}
        data={payments}
        emptyDescription="Pagamentos aparecem quando um orcamento aprovado gera entrada ou restante."
        emptyTitle="Nenhum pagamento gerado"
        getRowKey={(payment) => payment.id}
        loading={loading}
      />
    </Card>
  )
}
