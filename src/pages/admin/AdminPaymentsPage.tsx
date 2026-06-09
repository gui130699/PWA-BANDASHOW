import { CheckCircle2, HandCoins } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, DataTable, Input, Select } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { addEntity } from '../../services/firestoreService'
import { confirmPayment, markInternalPaymentAsPaid } from '../../services/paymentService'
import type { BandMember, MemberPayment, Payment, SupplierPayment } from '../../types'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'
import { formatCurrency, formatDate } from '../../utils/format'

export function AdminPaymentsPage() {
  const { user, profile } = useAuth()
  const { data: payments, loading } = useCollection<Payment>('payments')
  const { data: memberPayments } = useCollection<MemberPayment>('memberPayments')
  const { data: supplierPayments } = useCollection<SupplierPayment>('supplierPayments')
  const { data: members } = useCollection<BandMember>('bandMembers')
  const [paymentMemberId, setPaymentMemberId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentNotes, setPaymentNotes] = useState('')
  const [feedback, setFeedback] = useState('')

  async function registerMemberPayment() {
    const member = members.find((item) => item.id === paymentMemberId)
    if (!member || paymentAmount <= 0) {
      setFeedback('Selecione um integrante e informe um valor maior que zero.')
      return
    }

    setFeedback('')
    try {
      await addEntity('memberPayments', {
        memberId: member.id,
        memberName: member.name,
        amount: paymentAmount,
        status: 'pago',
        pixKey: member.pixKey || '',
        notes: paymentNotes.trim(),
        paidAt: new Date(),
      })
      setPaymentMemberId('')
      setPaymentAmount(0)
      setPaymentNotes('')
      setFeedback('Pagamento de integrante registrado.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Nao foi possivel registrar o pagamento.'))
    }
  }

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

      <Card description="Registre um pagamento realizado para um integrante." title="Registrar pagamento de integrante">
        <div className="grid gap-4 md:grid-cols-[1fr_10rem_1fr_auto]">
          <Select
            onChange={(event) => {
              const member = members.find((item) => item.id === event.target.value)
              setPaymentMemberId(event.target.value)
              setPaymentAmount(member?.defaultPayment || 0)
            }}
            options={members.map((member) => ({ label: member.name, value: member.id }))}
            placeholder="Integrante"
            value={paymentMemberId}
          />
          <Input
            min={0}
            onChange={(event) => setPaymentAmount(Number(event.target.value))}
            type="number"
            value={paymentAmount}
          />
          <Input
            onChange={(event) => setPaymentNotes(event.target.value)}
            placeholder="Observacao"
            value={paymentNotes}
          />
          <Button icon={<HandCoins className="h-4 w-4" />} onClick={() => void registerMemberPayment()}>
            Registrar
          </Button>
        </div>
        {feedback && <p className="mt-4 rounded-md bg-white/8 p-3 text-sm text-slate-200">{feedback}</p>}
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
