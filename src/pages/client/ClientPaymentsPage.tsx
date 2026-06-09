import { where } from 'firebase/firestore'
import { Copy, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, Textarea } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { clientMarkPaymentAsPaid } from '../../services/paymentService'
import type { Payment } from '../../types'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'
import { formatCurrency } from '../../utils/format'

function paymentLabel(type: Payment['type']) {
  if (type === 'entrada' || type === 'entrada_50') return 'Entrada'
  if (type === 'restante' || type === 'restante_50') return 'Restante'
  return 'Outro pagamento'
}

export function ClientPaymentsPage() {
  const { user } = useAuth()
  const constraints = useMemo(() => [where('clientId', '==', user?.uid || '')], [user?.uid])
  const { data: payments, loading } = useCollection<Payment>('payments', constraints)
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState('')
  const [feedback, setFeedback] = useState('')

  async function copyPixKey(pixKey: string) {
    if (!pixKey) {
      setFeedback('A chave Pix ainda não foi configurada. Fale com a administração.')
      return
    }
    await navigator.clipboard.writeText(pixKey)
    setFeedback('Chave Pix copiada.')
  }

  async function informPayment(payment: Payment) {
    setSubmittingId(payment.id)
    setFeedback('')
    try {
      await clientMarkPaymentAsPaid(payment, messages[payment.id] || '')
      setFeedback('Pagamento informado. Aguarde a conferência manual.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Não foi possível informar o pagamento.'))
    } finally {
      setSubmittingId('')
    }
  }

  return (
    <div className="space-y-6">
      <Card description="Informe aqui pagamentos de entrada, restante ou valores adicionais." title="Meus pagamentos">
        {loading ? (
          <p className="text-sm text-slate-400">Carregando pagamentos...</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-slate-400">Pagamentos aparecem quando um orçamento aprovado gera entrada ou restante.</p>
        ) : (
          <div className="grid gap-4">
            {payments.map((payment) => (
              <div className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 lg:grid-cols-[1fr_1.2fr]" key={payment.id}>
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white">{paymentLabel(payment.type)}</h3>
                    <Badge className="bg-white/8 text-slate-200 ring-white/10">{payment.status.replaceAll('_', ' ')}</Badge>
                  </div>
                  <p className="text-2xl font-semibold text-gold-300">{formatCurrency(payment.amount)}</p>
                  <p className="mt-3 text-sm text-slate-400">Chave Pix</p>
                  <p className="break-all font-semibold text-white">{payment.pixKeyUsed || '-'}</p>
                </div>
                <div className="space-y-4">
                  <Textarea
                    disabled={payment.status === 'confirmado'}
                    label="Observação ou referência do comprovante"
                    onChange={(event) => setMessages((current) => ({ ...current, [payment.id]: event.target.value }))}
                    value={messages[payment.id] || payment.clientMessage || ''}
                  />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      disabled={!payment.pixKeyUsed}
                      icon={<Copy className="h-4 w-4" />}
                      onClick={() => copyPixKey(payment.pixKeyUsed)}
                      variant="secondary"
                    >
                      Copiar chave Pix
                    </Button>
                    <Button
                      disabled={payment.status === 'confirmado' || payment.status === 'informado_pelo_cliente'}
                      icon={<Send className="h-4 w-4" />}
                      isLoading={submittingId === payment.id}
                      onClick={() => informPayment(payment)}
                    >
                      Já realizei o pagamento
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {feedback && <p className="rounded-md bg-white/8 p-3 text-sm text-slate-200">{feedback}</p>}
    </div>
  )
}
