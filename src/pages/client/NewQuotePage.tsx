import { doc, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { ArrowLeft, ArrowRight, Check, Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, DateInput, EmptyState, Input, PageHeader, Select, Textarea } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { useDocument } from '../../hooks/useDocument'
import { requireDb } from '../../lib/firebase'
import { createClientQuote } from '../../services/quoteService'
import type { Client, PublicService, QuoteEvent, QuoteItem } from '../../types'
import { brazilianStates, eventTypes } from '../../utils/constants'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'
import { formatCurrency } from '../../utils/format'

type SelectedService = {
  service: PublicService
  quantity: number
}

const emptyClient = {
  id: '',
  userId: '',
  name: '',
  document: '',
  phone: '',
  email: '',
  city: '',
  state: '',
  notes: '',
}

const emptyEvent: QuoteEvent = {
  date: '',
  time: '',
  type: '',
  venueName: '',
  address: '',
  city: '',
  state: '',
  estimatedGuests: 0,
  notes: '',
}

const stepLabels = ['Seus dados', 'Evento', 'Servicos', 'Revisao']

export function NewQuotePage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [clientForm, setClientForm] = useState<Client>(emptyClient)
  const [eventForm, setEventForm] = useState<QuoteEvent>(emptyEvent)
  const [selected, setSelected] = useState<Record<string, SelectedService>>({})
  const [clientNotes, setClientNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const serviceConstraints = useMemo(() => [where('active', '==', true)], [])
  const { data: services, loading: servicesLoading } = useCollection<PublicService>('publicServices', serviceConstraints)
  const { data: client } = useDocument<Client>('clients', user?.uid)

  useEffect(() => {
    if (client) setClientForm(client)
    if (!client && user && profile) {
      setClientForm({
        ...emptyClient,
        id: user.uid,
        userId: user.uid,
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
      })
    }
  }, [client, profile, user])

  const selectedItems = Object.values(selected)
  const subtotal = selectedItems.reduce((sum, item) => sum + item.service.basePrice * item.quantity, 0)

  function updateClient<K extends keyof Client>(key: K, value: Client[K]) {
    setClientForm((current) => ({ ...current, [key]: value }))
  }

  function updateEvent<K extends keyof QuoteEvent>(key: K, value: QuoteEvent[K]) {
    setEventForm((current) => ({ ...current, [key]: value }))
  }

  function toggleService(service: PublicService) {
    setSelected((current) => {
      if (current[service.id]) {
        const copy = { ...current }
        delete copy[service.id]
        return copy
      }

      return { ...current, [service.id]: { service, quantity: 1 } }
    })
  }

  function changeQuantity(serviceId: string, delta: number) {
    setSelected((current) => {
      const item = current[serviceId]
      if (!item) return current

      return {
        ...current,
        [serviceId]: { ...item, quantity: Math.max(item.quantity + delta, 1) },
      }
    })
  }

  function validateStep() {
    if (step === 1) {
      return clientForm.name && clientForm.document && clientForm.phone && clientForm.email && clientForm.city && clientForm.state
    }
    if (step === 2) {
      return eventForm.date && eventForm.time && eventForm.type && eventForm.venueName && eventForm.address && eventForm.city && eventForm.state
    }
    if (step === 3) return selectedItems.length > 0
    return true
  }

  async function submitQuote() {
    if (!user) return
    setError('')
    setSubmitting(true)

    try {
      const database = requireDb()
      const clientId = user.uid
      const clientPayload = {
        userId: user.uid,
        name: clientForm.name,
        document: clientForm.document,
        phone: clientForm.phone,
        email: clientForm.email,
        city: clientForm.city,
        state: clientForm.state,
        notes: clientForm.notes || '',
        updatedAt: serverTimestamp(),
      }
      const clientQuotePayload: Client = {
        id: clientId,
        userId: user.uid,
        name: clientForm.name,
        document: clientForm.document,
        phone: clientForm.phone,
        email: clientForm.email,
        city: clientForm.city,
        state: clientForm.state,
        notes: clientForm.notes || '',
      }
      const items: QuoteItem[] = selectedItems.map(({ service, quantity }) => ({
        serviceId: service.id,
        serviceName: service.name,
        description: service.description,
        quantity,
        unitPrice: service.basePrice,
        totalPrice: service.basePrice * quantity,
        costSnapshot: [],
      }))
      await setDoc(
        doc(database, 'clients', clientId),
        {
          ...clientPayload,
          createdAt: client?.createdAt || serverTimestamp(),
        },
        { merge: true },
      )

      const quoteRef = await createClientQuote({
        client: clientQuotePayload,
        event: eventForm,
        items,
        clientNotes,
      })

      navigate(`/cliente/orcamentos/${quoteRef.id}`)
    } catch (submitError) {
      setError(getFriendlyFirebaseError(submitError, 'Nao foi possivel enviar o orcamento.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Preencha as etapas abaixo. Voce podera revisar tudo antes do envio."
        eyebrow="Nova solicitacao"
        title="Monte seu orcamento"
      />
      <Card>
        <div className="grid grid-cols-4 gap-2">
          {stepLabels.map((label, index) => {
            const item = index + 1
            const active = step === item
            const completed = step > item
            return (
              <div className="min-w-0" key={label}>
                <div className={completed || active ? 'h-1 rounded-full bg-gold-400' : 'h-1 rounded-full bg-white/10'} />
                <p className={active ? 'mt-2 truncate text-xs font-semibold text-gold-300' : 'mt-2 truncate text-xs text-slate-500'}>
                  <span className="hidden sm:inline">{item}. </span>{label}
                </p>
              </div>
            )
          })}
        </div>
      </Card>

      {step === 1 && (
        <Card description="Confirme seus dados para que a equipe consiga retornar." title="Cadastro do cliente">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Nome completo" onChange={(event) => updateClient('name', event.target.value)} value={clientForm.name} wrapperClassName="md:col-span-2" />
            <Input label="CPF ou CNPJ" onChange={(event) => updateClient('document', event.target.value)} value={clientForm.document} />
            <Input label="Telefone/WhatsApp" onChange={(event) => updateClient('phone', event.target.value)} value={clientForm.phone} />
            <Input label="E-mail" onChange={(event) => updateClient('email', event.target.value)} type="email" value={clientForm.email} />
            <Input label="Cidade" onChange={(event) => updateClient('city', event.target.value)} value={clientForm.city} />
            <Select label="Estado" onChange={(event) => updateClient('state', event.target.value)} options={brazilianStates.map((state) => ({ label: state, value: state }))} placeholder="Selecione" value={clientForm.state} />
            <Textarea label="Observacoes" onChange={(event) => updateClient('notes', event.target.value)} value={clientForm.notes} wrapperClassName="md:col-span-2" />
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card description="Informe data, local e caracteristicas do evento." title="Dados do evento">
          <div className="grid gap-4 md:grid-cols-2">
            <DateInput label="Data do evento" onChange={(value) => updateEvent('date', value)} value={eventForm.date} />
            <Input label="Horario previsto" onChange={(event) => updateEvent('time', event.target.value)} type="time" value={eventForm.time} />
            <Select label="Tipo de evento" onChange={(event) => updateEvent('type', event.target.value)} options={eventTypes.map((type) => ({ label: type, value: type }))} placeholder="Selecione" value={eventForm.type} />
            <Input label="Nome do local" onChange={(event) => updateEvent('venueName', event.target.value)} value={eventForm.venueName} />
            <Input label="Endereco completo" onChange={(event) => updateEvent('address', event.target.value)} value={eventForm.address} wrapperClassName="md:col-span-2" />
            <Input label="Cidade" onChange={(event) => updateEvent('city', event.target.value)} value={eventForm.city} />
            <Select label="Estado" onChange={(event) => updateEvent('state', event.target.value)} options={brazilianStates.map((state) => ({ label: state, value: state }))} placeholder="Selecione" value={eventForm.state} />
            <Input label="Quantidade estimada de pessoas" min={0} onChange={(event) => updateEvent('estimatedGuests', Number(event.target.value))} type="number" value={eventForm.estimatedGuests} />
            <Textarea label="Observacoes do evento" onChange={(event) => updateEvent('notes', event.target.value)} value={eventForm.notes} wrapperClassName="md:col-span-2" />
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card description="Selecione um ou mais servicos ativos." title="Servicos desejados">
          {services.length === 0 && !servicesLoading ? (
            <EmptyState
              description="O admin precisa cadastrar e ativar os servicos antes do cliente solicitar."
              title="Nenhum servico ativo"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => {
                const isSelected = Boolean(selected[service.id])
                return (
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4" key={service.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-white">{service.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">{service.description}</p>
                      </div>
                      <p className="font-semibold text-gold-300">{formatCurrency(service.basePrice)}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <Button onClick={() => toggleService(service)} variant={isSelected ? 'success' : 'secondary'}>
                        {isSelected ? 'Selecionado' : 'Selecionar'}
                      </Button>
                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <Button aria-label="Diminuir quantidade" className="h-10 w-10 px-0" onClick={() => changeQuantity(service.id, -1)} variant="ghost">
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold">{selected[service.id].quantity}</span>
                          <Button aria-label="Aumentar quantidade" className="h-10 w-10 px-0" onClick={() => changeQuantity(service.id, 1)} variant="ghost">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {step === 4 && (
        <Card description="Confira tudo antes de enviar para analise do Grupo Dvanera." title="Revisao">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2 text-sm text-slate-300">
              <p><strong className="text-white">Cliente:</strong> {clientForm.name}</p>
              <p><strong className="text-white">Contato:</strong> {clientForm.phone} - {clientForm.email}</p>
              <p><strong className="text-white">Evento:</strong> {eventForm.type} em {eventForm.date} as {eventForm.time}</p>
              <p><strong className="text-white">Local:</strong> {eventForm.venueName}, {eventForm.city}/{eventForm.state}</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] p-4">
              {selectedItems.map(({ service, quantity }) => (
                <div className="flex justify-between gap-3 border-b border-white/10 py-2 text-sm" key={service.id}>
                  <span>{service.name} x {quantity}</span>
                  <strong>{formatCurrency(service.basePrice * quantity)}</strong>
                </div>
              ))}
              <div className="mt-4 flex justify-between text-lg font-semibold text-gold-300">
                <span>Valor estimado</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </div>
          <Textarea
            label="Observacao para o Grupo Dvanera"
            onChange={(event) => setClientNotes(event.target.value)}
            value={clientNotes}
          />
          <p className="mt-4 rounded-md bg-gold-300/10 p-4 text-sm leading-6 text-gold-50">
            Sua solicitacao sera enviada para analise do Grupo Dvanera. Apos aprovacao, sera
            liberado o pagamento da entrada via Pix conforme percentual configurado.
          </p>
        </Card>
      )}

      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button disabled={step === 1} icon={<ArrowLeft className="h-4 w-4" />} onClick={() => setStep((current) => Math.max(current - 1, 1))} variant="secondary">
          Voltar
        </Button>
        {step < 4 ? (
          <Button disabled={!validateStep()} icon={<ArrowRight className="h-4 w-4" />} onClick={() => setStep((current) => current + 1)}>
            Continuar
          </Button>
        ) : (
          <Button icon={<Check className="h-4 w-4" />} isLoading={submitting} onClick={submitQuote}>
            Enviar para analise
          </Button>
        )}
      </div>
    </div>
  )
}
