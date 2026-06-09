import { collection, getDocs } from 'firebase/firestore'
import { Edit, ListPlus, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AdminOptionManager } from '../../components/admin/AdminOptionManager'
import { AdminOptionSelect } from '../../components/admin/AdminOptionSelect'
import {
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Modal,
  RegistrationReviewModal,
  Select,
  Tabs,
  Textarea,
} from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { requireDb } from '../../lib/firebase'
import { createAuditLog } from '../../services/auditService'
import { createService, removeService, updateService } from '../../services/serviceService'
import type {
  BandMember,
  MemberCostLink,
  Quote,
  Service,
  Supplier,
  SupplierLink,
} from '../../types'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'
import { formatCurrency, formatDate } from '../../utils/format'

const emptyService: Omit<Service, 'id'> = {
  name: '',
  description: '',
  category: '',
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
  const linkedRecordConstraints = useMemo(() => [], [])
  const {
    data: suppliers,
    loading: suppliersLoading,
    error: suppliersError,
  } = useCollection<Supplier>('suppliers', linkedRecordConstraints)
  const {
    data: members,
    loading: membersLoading,
    error: membersError,
  } = useCollection<BandMember>('bandMembers', linkedRecordConstraints)
  const [form, setForm] = useState(emptyService)
  const [editingId, setEditingId] = useState('')
  const [filter, setFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [supplierCost, setSupplierCost] = useState(0)
  const [memberId, setMemberId] = useState('')
  const [memberCost, setMemberCost] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [activeTab, setActiveTab] = useState<ServicesTab>('access')
  const [formErrors, setFormErrors] = useState<ServiceFormErrors>({})
  const [reviewOpen, setReviewOpen] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const categories = useMemo(
    () => [...new Set(services.map((service) => service.category).filter(Boolean))].sort(),
    [services],
  )
  const supplierOptions = useMemo(
    () =>
      suppliers
        .filter((supplier) => supplier.active !== false)
        .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR')),
    [suppliers],
  )
  const memberOptions = useMemo(
    () =>
      members
        .filter((member) => member.active !== false)
        .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR')),
    [members],
  )
  const filtered = useMemo(
    () =>
      services
        .filter((service) =>
          filter === 'all' ? true : filter === 'active' ? service.active : !service.active,
        )
        .filter((service) => categoryFilter === 'all' || service.category === categoryFilter)
        .filter((service) =>
          `${service.name} ${service.description} ${service.category}`
            .toLocaleLowerCase('pt-BR')
            .includes(search.toLocaleLowerCase('pt-BR')),
        ),
    [categoryFilter, filter, search, services],
  )

  function resetForm() {
    setForm(emptyService)
    setEditingId('')
    setSupplierId('')
    setMemberId('')
    setSupplierCost(0)
    setMemberCost(0)
    setFormErrors({})
  }

  function openNew() {
    resetForm()
    setFeedback('')
    setActiveTab('registration')
  }

  function cancelRegistration() {
    resetForm()
    setFeedback('')
    setActiveTab('access')
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

  function normalizedForm() {
    return {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      internalNotes: form.internalNotes?.trim() || '',
    }
  }

  function validateService(candidate: Omit<Service, 'id'>) {
    const errors: ServiceFormErrors = {}
    if (!candidate.name) errors.name = 'Informe o nome do serviço.'
    if (!candidate.category) errors.category = 'Selecione o tipo do serviço.'
    if (!candidate.description) errors.description = 'Informe uma descrição do serviço.'
    if (!Number.isFinite(candidate.basePrice) || candidate.basePrice <= 0) {
      errors.basePrice = 'Informe um valor maior que zero.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
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
    setActiveTab('registration')
  }

  function requestCreate() {
    setFeedback('')
    const candidate = normalizedForm()
    setForm(candidate)
    if (!validateService(candidate)) {
      setFeedback('Revise os campos obrigatórios antes de continuar.')
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
        description: `Serviço ${form.name} criado.`,
      }).catch(() => undefined)
      setReviewOpen(false)
      resetForm()
      setActiveTab('access')
      setFeedback('Serviço cadastrado com sucesso.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Não foi possível salvar o serviço.'))
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit() {
    const candidate = normalizedForm()
    setForm(candidate)
    if (!editingId || !validateService(candidate)) {
      setFeedback('Revise os campos obrigatórios antes de salvar.')
      return
    }

    setSaving(true)
    setFeedback('')
    try {
      await updateService(editingId, candidate)
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: 'service_updated',
        entity: 'services',
        entityId: editingId,
        description: `Serviço ${candidate.name} atualizado.`,
      }).catch(() => undefined)
      resetForm()
      setActiveTab('access')
      setFeedback('Serviço atualizado com sucesso.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Não foi possível atualizar o serviço.'))
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(service: Service) {
    try {
      await updateService(service.id, { active: !service.active })
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: service.active ? 'service_disabled' : 'service_enabled',
        entity: 'services',
        entityId: service.id,
        description: `Serviço ${service.name} ${service.active ? 'desativado' : 'reativado'}.`,
      }).catch(() => undefined)
      setFeedback(`Serviço ${service.active ? 'desativado' : 'reativado'} com sucesso.`)
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Não foi possível alterar o status.'))
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
    updateForm('supplierLinks', [...form.supplierLinks, link])
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
    updateForm('memberCostLinks', [...form.memberCostLinks, link])
    setMemberId('')
    setMemberCost(0)
  }

  function selectSupplier(value: string) {
    const supplier = supplierOptions.find((item) => item.id === value)
    setSupplierId(value)
    setSupplierCost(supplier?.defaultCost || 0)
  }

  function selectMember(value: string) {
    const member = memberOptions.find((item) => item.id === value)
    setMemberId(value)
    setMemberCost(member?.defaultPayment || 0)
  }

  async function removeIfUnused(service: Service) {
    setFeedback('')
    try {
      const snapshot = await getDocs(collection(requireDb(), 'quotes'))
      const linked = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as Quote)
        .some((quote) => quote.items.some((quoteItem) => quoteItem.serviceId === service.id))

      if (linked) {
        setFeedback('Serviço vinculado a orçamento. Desative-o para preservar o histórico.')
        return
      }

      await removeService(service.id)
      setFeedback('Serviço excluído com sucesso.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Não foi possível excluir o serviço.'))
    }
  }

  function renderServiceFields() {
    const internalCost =
      form.supplierLinks.reduce((sum, link) => sum + link.cost, 0) +
      form.memberCostLinks.reduce((sum, link) => sum + link.cost, 0)

    return (
      <>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            error={formErrors.name}
            label="Nome do serviço *"
            onChange={(event) => updateForm('name', event.target.value)}
            required
            value={form.name}
          />
          <AdminOptionSelect
            collectionName="serviceCategories"
            currentValue={editingId ? form.category : undefined}
            error={formErrors.category}
            label="Tipo do serviço *"
            onChange={(value) => updateForm('category', value)}
            required
            value={form.category}
          />
          <Input
            error={formErrors.basePrice}
            label="Valor padrão *"
            min={0}
            onChange={(event) => updateForm('basePrice', Number(event.target.value))}
            required
            type="number"
            value={form.basePrice}
          />
          <Select
            label="Permitir edição do valor"
            onChange={(event) => updateForm('allowPriceEdit', event.target.value === 'true')}
            options={[
              { label: 'Sim', value: 'true' },
              { label: 'Não', value: 'false' },
            ]}
            value={String(form.allowPriceEdit)}
          />
          <Select
            label="Status"
            onChange={(event) => updateForm('active', event.target.value === 'true')}
            options={[
              { label: 'Ativo', value: 'true' },
              { label: 'Inativo', value: 'false' },
            ]}
            value={String(form.active)}
          />
          <Textarea
            error={formErrors.description}
            label="Descrição *"
            onChange={(event) => updateForm('description', event.target.value)}
            required
            value={form.description}
            wrapperClassName="md:col-span-2"
          />
          <Textarea
            label="Observações internas"
            onChange={(event) => updateForm('internalNotes', event.target.value)}
            value={form.internalNotes}
            wrapperClassName="md:col-span-2"
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h3 className="font-semibold text-white">Fornecedores vinculados</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem] xl:grid-cols-[minmax(0,1fr)_8rem_auto]">
              <Select
                className="w-full min-w-0"
                disabled={suppliersLoading || Boolean(suppliersError) || supplierOptions.length === 0}
                onChange={(event) => selectSupplier(event.target.value)}
                options={supplierOptions.map((item) => ({ label: item.name, value: item.id }))}
                placeholder={
                  suppliersLoading
                    ? 'Carregando fornecedores...'
                    : suppliersError
                      ? 'Erro ao carregar fornecedores'
                      : supplierOptions.length
                        ? 'Selecione um fornecedor'
                        : 'Nenhum fornecedor ativo cadastrado'
                }
                value={supplierId}
                wrapperClassName="min-w-0"
              />
              <Input
                className="w-full min-w-0"
                min={0}
                onChange={(event) => setSupplierCost(Number(event.target.value))}
                type="number"
                value={supplierCost}
                wrapperClassName="min-w-0"
              />
              <Button
                className="w-full whitespace-nowrap sm:col-span-2 xl:col-span-1 xl:w-auto"
                disabled={!supplierId || supplierCost <= 0}
                onClick={addSupplierLink}
                variant="secondary"
              >
                Adicionar
              </Button>
            </div>
            {suppliersError && (
              <p className="mt-2 text-xs text-red-200">
                Não foi possível carregar a lista de fornecedores.
              </p>
            )}
            {!suppliersLoading && !suppliersError && supplierOptions.length === 0 && (
              <p className="mt-2 text-xs text-amber-200">
                Cadastre ou reative um fornecedor para vinculá-lo ao serviço.
              </p>
            )}
            <div className="mt-3 space-y-2">
              {form.supplierLinks.map((link, index) => (
                <div className="flex flex-wrap justify-between gap-3 rounded-md bg-white/[0.05] px-3 py-2 text-sm" key={`${link.supplierId}-${index}`}>
                  <span>{link.supplierName}</span>
                  <strong>{formatCurrency(link.cost)}</strong>
                  <button
                    className="text-red-200"
                    onClick={() => updateForm('supplierLinks', form.supplierLinks.filter((_, itemIndex) => itemIndex !== index))}
                    type="button"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h3 className="font-semibold text-white">Integrantes vinculados</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem] xl:grid-cols-[minmax(0,1fr)_8rem_auto]">
              <Select
                className="w-full min-w-0"
                disabled={membersLoading || Boolean(membersError) || memberOptions.length === 0}
                onChange={(event) => selectMember(event.target.value)}
                options={memberOptions.map((item) => ({ label: item.name, value: item.id }))}
                placeholder={
                  membersLoading
                    ? 'Carregando integrantes...'
                    : membersError
                      ? 'Erro ao carregar integrantes'
                      : memberOptions.length
                        ? 'Selecione um integrante'
                        : 'Nenhum integrante ativo cadastrado'
                }
                value={memberId}
                wrapperClassName="min-w-0"
              />
              <Input
                className="w-full min-w-0"
                min={0}
                onChange={(event) => setMemberCost(Number(event.target.value))}
                type="number"
                value={memberCost}
                wrapperClassName="min-w-0"
              />
              <Button
                className="w-full whitespace-nowrap sm:col-span-2 xl:col-span-1 xl:w-auto"
                disabled={!memberId || memberCost <= 0}
                onClick={addMemberLink}
                variant="secondary"
              >
                Adicionar
              </Button>
            </div>
            {membersError && (
              <p className="mt-2 text-xs text-red-200">
                Não foi possível carregar a lista de integrantes.
              </p>
            )}
            {!membersLoading && !membersError && memberOptions.length === 0 && (
              <p className="mt-2 text-xs text-amber-200">
                Cadastre ou reative um integrante para vinculá-lo ao serviço.
              </p>
            )}
            <div className="mt-3 space-y-2">
              {form.memberCostLinks.map((link, index) => (
                <div className="flex flex-wrap justify-between gap-3 rounded-md bg-white/[0.05] px-3 py-2 text-sm" key={`${link.memberId}-${index}`}>
                  <span>{link.memberName}</span>
                  <strong>{formatCurrency(link.cost)}</strong>
                  <button
                    className="text-red-200"
                    onClick={() => updateForm('memberCostLinks', form.memberCostLinks.filter((_, itemIndex) => itemIndex !== index))}
                    type="button"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-gold-300/20 bg-gold-300/[0.06] p-4">
          <p className="text-sm text-slate-400">Custo interno padrão vinculado</p>
          <p className="mt-1 text-xl font-semibold text-gold-200">{formatCurrency(internalCost)}</p>
          <p className="mt-1 text-xs text-slate-500">
            Soma dos custos de fornecedores e integrantes vinculados ao serviço.
          </p>
        </div>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs
        activeTab={activeTab}
        onChange={changeTab}
        tabs={[
          {
            value: 'access',
            label: 'Acesso',
            description: 'Consulta e gestão dos serviços cadastrados',
          },
          {
            value: 'registration',
            label: 'Cadastro',
            description: editingId ? 'Edição do serviço selecionado' : 'Cadastro de um novo serviço',
          },
        ]}
      />

      {feedback && <p className="rounded-md bg-white/8 p-3 text-sm text-slate-200">{feedback}</p>}

      {activeTab === 'registration' ? (
        <Card
          description={
            editingId
              ? 'Altere os dados necessários e salve para retornar à consulta.'
              : 'Esta área é exclusiva para novos cadastros. Campos com * são obrigatórios.'
          }
          role="tabpanel"
          title={editingId ? 'Editar serviço' : 'Cadastrar serviço'}
        >
          {renderServiceFields()}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              icon={editingId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              isLoading={saving}
              onClick={editingId ? () => void saveEdit() : requestCreate}
            >
              {editingId ? 'Atualizar serviço' : 'Salvar serviço'}
            </Button>
            <Button onClick={cancelRegistration} variant="secondary">
              {editingId ? 'Cancelar edição' : 'Cancelar'}
            </Button>
            <Button icon={<RotateCcw className="h-4 w-4" />} onClick={resetForm} variant="secondary">
              Limpar formulário
            </Button>
            <Button
              icon={<ListPlus className="h-4 w-4" />}
              onClick={() => setManagerOpen(true)}
              variant="secondary"
            >
              Gerenciar categorias
            </Button>
          </div>
        </Card>
      ) : (
        <Card
          action={
            <div className="flex flex-wrap gap-3">
              <Button icon={<Plus className="h-4 w-4" />} onClick={openNew}>
                Novo serviço
              </Button>
              <Button
                icon={<ListPlus className="h-4 w-4" />}
                onClick={() => setManagerOpen(true)}
                variant="secondary"
              >
                Gerenciar categorias
              </Button>
            </div>
          }
          description="Consulte, filtre e edite os serviços já cadastrados."
          role="tabpanel"
          title="Serviços cadastrados"
        >
          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
            <Input onChange={(event) => setSearch(event.target.value)} placeholder="Buscar serviço..." value={search} />
            <Select
              onChange={(event) => setCategoryFilter(event.target.value)}
              options={[
                { label: 'Todas as categorias', value: 'all' },
                ...categories.map((category) => ({ label: category, value: category })),
              ]}
              value={categoryFilter}
            />
            <Select
              onChange={(event) => setFilter(event.target.value)}
              options={[
                { label: 'Todos os status', value: 'all' },
                { label: 'Ativos', value: 'active' },
                { label: 'Inativos', value: 'inactive' },
              ]}
              value={filter}
            />
          </div>
          <DataTable
            columns={[
              { header: 'Serviço', cell: (service) => service.name },
              { header: 'Tipo', cell: (service) => service.category },
              { header: 'Valor', cell: (service) => formatCurrency(service.basePrice) },
              {
                header: 'Edição de valor',
                cell: (service) => (service.allowPriceEdit ? 'Permitida' : 'Bloqueada'),
              },
              { header: 'Fornecedores', cell: (service) => service.supplierLinks?.length || 0 },
              { header: 'Integrantes', cell: (service) => service.memberCostLinks?.length || 0 },
              {
                header: 'Custo interno',
                cell: (service) =>
                  formatCurrency(
                    (service.supplierLinks || []).reduce((sum, link) => sum + link.cost, 0) +
                      (service.memberCostLinks || []).reduce((sum, link) => sum + link.cost, 0),
                  ),
              },
              { header: 'Atualização', cell: (service) => formatDate(service.updatedAt || service.createdAt) },
              {
                header: 'Status',
                cell: (service) => (
                  <Badge className={service.active ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/20' : 'bg-red-500/15 text-red-200 ring-red-300/20'}>
                    {service.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                ),
              },
              {
                header: 'Ações',
                cell: (service) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      aria-label={`Editar serviço ${service.name}`}
                      className="h-9 px-3"
                      icon={<Edit className="h-4 w-4" />}
                      onClick={() => edit(service)}
                      variant="secondary"
                    >
                      Editar
                    </Button>
                    <Button className="h-9 px-3" onClick={() => void toggleStatus(service)} variant="secondary">
                      {service.active ? 'Desativar' : 'Reativar'}
                    </Button>
                    <Button aria-label={`Excluir serviço ${service.name}`} className="h-9 w-9 px-0" onClick={() => void removeIfUnused(service)} variant="danger">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filtered}
            emptyTitle="Nenhum serviço encontrado"
            getRowKey={(service) => service.id}
            loading={loading}
          />
        </Card>
      )}

      <RegistrationReviewModal
        confirmLabel="Confirmar cadastro"
        description="Confira os dados abaixo. O serviço somente será criado depois da sua confirmação."
        isLoading={saving}
        items={[
          { label: 'Nome', value: form.name },
          { label: 'Tipo', value: form.category },
          { label: 'Descrição', value: form.description },
          { label: 'Valor padrão', value: formatCurrency(form.basePrice) },
          { label: 'Edição de valor', value: form.allowPriceEdit ? 'Permitida' : 'Não permitida' },
          { label: 'Status', value: form.active ? 'Ativo' : 'Inativo' },
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
          { label: 'Observações', value: form.internalNotes || 'Nenhuma observação' },
        ]}
        onCancel={() => setReviewOpen(false)}
        onConfirm={() => void createConfirmed()}
        open={reviewOpen}
        title="Confirmar cadastro do serviço"
      />

      <Modal onClose={() => setManagerOpen(false)} open={managerOpen} title="Categorias de serviços">
        <AdminOptionManager
          collectionName="serviceCategories"
          description="Opções disponíveis no cadastro e na edição de serviços."
          singularLabel="Categoria"
          title="Gerenciar categorias de serviços"
        />
      </Modal>
    </div>
  )
}
