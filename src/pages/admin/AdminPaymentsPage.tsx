import { CheckCircle2 } from 'lucide-react'
import { Button, Card, DataTable, Badge } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { confirmPayment, markInternalPaymentAsPaid } from '../../services/paymentService'
import type { MemberPayment, Payment, SupplierPayment } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'

export function AdminPaymentsPage() {
  const { user, profile } = useAuth()
  const { data: payments, loading } = useCollection<Payment>('payments')
  const { data: memberPayments } = useCollection<MemberPayment>('memberPayments')
  const { data: supplierPayments } = useCollection<SupplierPayment>('supplierPayments')

  return (
    <div className="space-y-6">
      <Card description="Confirme manualmente entradas e pagamentos finais apos conferir o banco." title="Pagamentos de clientes">
        <DataTable
          columns={[
            { header: 'Tipo', cell: (payment) => payment.type.replace('_', ' ') },
            { header: 'Valor', cell: (payment) => formatCurrency(payment.amount) },
            {
              header: 'Status',
              cell: (payment) => <Badge className="bg-white/8 text-slate-200 ring-white/10">{payment.status.replaceAll('_', ' ')}</Badge>,
            },
            { header: 'Pix', cell: (payment) => payment.pixKeyUsed || '-' },
            { header: 'Criado em', cell: (payment) => formatDate(payment.createdAt) },
            {
              header: 'Acao',
              cell: (payment) => (
                <Button
                  className="h-9 px-3"
                  disabled={payment.status === 'confirmado'}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={() => confirmPayment(payment.id, { userId: user?.uid || 'admin', userName: profile?.name || 'Admin' })}
                  variant="success"
                >
                  Confirmar
                </Button>
              ),
            },
          ]}
          data={payments}
          emptyTitle="Nenhum pagamento de cliente"
          getRowKey={(payment) => payment.id}
          loading={loading}
        />
      </Card>

      <Card title="Pagamentos de integrantes">
        <DataTable
          columns={[
            { header: 'Integrante', cell: (payment) => payment.memberName },
            { header: 'Valor', cell: (payment) => formatCurrency(payment.amount) },
            { header: 'Status', cell: (payment) => payment.status },
            { header: 'Data', cell: (payment) => formatDate(payment.paidAt || payment.createdAt) },
            {
              header: 'Acao',
              cell: (payment) => (
                <Button
                  className="h-9 px-3"
                  disabled={payment.status === 'pago'}
                  onClick={() => markInternalPaymentAsPaid('memberPayments', payment.id)}
                  variant="secondary"
                >
                  Marcar pago
                </Button>
              ),
            },
          ]}
          data={memberPayments}
          emptyTitle="Nenhum pagamento de integrante"
          getRowKey={(payment) => payment.id}
        />
      </Card>

      <Card title="Pagamentos de fornecedores">
        <DataTable
          columns={[
            { header: 'Fornecedor', cell: (payment) => payment.supplierName },
            { header: 'Valor', cell: (payment) => formatCurrency(payment.amount) },
            { header: 'Status', cell: (payment) => payment.status },
            { header: 'Data', cell: (payment) => formatDate(payment.paidAt || payment.createdAt) },
            {
              header: 'Acao',
              cell: (payment) => (
                <Button
                  className="h-9 px-3"
                  disabled={payment.status === 'pago'}
                  onClick={() => markInternalPaymentAsPaid('supplierPayments', payment.id)}
                  variant="secondary"
                >
                  Marcar pago
                </Button>
              ),
            },
          ]}
          data={supplierPayments}
          emptyTitle="Nenhum pagamento de fornecedor"
          getRowKey={(payment) => payment.id}
        />
      </Card>
    </div>
  )
}
