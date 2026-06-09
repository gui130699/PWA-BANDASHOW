import { where } from 'firebase/firestore'
import { Copy, Send } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge, Button, Card, Loading, QuoteTimeline, StatusBadge, Textarea } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { useDocument } from '../../hooks/useDocument'
import { clientMarkPaymentAsPaid } from '../../services/paymentService'
import { getPublicSettings } from '../../services/settingsService'
import type { ClientQuoteView, Payment, PublicSettings } from '../../types'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'
import { formatCurrency, formatDate } from '../../utils/format'

function paymentLabel(type: Payment['type']) {
  if (type === 'entrada' || type === 'entrada_50') return 'Entrada'
  if (type === 'restante' || type === 'restante_50') return 'Restante'
  return 'Outro pagamento'
}

function statusMessage(status: ClientQuoteView['status']) {
  const messages: Record<ClientQuoteView['status'], string> = {
    em_analise: 'Seu orcamento esta em analise.',
    aprovado_aguardando_entrada: 'Seu orcamento foi aprovado. Agora realize o pagamento da entrada.',
    entrada_informada_pelo_cliente: 'Pagamento informado. Aguarde confirmacao do Grupo Dvanera.',
    agendado: 'Entrada confirmada. Seu evento esta agendado.',
    realizado: 'Evento realizado. Obrigado por escolher o Grupo Dvanera.',
    recusado: 'Este orcamento foi recusado.',
    cancelado: 'Este evento foi cancelado.',
  }

  return messages[status]
}

export function ClientQuoteDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data: quote, loading } = useDocument<ClientQuoteView>('clientQuoteViews', id)
  const paymentConstraints = useMemo(
    () => [where('clientId', '==', user?.uid || '')],
    [user?.uid],
  )
  const { data: clientPayments } = useCollection<Payment>('payments', paymentConstraints)
  const payments = useMemo(
    () => clientPayments.filter((payment) => payment.quoteId === id),
    [clientPayments, id],
  )
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState('')
  const [submittingId, setSubmittingId] = useState('')

  useEffect(() => {
    getPublicSettings().then(setSettings).catch(() => setSettings(null))
  }, [])

  if (loading) return <Loading />
  if (!quote) return <Card title="Orcamento nao encontrado" />

  async function copyPixKey(pixKey?: string) {
    const key = pixKey || settings?.pixKey
    if (!key) {
      setFeedback('A chave Pix ainda nao foi configurada. Fale com a administracao.')
      return
    }
    await navigator.clipboard.writeText(key)
    setFeedback('Chave Pix copiada.')
  }

  async function informPayment(payment: Payment) {
    setSubmittingId(payment.id)
    setFeedback('')
    try {
      await clientMarkPaymentAsPaid(payment, messages[payment.id] || '')
      setFeedback('Pagamento informado. O Grupo Dvanera fara a conferencia manual.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Nao foi possivel informar o pagamento.'))
    } finally {
      setSubmittingId('')
    }
  }

  return (
    <div className="space-y-6">
      <Card
        action={<StatusBadge status={quote.status} />}
        description={`${quote.event.type} em ${formatDate(quote.event.date)} - ${quote.event.city}/${quote.event.state}`}
        title={`Orcamento de ${quote.clientSnapshot.name}`}
      >
        <p className="mb-5 rounded-md bg-white/8 p-3 text-sm text-slate-200">{statusMessage(quote.status)}</p>
        <div className="mb-7 border-b border-white/10 pb-6">
          <QuoteTimeline status={quote.status} />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-slate-400">Total aprovado/estimado</p>
            <p className="text-2xl font-semibold text-white">{formatCurrency(quote.total)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Entrada de {quote.depositPercent}%</p>
            <p className="text-2xl font-semibold text-gold-300">{formatCurrency(quote.depositAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Restante de {100 - quote.depositPercent}%</p>
            <p className="text-2xl font-semibold text-white">{formatCurrency(quote.remainingAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Servicos</p>
            <p className="text-2xl font-semibold text-white">{quote.items.length}</p>
          </div>
        </div>
      </Card>

      <Card title="Dados do evento">
        <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
          <p><strong className="text-white">Data:</strong> {formatDate(quote.event.date)} as {quote.event.time}</p>
          <p><strong className="text-white">Tipo:</strong> {quote.event.type}</p>
          <p><strong className="text-white">Local:</strong> {quote.event.venueName}</p>
          <p><strong className="text-white">Cidade:</strong> {quote.event.city}/{quote.event.state}</p>
          <p className="md:col-span-2"><strong className="text-white">Endereco:</strong> {quote.event.address}</p>
        </div>
      </Card>

      <Card title="Servicos contratados">
        <div className="divide-y divide-white/10">
          {quote.items.map((item) => (
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between" key={item.serviceId}>
              <div>
                <p className="font-medium text-white">{item.serviceName}</p>
                <p className="text-sm text-slate-400">Quantidade: {item.quantity}</p>
              </div>
              <p className="font-semibold text-gold-300">{formatCurrency(item.totalPrice)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card description="A confirmacao e feita manualmente pela administracao apos conferencia." title="Pagamentos">
        <div className="space-y-4">
          {payments.length === 0 ? (
            <p className="text-sm text-slate-400">Os pagamentos aparecem quando o orcamento for aprovado.</p>
          ) : (
            payments.map((payment) => (
              <div className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 lg:grid-cols-[1fr_1.1fr]" key={payment.id}>
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white">{paymentLabel(payment.type)}</h3>
                    <Badge className="bg-white/8 text-slate-200 ring-white/10">{payment.status.replaceAll('_', ' ')}</Badge>
                  </div>
                  <p className="text-2xl font-semibold text-gold-300">{formatCurrency(payment.amount)}</p>
                  <p className="mt-3 text-sm text-slate-400">Recebedor</p>
                  <p className="font-semibold text-white">{settings?.pixReceiverName || 'Nao configurado'}</p>
                  <p className="mt-3 text-sm text-slate-400">Chave Pix</p>
                  <p className="break-all font-semibold text-gold-300">{payment.pixKeyUsed || settings?.pixKey || 'Nao configurada'}</p>
                  <p className="mt-3 text-sm text-slate-400">Banco</p>
                  <p className="font-semibold text-white">{settings?.bankName || '-'}</p>
                </div>
                <div className="space-y-4">
                  <Textarea
                    disabled={payment.status === 'confirmado'}
                    label="Observacao ou referencia do comprovante"
                    onChange={(event) => setMessages((current) => ({ ...current, [payment.id]: event.target.value }))}
                    value={messages[payment.id] || payment.clientMessage || ''}
                  />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      disabled={!payment.pixKeyUsed && !settings?.pixKey}
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
                      Ja realizei o pagamento
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {feedback && <p className="rounded-md bg-white/8 p-3 text-sm text-slate-200">{feedback}</p>}
    </div>
  )
}
