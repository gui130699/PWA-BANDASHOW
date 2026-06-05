import { Copy, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card, Loading, StatusBadge, Textarea } from '../../components/ui'
import { useDocument } from '../../hooks/useDocument'
import { informDepositPayment } from '../../services/quoteService'
import { getSettings } from '../../services/settingsService'
import type { Quote, Settings } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'

export function ClientQuoteDetailPage() {
  const { id } = useParams()
  const { data: quote, loading } = useDocument<Quote>('quotes', id)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [message, setMessage] = useState('')
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings(null))
  }, [])

  if (loading) return <Loading />
  if (!quote) return <Card title="Orcamento nao encontrado" />

  async function copyPixKey() {
    if (!settings?.pixKey) return
    await navigator.clipboard.writeText(settings.pixKey)
    setFeedback('Chave Pix copiada.')
  }

  async function informPayment() {
    if (!quote) return
    setSubmitting(true)
    try {
      await informDepositPayment(quote, message)
      setFeedback('Pagamento informado. O admin fara a conferencia manual.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel informar o pagamento.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card
        action={<StatusBadge status={quote.status} />}
        description={`${quote.event.type} em ${formatDate(quote.event.date)} - ${quote.event.city}/${quote.event.state}`}
        title={`Orcamento de ${quote.clientSnapshot.name}`}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-slate-400">Total aprovado/estimado</p>
            <p className="text-2xl font-semibold text-white">{formatCurrency(quote.total)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Entrada 50%</p>
            <p className="text-2xl font-semibold text-gold-300">{formatCurrency(quote.depositAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Restante 50%</p>
            <p className="text-2xl font-semibold text-white">{formatCurrency(quote.remainingAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Servicos</p>
            <p className="text-2xl font-semibold text-white">{quote.items.length}</p>
          </div>
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

      {quote.status === 'aprovado_aguardando_entrada' && (
        <Card description="A confirmacao e feita manualmente pela administracao apos conferencia." title="Pagamento de entrada via Pix">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Recebedor</p>
              <p className="font-semibold text-white">{settings?.pixReceiverName || 'Nao configurado'}</p>
              <p className="mt-3 text-sm text-slate-400">Chave Pix</p>
              <p className="break-all font-semibold text-gold-300">{settings?.pixKey || 'Nao configurada'}</p>
              <p className="mt-3 text-sm text-slate-400">Banco</p>
              <p className="font-semibold text-white">{settings?.bankName || '-'}</p>
            </div>
            <div className="space-y-4">
              <Textarea
                label="Observacao ou referencia do comprovante"
                onChange={(event) => setMessage(event.target.value)}
                value={message}
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button icon={<Copy className="h-4 w-4" />} onClick={copyPixKey} variant="secondary">
                  Copiar chave Pix
                </Button>
                <Button icon={<Send className="h-4 w-4" />} isLoading={submitting} onClick={informPayment}>
                  Ja realizei o pagamento
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {feedback && <p className="rounded-md bg-white/8 p-3 text-sm text-slate-200">{feedback}</p>}
    </div>
  )
}
