import { collection, getDocs } from 'firebase/firestore'
import { Edit, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Modal,
  PageTabs,
  RegistrationReviewModal,
  Select,
  Textarea,
} from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { useDocument } from '../../hooks/useDocument'
import { requireDb } from '../../lib/firebase'
import { createService, removeService, updateService } from '../../services/serviceService'
import { createAuditLog } from '../../services/auditService'
import type {
  BandMember,
  MemberCostLink,
  Quote,
  Service,
  Settings,
  Supplier,
  SupplierLink,
} from '../../types'
import { serviceCategories } from '../../utils/constants'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'
import { formatCurrency } from '../../utils/format'

const emptyService: Omit<Service, 'id'> = {
  name: '',
  description: '',
  category: 'Show',
  basePrice: 0,
  active: true,
  allowPriceEdit: true,
  supplierLinks: [],
  memberCostLinks: [],
  internalNotes: '',
}

type ServicesTab = 'access' | 'registration'
type ServiceFormErrors = Partial<Record<'name' | 'category' | 'basePrice' | 'description', string>>

export function AdminServicesPage() {
  const { user, profile } = useAuth()
  const { data: services, loading } = useCollection<Service>('services')
  const { data: suppliers } = useCollection<Supplier>('suppliers')
  const { data: members } = useCollection<BandMember>('bandMembers')
  const { data: settings } = useDocument<Settings>('settings', 'main')
  const [form, setForm] = useState(emptyService)
  const [editingId, setEditingId] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [supplierCost, setSupplierCost] = useState(0)
  const [memberId, setMemberId] = useState('')
  const [memberCost, setMemberCost] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [activeTab, setActiveTab] = useState<ServicesTab>('access')
  const [formErrors, setFormErrors] = useState<ServiceFormErrors>({})
  const [reviewOpen, setReviewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const configuredServiceTypes = useMemo(
    () => (settings?.serviceTypes?.length ? settings.serviceTypes : serviceCategories),
    [settings?.serviceTypes],
  )
  const serviceTypeOptions = useMemo(
    () =>
      editingId && form.category && !configuredServiceTypes.includes(form.category)
        ? [form.category, ...configuredServiceTypes]
        : configuredServiceTypes,
    [configuredServiceTypes, editingId, form.category],
  )

  useEffect(() => {
    if (
      !editingId &&
      configuredServiceTypes.length > 0 &&
      !configuredServiceTypes.includes(form.category)
    ) {
      setForm((current) => ({ ...current, category: configuredServiceTypes[0] }))
    }
  }, [configuredServiceTypes, editingId, form.category])

  const filtered = useMemo(
    () =>
      services
        .filter((service) => (filter === 'all' ? true : filter === 'active' ? service.active : !service.active))
        .filter((service) => service.name.toLowerCase().includes(search.toLowerCase())),
    [filter, search, services],
  )

  function resetForm() {
    setForm({
      ...emptyService,
      category: configuredServiceTypes[0] || '',
    })
    setEditingId('')
    setSupplierId('')
    setMemberId('')
    setSupplierCost(0)
    setMemberCost(0)
    setFormErrors({})
  }

  function changeTab(tab: ServicesTab) {
    if (tab === activeTab) return
    if (tab === 'registration') resetForm()
    setFeedback('')
    setActiveTab(tab)
  }

  function updateForm<K extends keyof Omit<Service, 'id'>>(
    key: K,
    value: Omit<Service, 'id'>[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
    if (key in formErrors) {
      setFormErrors((current) => ({ ...current, [key]: undefined }))
    }
  }

  function validateService(candidate: Omit<Service, 'id'>) {
    const errors: ServiceFormErrors = {}
    if (!candidate.name.trim()) errors.name = 'Informe o nome do servico.'
    if (!candidate.category.trim()) errors.category = 'Selecione o tipo do servico.'
    if (!candidate.description.trim()) errors.description = 'Informe uma descricao do servico.'
    if (!Number.isFinite(candidate.basePrice) || candidate.basePrice <= 0) {
      errors.basePrice = 'Informe um valor maior que zero.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function normalizedForm() {
    return {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      internalNotes: form.internalNotes?.trim() || '',
    }
  }

  function edit(service: Service) {
    setFeedback('')
    setFormErrors({})
    setEditingId(service.id)
    setForm({
      name: service.name,
      description: service.description,
      category: service.category,
      basePrice: service.basePrice,
      active: service.active,
      allowPriceEdit: service.allowPriceEdit,
      supplierLinks: service.supplierLinks || [],
      memberCostLinks: service.memberCostLinks || [],
      internalNotes: service.internalNotes || '',
    })
    setEditOpen(true)
  }

  function requestCreate() {
    setFeedback('')
    const candidate = normalizedForm()
    setForm(candidate)
    if (!validateService(candidate)) {
      setFeedback('Revise os campos obrigatorios antes de continuar.')
      return
    }
    setReviewOpen(true)
  }

  async function createConfirmed() {
    setSaving(true)
    setFeedback('')
    try {
      const reference = await createService(form)
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: 'service_created',
        entity: 'services',
        entityId: reference.id,
        description: `Servico ${form.name} criado.`,
      }).catch(() => undefined)
      setReviewOpen(false)
      resetForm()
      setActiveTab('access')
      setFeedback('Servico criado.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Nao foi possivel salvar o servico.'))
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit() {
    setFeedback('')
    const candidate = normalizedForm()
    setForm(candidate)
    if (!editingId || !validateService(candidate)) {
      setFeedback('Revise os campos obrigatorios antes de salvar.')
      return
    }

    setSaving(true)
    try {
      await updateService(editingId, candidate)
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: 'service_updated',
        entity: 'services',
        entityId: editingId,
        description: `Servico ${candidate.name} atualizado.`,
      }).catch(() => undefined)
      setEditOpen(false)
      resetForm()
      setFeedback('Servico atualizado.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Nao foi possivel atualizar o servico.'))
    } finally {
      setSaving(false)
    }
  }

  function addSupplierLink() {
    const supplier = suppliers.find((item) => item.id === supplierId)
    if (!supplier || supplierCost <= 0) return
    const link: SupplierLink = {
      supplierId: supplier.id,
      supplierName: supplier.name,
      cost: supplierCost,
      description: supplier.type,
    }
    setForm((current) => ({ ...current, supplierLinks: [...current.supplierLinks, link] }))
    setSupplierId('')
    setSupplierCost(0)
  }

  function addMemberLink() {
    const member = members.find((item) => item.id === memberId)
    if (!member || memberCost <= 0) return
    const link: MemberCostLink = {
      memberId: member.id,
      memberName: member.name,
      cost: memberCost,
      description: member.role,
    }
    setForm((current) => ({ ...current, memberCostLinks: [...current.memberCostLinks, link] }))
    setMemberId('')
    setMemberCost(0)
  }

  async function removeIfUnused(service: Service) {
    setFeedback('')
    try {
      const snapshot = await getDocs(collection(requireDb(), 'quotes'))
      const linked = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as Quote)
        .some((quote) => quote.items.some((quoteItem) => quoteItem.serviceId === service.id))

      if (linked) {
        setFeedback('Servico vinculado a orcamento. Desative para preservar o historico.')
        return
      }

      await removeService(service.id)
      setFeedback('Servico excluido.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Nao foi possivel excluir.'))
    }
  }

  function closeEdit() {
    setEditOpen(false)
    resetForm()
  }

  function renderServiceFields() {
    return (
      <>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            error={formErrors.name}
            label="Nome do servico *"
            onChange={(event) => updateForm('name', event.target.value)}
            required
            value={form.name}
          />
          <Select
            error={formErrors.category}
            label="Tipo do servico *"
            onChange={(event) => updateForm('category', event.target.value)}
            options={serviceTypeOptions.map((category) => ({ label: category, value: category }))}
            required
            value={form.category}
          />
          <Input
            error={formErrors.basePrice}
            label="Valor padrao *"
            min={0}
            onChange={(event) => updateForm('basePrice', Number(event.target.value))}
            required
            type="number"
            value={form.basePrice}
          />
          <Select
            label="Permitir edicao do valor"
            onChange={(event) => updateForm('allowPriceEdit', event.target.value === 'true')}
            options={[
              { label: 'Sim', value: 'true' },
              { label: 'Nao', value: 'false' },
            ]}
            value={String(form.allowPriceEdit)}
          />
          <Textarea
            error={formErrors.description}
            label="Descricao *"
            onChange={(event) => updateForm('description', event.target.value)}
            required
            value={form.description}
            wrapperClassName="md:col-span-2"
          />
          <Textarea
            label="Observacoes internas"
            onChange={(event) => updateForm('internalNotes', event.target.value)}
            value={form.internalNotes}
            wrapperClassName="md:col-span-2"
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h3 className="font-semibold text-white">Fornecedores vinculados</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_9rem_auto]">
              <Select onChange={(event) => setSupplierId(event.target.value)} options={suppliers.map((item) => ({ label: item.name, value: item.id }))} placeholder="Fornecedor" value={supplierId} />
              <Input min={0} onChange={(event) => setSupplierCost(Number(event.target.value))} type="number" value={supplierCost} />
              <Button onClick={addSupplierLink} variant="secondary">Adicionar</Button>
            </div>
            <div className="mt-3 space-y-2">
              {form.supplierLinks.map((link, index) => (
                <div className="flex justify-between gap-3 rounded-md bg-white/[0.05] px-3 py-2 text-sm" key={`${link.supplierId}-${index}`}>
                  <span>{link.supplierName}</span>
                  <strong>{formatCurrency(link.cost)}</strong>
                  <button className="text-red-200" onClick={() => updateForm('supplierLinks', form.supplierLinks.filter((_, itemIndex) => itemIndex !== index))} type="button">
                    remover
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h3 className="font-semibold text-white">Integrantes vinculados</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_9rem_auto]">
              <Select onChange={(event) => setMemberId(event.target.value)} options={members.map((item) => ({ label: item.name, value: item.id }))} placeholder="Integrante" value={memberId} />
              <Input min={0} onChange={(event) => setMemberCost(Number(event.target.value))} type="number" value={memberCost} />
              <Button onClick={addMemberLink} variant="secondary">Adicionar</Button>
            </div>
            <div className="mt-3 space-y-2">
              {form.memberCostLinks.map((link, index) => (
                <div className="flex justify-between gap-3 rounded-md bg-white/[0.05] px-3 py-2 text-sm" key={`${link.memberId}-${index}`}>
                  <span>{link.memberName}</span>
                  <strong>{formatCurrency(link.cost)}</strong>
                  <button className="text-red-200" onClick={() => updateForm('memberCostLinks', form.memberCostLinks.filter((_, itemIndex) => itemIndex !== index))} type="button">
                    remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <PageTabs
        activeTab={activeTab}
        onChange={changeTab}
        tabs={[
          {
            value: 'access',
            label: 'Acesso',
            description: 'Somente consulta e gestao dos servicos cadastrados',
          },
          {
            value: 'registration',
            label: 'Cadastro',
            description: 'Somente para cadastrar um novo servico',
          },
        ]}
      />

      {feedback && <p className="rounded-md bg-white/8 p-3 text-sm text-slate-200">{feedback}</p>}

      {activeTab === 'registration' ? (
        <Card
          description="Esta area e exclusiva para novos cadastros. Campos com * sao obrigatorios."
          role="tabpanel"
          title="Novo cadastro de servico"
        >
          {renderServiceFields()}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button icon={<Plus className="h-4 w-4" />} onClick={requestCreate}>
              Revisar e cadastrar servico
            </Button>
            <Button icon={<RotateCcw className="h-4 w-4" />} onClick={resetForm} variant="secondary">
              Limpar formulario
            </Button>
          </div>
        </Card>
      ) : (
        <Card
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar" value={search} />
              <Select
                onChange={(event) => setFilter(event.target.value)}
                options={[
                  { label: 'Todos', value: 'all' },
                  { label: 'Ativos', value: 'active' },
                  { label: 'Inativos', value: 'inactive' },
                ]}
                value={filter}
              />
            </div>
          }
          description="Consulte os servicos existentes. A edicao abre em uma janela separada e nao utiliza a aba Cadastro."
          role="tabpanel"
          title="Consulta de servicos cadastrados"
        >
          <DataTable
            columns={[
              { header: 'Servico', cell: (service) => service.name },
              { header: 'Tipo', cell: (service) => service.category },
              { header: 'Valor', cell: (service) => formatCurrency(service.basePrice) },
              {
                header: 'Status',
                cell: (service) => (
                  <Badge className={service.active ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/20' : 'bg-red-500/15 text-red-200 ring-red-300/20'}>
                    {service.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                ),
              },
              {
                header: 'Acoes',
                cell: (service) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      aria-label={`Editar servico ${service.name}`}
                      className="h-9 px-3"
                      icon={<Edit className="h-4 w-4" />}
                      onClick={() => edit(service)}
                      variant="secondary"
                    >
                      Editar
                    </Button>
                    <Button aria-label="Ativar ou desativar" className="h-9 px-3" onClick={() => updateService(service.id, { active: !service.active })} variant="secondary">
                      {service.active ? 'Desativar' : 'Reativar'}
                    </Button>
                    <Button aria-label="Excluir" className="h-9 w-9 px-0" onClick={() => removeIfUnused(service)} variant="danger">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filtered}
            emptyTitle="Nenhum servico cadastrado"
            getRowKey={(service) => service.id}
            loading={loading}
          />
        </Card>
      )}

      <RegistrationReviewModal
        confirmLabel="Confirmar cadastro"
        description="Confira os dados abaixo. O servico somente sera criado depois da sua confirmacao."
        isLoading={saving}
        items={[
          { label: 'Nome', value: form.name },
          { label: 'Tipo', value: form.category },
          { label: 'Descricao', value: form.description },
          { label: 'Valor padrao', value: formatCurrency(form.basePrice) },
          { label: 'Edicao de valor', value: form.allowPriceEdit ? 'Permitida' : 'Nao permitida' },
          {
            label: 'Fornecedores',
            value: form.supplierLinks.length
              ? form.supplierLinks.map((link) => `${link.supplierName}: ${formatCurrency(link.cost)}`).join('\n')
              : 'Nenhum fornecedor vinculado',
          },
          {
            label: 'Integrantes',
            value: form.memberCostLinks.length
              ? form.memberCostLinks.map((link) => `${link.memberName}: ${formatCurrency(link.cost)}`).join('\n')
              : 'Nenhum integrante vinculado',
          },
          { label: 'Observacoes', value: form.internalNotes || 'Nenhuma observacao' },
        ]}
        onCancel={() => setReviewOpen(false)}
        onConfirm={() => void createConfirmed()}
        open={reviewOpen}
        title="Confirmar cadastro do servico"
      />

      <Modal onClose={closeEdit} open={editOpen} title="Editar servico cadastrado">
        {renderServiceFields()}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button disabled={saving} onClick={closeEdit} variant="secondary">
            Cancelar
          </Button>
          <Button isLoading={saving} onClick={() => void saveEdit()}>
            Salvar alteracoes
          </Button>
        </div>
      </Modal>
    </div>
  )
}
