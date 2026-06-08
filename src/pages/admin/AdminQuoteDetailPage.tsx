import { where } from 'firebase/firestore'
import { CheckCircle2, CircleDollarSign, RefreshCcw, Save, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card, DataTable, Input, Loading, StatusBadge, Textarea } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { useDocument } from '../../hooks/useDocument'
import type { CostSnapshot, Payment, Quote, QuoteItem, Settings } from '../../types'
import { calculateQuoteTotals } from '../../utils/calculations'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'
import { formatCurrency, formatDate, formatPercent } from '../../utils/format'
import {
  approveQuote,
  cancelQuote,
  createFinalPayment,
  markQuoteAsDone,
  recalculateQuote,
  rejectQuote,
  updateQuoteFinancials,
} from '../../services/quoteService'
import { getSettings } from '../../services/settingsService'
import { confirmPayment } from '../../services/paymentService'

const emptyManualCost: CostSnapshot = {
  type: 'manual',
  name: '',
  cost: 0,
  notes: '',
}

export function AdminQuoteDetailPage() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const { data: quote, loading } = useDocument<Quote>('quotes', id)
  const paymentConstraints = useMemo(() => [where('quoteId', '==', id || '')], [id])
  const { data: payments } = useCollection<Payment>('payments', paymentConstraints)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [manualCosts, setManualCosts] = useState<CostSnapshot[]>([])
  const [manualCostForm, setManualCostForm] = useState<CostSnapshot>(emptyManualCost)
  const [discount, setDiscount] = useState(0)
  const [travelFee, setTravelFee] = useState(0)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings(null))
  }, [])

  useEffect(() => {
    if (!quote) return
    setItems(quote.items)
    setManualCosts(quote.manualCosts || [])
    setDiscount(quote.discount || 0)
    setTravelFee(quote.travelFee || 0)
    setAdminNotes(quote.adminNotes || '')
  }, [quote])

  if (loading) return <Loading />
  if (!quote) return <Card title="Orcamento nao encontrado" />

  const totals = calculateQuoteTotals(
    items,
    discount,
    travelFee,
    manualCosts,
    settings?.defaultDepositPercent || quote.depositPercent,
  )
  const editableQuote: Quote = { ...quote, items, manualCosts, discount, travelFee, adminNotes, ...totals }
  const actor = { userId: user?.uid || 'admin', userName: profile?.name || 'Admin' }
  const depositPayment = payments.find((payment) => payment.type === 'entrada' || payment.type === 'entrada_50')

  function updateItem(index: number, patch: Partial<QuoteItem>) {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item
        const next = { ...item, ...patch }
        return { ...next, totalPrice: next.quantity * next.unitPrice }
      }),
    )
  }

  async function runAction(action: () => Promise<void>, successMessage: string) {
    setSaving(true)
    setFeedback('')
    try {
      await action()
      setFeedback(successMessage)
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'A operacao nao foi concluida.'))
    } finally {
      setSaving(false)
    }
  }

  function addManualCost() {
    if (!manualCostForm.name || manualCostForm.cost <= 0) return
    setManualCosts((current) => [...current, manualCostForm])
    setManualCostForm(emptyManualCost)
  }

  return (
    <div className="space-y-6">
      <Card
        action={<StatusBadge status={quote.status} />}
        description={`${quote.event.type} em ${formatDate(quote.event.date)} - ${quote.event.venueName}`}
        title={`Analise de ${quote.clientSnapshot.name}`}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div>
            <p className="text-sm text-slate-400">Subtotal</p>
            <p className="text-xl font-semibold">{formatCurrency(totals.subtotal)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Total final</p>
            <p className="text-xl font-semibold text-gold-300">{formatCurrency(totals.total)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Custos internos</p>
            <p className="text-xl font-semibold">{formatCurrency(totals.totalCosts)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Lucro estimado</p>
            <p className="text-xl font-semibold text-emerald-200">{formatCurrency(totals.estimatedProfit)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Margem</p>
            <p className="text-xl font-semibold">{formatPercent(totals.estimatedMargin)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Entrada</p>
            <p className="text-xl font-semibold">{totals.depositPercent}%</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card description="Edite quantidade e valor aprovado por item." title="Servicos do orcamento">
          <div className="space-y-4">
            {items.map((item, index) => (
              <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[1fr_7rem_9rem_9rem]" key={item.serviceId}>
                <div>
                  <p className="font-semibold text-white">{item.serviceName}</p>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
                <Input label="Qtd." min={1} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} type="number" value={item.quantity} />
                <Input label="Valor unit." min={0} onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) })} type="number" value={item.unitPrice} />
                <div>
                  <p className="text-sm text-slate-400">Total</p>
                  <p className="mt-2 font-semibold text-gold-300">{formatCurrency(item.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Ajustes comerciais">
          <div className="grid gap-4">
            <Input label="Desconto" min={0} onChange={(event) => setDiscount(Number(event.target.value))} type="number" value={discount} />
            <Input label="Taxa de deslocamento" min={0} onChange={(event) => setTravelFee(Number(event.target.value))} type="number" value={travelFee} />
            <Textarea label="Observacoes internas" onChange={(event) => setAdminNotes(event.target.value)} value={adminNotes} />
            <Button
              icon={<Save className="h-4 w-4" />}
              isLoading={saving}
              onClick={() => runAction(() => updateQuoteFinancials(quote, { items, manualCosts, discount, travelFee, adminNotes }, settings || undefined, actor), 'Orcamento atualizado.')}
            >
              Salvar ajustes
            </Button>
            <Button
              icon={<RefreshCcw className="h-4 w-4" />}
              isLoading={saving}
              onClick={() => runAction(() => recalculateQuote(quote.id, settings || undefined, actor), 'Custos internos recalculados.')}
              variant="secondary"
            >
              Recalcular custos
            </Button>
          </div>
        </Card>
      </div>

      <Card description="Custos visiveis somente no painel administrativo." title="Custos internos">
        <div className="grid gap-4 md:grid-cols-[1fr_10rem_1fr_auto]">
          <Input label="Nome do custo" onChange={(event) => setManualCostForm((current) => ({ ...current, name: event.target.value }))} value={manualCostForm.name} />
          <Input label="Valor" min={0} onChange={(event) => setManualCostForm((current) => ({ ...current, cost: Number(event.target.value) }))} type="number" value={manualCostForm.cost} />
          <Input label="Observacao" onChange={(event) => setManualCostForm((current) => ({ ...current, notes: event.target.value }))} value={manualCostForm.notes} />
          <div className="flex items-end">
            <Button className="w-full" onClick={addManualCost} variant="secondary">
              Adicionar
            </Button>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {manualCosts.map((cost, index) => (
            <div className="flex items-center justify-between gap-3 rounded-md bg-white/[0.04] px-3 py-2 text-sm" key={`${cost.name}-${index}`}>
              <span>{cost.name}</span>
              <strong>{formatCurrency(cost.cost)}</strong>
              <Button className="h-9 px-3" onClick={() => setManualCosts((current) => current.filter((_, costIndex) => costIndex !== index))} variant="ghost">
                Remover
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Pagamentos vinculados">
        <DataTable
          columns={[
            { header: 'Tipo', cell: (payment) => payment.type.replace('_', ' ') },
            { header: 'Valor', cell: (payment) => formatCurrency(payment.amount) },
            { header: 'Status', cell: (payment) => payment.status.replaceAll('_', ' ') },
            { header: 'Pix', cell: (payment) => payment.pixKeyUsed || '-' },
            {
              header: 'Acao',
              cell: (payment) => (
                <Button
                  className="h-9 px-3"
                  disabled={payment.status === 'confirmado'}
                  onClick={() => runAction(() => confirmPayment(payment.id, actor), 'Pagamento confirmado.')}
                  variant="success"
                >
                  Confirmar
                </Button>
              ),
            },
          ]}
          data={payments}
          emptyTitle="Nenhum pagamento gerado"
          getRowKey={(payment) => payment.id}
        />
      </Card>

      <Card title="Decisao e status">
        <div className="grid gap-4">
          <Textarea label="Motivo da recusa" onChange={(event) => setRejectionReason(event.target.value)} value={rejectionReason} />
          <div className="flex flex-wrap gap-3">
            <Button
              icon={<CheckCircle2 className="h-4 w-4" />}
              isLoading={saving}
              onClick={() => runAction(async () => {
                await updateQuoteFinancials(quote, { items, manualCosts, discount, travelFee, adminNotes }, settings || undefined, actor)
                await approveQuote(editableQuote, settings || undefined, actor)
              }, 'Orcamento aprovado e entrada Pix gerada.')}
              variant="success"
            >
              Aprovar
            </Button>
            <Button
              disabled={!rejectionReason}
              icon={<XCircle className="h-4 w-4" />}
              isLoading={saving}
              onClick={() => runAction(() => rejectQuote(quote.id, rejectionReason, actor), 'Orcamento recusado.')}
              variant="danger"
            >
              Reprovar
            </Button>
            <Button
              disabled={quote.status !== 'entrada_informada_pelo_cliente'}
              icon={<CircleDollarSign className="h-4 w-4" />}
              isLoading={saving}
              onClick={() => runAction(() => {
                if (!depositPayment) throw new Error('Pagamento de entrada nao encontrado.')
                return confirmPayment(depositPayment.id, actor)
              }, 'Entrada confirmada e evento agendado.')}
              variant="primary"
            >
              Confirmar entrada
            </Button>
            <Button
              disabled={quote.status !== 'agendado'}
              isLoading={saving}
              onClick={() => runAction(async () => {
                await createFinalPayment(quote, settings || undefined)
              }, 'Pagamento restante gerado.')}
              variant="secondary"
            >
              Gerar restante
            </Button>
            <Button
              disabled={quote.status !== 'agendado'}
              isLoading={saving}
              onClick={() => runAction(() => markQuoteAsDone(quote.id, actor), 'Evento marcado como realizado.')}
              variant="secondary"
            >
              Marcar realizado
            </Button>
            <Button isLoading={saving} onClick={() => runAction(() => cancelQuote(quote.id, actor), 'Orcamento cancelado.')} variant="ghost">
              Cancelar
            </Button>
          </div>
        </div>
      </Card>

      {feedback && <p className="rounded-md bg-white/8 p-3 text-sm text-slate-200">{feedback}</p>}
    </div>
  )
}
