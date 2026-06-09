import { Edit, HandCoins, ListPlus, Plus, RotateCcw } from 'lucide-react'
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
import { createAuditLog } from '../../services/auditService'
import { addEntity, updateEntity } from '../../services/firestoreService'
import type { Supplier, SupplierPayment } from '../../types'
import { brazilianStates } from '../../utils/constants'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'
import { formatCurrency, formatDate } from '../../utils/format'

const pixTypes = [
  { label: 'CPF', value: 'cpf' },
  { label: 'CNPJ', value: 'cnpj' },
  { label: 'E-mail', value: 'email' },
  { label: 'Telefone', value: 'telefone' },
  { label: 'Chave aleatória', value: 'aleatoria' },
]

const emptySupplier: Omit<Supplier, 'id'> = {
  name: '',
  type: '',
  contactName: '',
  phone: '',
  email: '',
  city: '',
  state: '',
  pixKey: '',
  pixKeyType: 'cpf',
  bankName: '',
  defaultCost: 0,
  active: true,
  notes: '',
}

type SuppliersTab = 'access' | 'registration'
type SupplierFormErrors = Partial<Record<'name' | 'type' | 'defaultCost', string>>

export function AdminSuppliersPage() {
  const { user, profile } = useAuth()
  const supplierConstraints = useMemo(() => [], [])
  const { data: suppliers, loading } = useCollection<Supplier>('suppliers', supplierConstraints)
  const { data: payments } = useCollection<SupplierPayment>('supplierPayments')
  const [form, setForm] = useState(emptySupplier)
  const [editingId, setEditingId] = useState('')
  const [activeTab, setActiveTab] = useState<SuppliersTab>('access')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [formErrors, setFormErrors] = useState<SupplierFormErrors>({})
  const [reviewOpen, setReviewOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [paymentSupplierId, setPaymentSupplierId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentNotes, setPaymentNotes] = useState('')
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [managerOpen, setManagerOpen] = useState(false)

  const supplierTypes = useMemo(
    () => [...new Set(suppliers.map((supplier) => supplier.type).filter(Boolean))].sort(),
    [suppliers],
  )
  const filtered = useMemo(
    () =>
      suppliers
        .filter((supplier) =>
          statusFilter === 'all'
            ? true
            : statusFilter === 'active'
              ? supplier.active
              : !supplier.active,
        )
        .filter((supplier) => typeFilter === 'all' || supplier.type === typeFilter)
        .filter((supplier) =>
          [
            supplier.name,
            supplier.type,
            supplier.contactName,
            supplier.phone,
            supplier.email,
            supplier.city,
            supplier.state,
            supplier.pixKey,
            supplier.bankName,
          ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase('pt-BR')
            .includes(search.toLocaleLowerCase('pt-BR')),
        ),
    [search, statusFilter, suppliers, typeFilter],
  )

  function resetForm() {
    setForm(emptySupplier)
    setEditingId('')
    setFormErrors({})
  }

  function openNew() {
    resetForm()
    setFeedback('')
    setActiveTab('registration')
  }

  function cancelRegistration() {
    resetForm()
    setActiveTab('access')
    setFeedback('Cadastro cancelado.')
  }

  function changeTab(tab: SuppliersTab) {
    if (tab === activeTab) return
    if (tab === 'registration') resetForm()
    setFeedback('')
    setActiveTab(tab)
  }

  function updateForm<K extends keyof Omit<Supplier, 'id'>>(
    key: K,
    value: Omit<Supplier, 'id'>[K],
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
      type: form.type.trim(),
      contactName: form.contactName?.trim() || '',
      phone: form.phone?.trim() || '',
      email: form.email?.trim() || '',
      city: form.city?.trim() || '',
      state: form.state?.trim() || '',
      pixKey: form.pixKey?.trim() || '',
      bankName: form.bankName?.trim() || '',
      notes: form.notes?.trim() || '',
    }
  }

  function validateSupplier(candidate: Omit<Supplier, 'id'>) {
    const errors: SupplierFormErrors = {}
    if (!candidate.name) errors.name = 'Informe o nome do fornecedor.'
    if (!candidate.type) errors.type = 'Selecione o tipo de fornecedor.'
    if (!Number.isFinite(candidate.defaultCost) || candidate.defaultCost <= 0) {
      errors.defaultCost = 'Informe um custo padrão maior que zero.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function edit(supplier: Supplier) {
    setFeedback('')
    setFormErrors({})
    setEditingId(supplier.id)
    setForm({
      name: supplier.name,
      type: supplier.type,
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      city: supplier.city || '',
      state: supplier.state || '',
      pixKey: supplier.pixKey || '',
      pixKeyType: supplier.pixKeyType || 'cpf',
      bankName: supplier.bankName || '',
      defaultCost: supplier.defaultCost,
      active: supplier.active,
      notes: supplier.notes || '',
    })
    setActiveTab('registration')
  }

  function requestCreate() {
    const candidate = normalizedForm()
    setForm(candidate)
    setFeedback('')
    if (!validateSupplier(candidate)) {
      setFeedback('Revise os campos obrigatórios antes de continuar.')
      return
    }
    setReviewOpen(true)
  }

  async function createConfirmed() {
    setSaving(true)
    setFeedback('')
    try {
      const reference = await addEntity('suppliers', form)
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: 'supplier_created',
        entity: 'suppliers',
        entityId: reference.id,
        description: `Fornecedor ${form.name} cadastrado.`,
      }).catch(() => undefined)
      setReviewOpen(false)
      resetForm()
      setActiveTab('access')
      setFeedback('Fornecedor cadastrado com sucesso.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Erro ao salvar fornecedor. Tente novamente.'))
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit() {
    const candidate = normalizedForm()
    setForm(candidate)
    if (!editingId || !validateSupplier(candidate)) {
      setFeedback('Revise os campos obrigatórios antes de salvar.')
      return
    }

    setSaving(true)
    setFeedback('')
    try {
      await updateEntity('suppliers', editingId, candidate)
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: 'supplier_updated',
        entity: 'suppliers',
        entityId: editingId,
        description: `Fornecedor ${candidate.name} atualizado.`,
      }).catch(() => undefined)
      resetForm()
      setActiveTab('access')
      setFeedback('Fornecedor atualizado com sucesso.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Erro ao salvar fornecedor. Tente novamente.'))
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(supplier: Supplier) {
    setFeedback('')
    try {
      await updateEntity('suppliers', supplier.id, { active: !supplier.active })
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: supplier.active ? 'supplier_disabled' : 'supplier_enabled',
        entity: 'suppliers',
        entityId: supplier.id,
        description: `Fornecedor ${supplier.name} ${supplier.active ? 'desativado' : 'reativado'}.`,
      }).catch(() => undefined)
      setFeedback(`Fornecedor ${supplier.active ? 'desativado' : 'reativado'} com sucesso.`)
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Não foi possível alterar o status do fornecedor.'))
    }
  }

  async function registerPayment() {
    const supplier = suppliers.find((item) => item.id === paymentSupplierId)
    if (!supplier || paymentAmount <= 0) {
      setFeedback('Selecione um fornecedor e informe um valor maior que zero.')
      return
    }

    setPaymentSaving(true)
    setFeedback('')
    try {
      const reference = await addEntity('supplierPayments', {
        supplierId: supplier.id,
        supplierName: supplier.name,
        amount: paymentAmount,
        status: 'pago',
        pixKey: supplier.pixKey || '',
        notes: paymentNotes.trim(),
        paidAt: new Date(),
      })
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: 'supplier_payment_registered',
        entity: 'supplierPayments',
        entityId: reference.id,
        description: `Pagamento de ${formatCurrency(paymentAmount)} registrado para ${supplier.name}.`,
      }).catch(() => undefined)
      setPaymentSupplierId('')
      setPaymentAmount(0)
      setPaymentNotes('')
      setFeedback('Pagamento de fornecedor registrado com sucesso.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Não foi possível registrar o pagamento.'))
    } finally {
      setPaymentSaving(false)
    }
  }

  function renderSupplierFields() {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          error={formErrors.name}
          label="Nome/Razão Social *"
          onChange={(event) => updateForm('name', event.target.value)}
          required
          value={form.name}
        />
        <AdminOptionSelect
          collectionName="supplierTypes"
          currentValue={editingId ? form.type : undefined}
          error={formErrors.type}
          label="Tipo de fornecedor *"
          onChange={(value) => updateForm('type', value)}
          placeholder="Selecione o tipo de fornecedor"
          required
          value={form.type}
        />
        <Input
          label="Nome do contato"
          onChange={(event) => updateForm('contactName', event.target.value)}
          value={form.contactName}
        />
        <Input
          error={formErrors.defaultCost}
          label="Valor padrão cobrado *"
          min={0}
          onChange={(event) => updateForm('defaultCost', Number(event.target.value))}
          required
          type="number"
          value={form.defaultCost}
        />
        <Input label="Telefone" onChange={(event) => updateForm('phone', event.target.value)} value={form.phone} />
        <Input label="E-mail" onChange={(event) => updateForm('email', event.target.value)} type="email" value={form.email} />
        <Input label="Cidade" onChange={(event) => updateForm('city', event.target.value)} value={form.city} />
        <Select
          label="Estado"
          onChange={(event) => updateForm('state', event.target.value)}
          options={brazilianStates.map((state) => ({ label: state, value: state }))}
          placeholder="Selecione"
          value={form.state}
        />
        <Input label="Chave Pix" onChange={(event) => updateForm('pixKey', event.target.value)} value={form.pixKey} />
        <Select
          label="Tipo da chave Pix"
          onChange={(event) => updateForm('pixKeyType', event.target.value as Supplier['pixKeyType'])}
          options={pixTypes}
          value={form.pixKeyType}
        />
        <Input label="Banco" onChange={(event) => updateForm('bankName', event.target.value)} value={form.bankName} />
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
          label="Observações"
          onChange={(event) => updateForm('notes', event.target.value)}
          value={form.notes}
          wrapperClassName="md:col-span-2"
        />
      </div>
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
            description: 'Consulta e gestão dos fornecedores cadastrados',
          },
          {
            value: 'registration',
            label: 'Cadastro',
            description: editingId ? 'Edição do fornecedor selecionado' : 'Cadastro de um novo fornecedor',
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
          title={editingId ? 'Editar fornecedor' : 'Cadastrar fornecedor'}
        >
          {renderSupplierFields()}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              icon={editingId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              isLoading={saving}
              onClick={editingId ? () => void saveEdit() : requestCreate}
            >
              {editingId ? 'Atualizar fornecedor' : 'Salvar fornecedor'}
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
              Gerenciar tipos de fornecedores
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card
            action={
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button icon={<Plus className="h-4 w-4" />} onClick={openNew}>
                  Novo fornecedor
                </Button>
                <Button
                  icon={<ListPlus className="h-4 w-4" />}
                  onClick={() => setManagerOpen(true)}
                  variant="secondary"
                >
                  Gerenciar tipos de fornecedores
                </Button>
              </div>
            }
            description="Consulte, filtre e edite os fornecedores já cadastrados."
            role="tabpanel"
            title="Fornecedores cadastrados"
          >
            <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_12rem]">
              <Input
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar fornecedor..."
                value={search}
              />
              <Select
                onChange={(event) => setTypeFilter(event.target.value)}
                options={[
                  { label: 'Todos os tipos', value: 'all' },
                  ...supplierTypes.map((type) => ({ label: type, value: type })),
                ]}
                value={typeFilter}
              />
              <Select
                onChange={(event) => setStatusFilter(event.target.value)}
                options={[
                  { label: 'Todos os status', value: 'all' },
                  { label: 'Ativos', value: 'active' },
                  { label: 'Inativos', value: 'inactive' },
                ]}
                value={statusFilter}
              />
            </div>
            <DataTable
              columns={[
                {
                  header: 'Fornecedor',
                  cell: (supplier) => (
                    <div>
                      <p className="font-medium text-white">{supplier.name}</p>
                      <p className="text-xs text-slate-400">{supplier.contactName || 'Contato não informado'}</p>
                    </div>
                  ),
                },
                { header: 'Tipo', cell: (supplier) => supplier.type },
                {
                  header: 'Contato',
                  cell: (supplier) => (
                    <div>
                      <p>{supplier.phone || 'Telefone não informado'}</p>
                      <p className="text-xs text-slate-400">{supplier.email || 'E-mail não informado'}</p>
                    </div>
                  ),
                },
                {
                  header: 'Localização',
                  cell: (supplier) =>
                    supplier.city || supplier.state
                      ? `${supplier.city || 'Cidade não informada'}${supplier.state ? `/${supplier.state}` : ''}`
                      : '-',
                },
                {
                  header: 'Pix',
                  cell: (supplier) => (
                    <div>
                      <p className="max-w-48 break-all">{supplier.pixKey || 'Não informado'}</p>
                      <p className="text-xs uppercase text-slate-400">
                        {supplier.pixKey ? `${supplier.pixKeyType || '-'}${supplier.bankName ? ` · ${supplier.bankName}` : ''}` : '-'}
                      </p>
                    </div>
                  ),
                },
                { header: 'Custo padrão', cell: (supplier) => formatCurrency(supplier.defaultCost) },
                {
                  header: 'Total pago',
                  cell: (supplier) =>
                    formatCurrency(
                      payments
                        .filter((payment) => payment.supplierId === supplier.id)
                        .reduce((sum, payment) => sum + payment.amount, 0),
                    ),
                },
                { header: 'Atualização', cell: (supplier) => formatDate(supplier.updatedAt || supplier.createdAt) },
                {
                  header: 'Status',
                  cell: (supplier) => (
                    <Badge
                      className={
                        supplier.active
                          ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/20'
                          : 'bg-red-500/15 text-red-200 ring-red-300/20'
                      }
                    >
                      {supplier.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  ),
                },
                {
                  header: 'Ações',
                  cell: (supplier) => (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        aria-label={`Editar fornecedor ${supplier.name}`}
                        className="h-9 px-3"
                        icon={<Edit className="h-4 w-4" />}
                        onClick={() => edit(supplier)}
                        variant="secondary"
                      >
                        Editar
                      </Button>
                      <Button
                        className="h-9 px-3"
                        onClick={() => void toggleStatus(supplier)}
                        variant="secondary"
                      >
                        {supplier.active ? 'Desativar' : 'Reativar'}
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={filtered}
              emptyTitle="Nenhum fornecedor encontrado"
              getRowKey={(supplier) => supplier.id}
              loading={loading}
            />
          </Card>

          <Card description="Registre custos pagos e mantenha o histórico financeiro." title="Pagamento para fornecedor">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)_auto]">
              <Select
                onChange={(event) => {
                  const supplier = suppliers.find((item) => item.id === event.target.value)
                  setPaymentSupplierId(event.target.value)
                  setPaymentAmount(supplier?.defaultCost || 0)
                }}
                options={suppliers.map((supplier) => ({ label: supplier.name, value: supplier.id }))}
                placeholder="Fornecedor"
                value={paymentSupplierId}
              />
              <Input
                min={0}
                onChange={(event) => setPaymentAmount(Number(event.target.value))}
                type="number"
                value={paymentAmount}
              />
              <Input
                onChange={(event) => setPaymentNotes(event.target.value)}
                placeholder="Observação"
                value={paymentNotes}
              />
              <Button
                className="w-full md:col-span-2 xl:col-span-1 xl:w-auto"
                icon={<HandCoins className="h-4 w-4" />}
                isLoading={paymentSaving}
                onClick={() => void registerPayment()}
              >
                Registrar
              </Button>
            </div>
          </Card>

          <Card title="Histórico de pagamentos">
            <DataTable
              columns={[
                { header: 'Fornecedor', cell: (payment) => payment.supplierName },
                { header: 'Valor', cell: (payment) => formatCurrency(payment.amount) },
                { header: 'Status', cell: (payment) => payment.status },
                { header: 'Data', cell: (payment) => formatDate(payment.paidAt || payment.createdAt) },
              ]}
              data={payments}
              emptyTitle="Nenhum pagamento registrado"
              getRowKey={(payment) => payment.id}
            />
          </Card>
        </>
      )}

      <RegistrationReviewModal
        confirmLabel="Confirmar cadastro"
        description="Confira os dados abaixo. O fornecedor somente será criado depois da sua confirmação."
        isLoading={saving}
        items={[
          { label: 'Fornecedor', value: form.name },
          { label: 'Tipo', value: form.type },
          { label: 'Contato', value: form.contactName || 'Não informado' },
          { label: 'Telefone', value: form.phone || 'Não informado' },
          { label: 'E-mail', value: form.email || 'Não informado' },
          {
            label: 'Localização',
            value:
              form.city || form.state
                ? `${form.city || 'Cidade não informada'}${form.state ? `/${form.state}` : ''}`
                : 'Não informada',
          },
          { label: 'Chave Pix', value: form.pixKey || 'Não informada' },
          { label: 'Tipo da chave', value: form.pixKey ? form.pixKeyType || 'Não informado' : 'Não informado' },
          { label: 'Banco', value: form.bankName || 'Não informado' },
          { label: 'Custo padrão', value: formatCurrency(form.defaultCost) },
          { label: 'Status', value: form.active ? 'Ativo' : 'Inativo' },
          { label: 'Observações', value: form.notes || 'Nenhuma observação' },
        ]}
        onCancel={() => setReviewOpen(false)}
        onConfirm={() => void createConfirmed()}
        open={reviewOpen}
        title="Confirmar cadastro do fornecedor"
      />

      <Modal onClose={() => setManagerOpen(false)} open={managerOpen} title="Tipos de fornecedores">
        <AdminOptionManager
          collectionName="supplierTypes"
          description="Cadastre os tipos usados no formulário de fornecedores."
          singularLabel="Tipo de fornecedor"
          title="Gerenciar tipos de fornecedores"
        />
      </Modal>
    </div>
  )
}
