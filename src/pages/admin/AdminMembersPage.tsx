import { Edit, ListPlus, Plus, RotateCcw } from 'lucide-react'
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
import type { BandMember, MemberPayment } from '../../types'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'
import { formatCurrency, formatDate } from '../../utils/format'

const pixTypes = [
  { label: 'CPF', value: 'cpf' },
  { label: 'E-mail', value: 'email' },
  { label: 'Telefone', value: 'telefone' },
  { label: 'Chave aleatória', value: 'aleatoria' },
]

const emptyMember: Omit<BandMember, 'id'> = {
  name: '',
  artisticName: '',
  role: '',
  phone: '',
  email: '',
  pixKey: '',
  pixKeyType: 'cpf',
  defaultPayment: 0,
  active: true,
  notes: '',
}

type MembersTab = 'access' | 'registration'
type MemberFormErrors = Partial<Record<'name' | 'role' | 'defaultPayment', string>>

export function AdminMembersPage() {
  const { user, profile } = useAuth()
  const { data: members, loading } = useCollection<BandMember>('bandMembers')
  const { data: payments } = useCollection<MemberPayment>('memberPayments')
  const [form, setForm] = useState(emptyMember)
  const [editingId, setEditingId] = useState('')
  const [feedback, setFeedback] = useState('')
  const [activeTab, setActiveTab] = useState<MembersTab>('access')
  const [formErrors, setFormErrors] = useState<MemberFormErrors>({})
  const [reviewOpen, setReviewOpen] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const roles = useMemo(
    () => [...new Set(members.map((member) => member.role).filter(Boolean))].sort(),
    [members],
  )
  const filtered = useMemo(
    () =>
      members
        .filter((member) =>
          statusFilter === 'all'
            ? true
            : statusFilter === 'active'
              ? member.active
              : !member.active,
        )
        .filter((member) => roleFilter === 'all' || member.role === roleFilter)
        .filter((member) =>
          `${member.name} ${member.artisticName || ''} ${member.role}`
            .toLocaleLowerCase('pt-BR')
            .includes(search.toLocaleLowerCase('pt-BR')),
        ),
    [members, roleFilter, search, statusFilter],
  )

  function resetForm() {
    setForm(emptyMember)
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
    setFeedback('')
    setActiveTab('access')
  }

  function changeTab(tab: MembersTab) {
    if (tab === activeTab) return
    if (tab === 'registration') resetForm()
    setFeedback('')
    setActiveTab(tab)
  }

  function updateForm<K extends keyof Omit<BandMember, 'id'>>(
    key: K,
    value: Omit<BandMember, 'id'>[K],
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
      artisticName: form.artisticName?.trim() || '',
      role: form.role.trim(),
      phone: form.phone?.trim() || '',
      email: form.email?.trim() || '',
      pixKey: form.pixKey?.trim() || '',
      notes: form.notes?.trim() || '',
    }
  }

  function validateMember(candidate: Omit<BandMember, 'id'>) {
    const errors: MemberFormErrors = {}
    if (!candidate.name) errors.name = 'Informe o nome completo.'
    if (!candidate.role) errors.role = 'Informe a função do integrante.'
    if (!Number.isFinite(candidate.defaultPayment) || candidate.defaultPayment <= 0) {
      errors.defaultPayment = 'Informe um valor maior que zero.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function edit(member: BandMember) {
    setFeedback('')
    setFormErrors({})
    setEditingId(member.id)
    setForm({
      name: member.name,
      artisticName: member.artisticName || '',
      role: member.role,
      phone: member.phone || '',
      email: member.email || '',
      pixKey: member.pixKey || '',
      pixKeyType: member.pixKeyType || 'cpf',
      defaultPayment: member.defaultPayment,
      active: member.active,
      notes: member.notes || '',
    })
    setActiveTab('registration')
  }

  function requestCreate() {
    const candidate = normalizedForm()
    setForm(candidate)
    setFeedback('')
    if (!validateMember(candidate)) {
      setFeedback('Revise os campos obrigatórios antes de continuar.')
      return
    }
    setReviewOpen(true)
  }

  async function createConfirmed() {
    setSaving(true)
    setFeedback('')
    try {
      const reference = await addEntity('bandMembers', form)
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: 'member_created',
        entity: 'bandMembers',
        entityId: reference.id,
        description: `Integrante ${form.name} cadastrado.`,
      }).catch(() => undefined)
      setReviewOpen(false)
      resetForm()
      setActiveTab('access')
      setFeedback('Integrante cadastrado com sucesso.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Não foi possível salvar o integrante.'))
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit() {
    const candidate = normalizedForm()
    setForm(candidate)
    if (!editingId || !validateMember(candidate)) {
      setFeedback('Revise os campos obrigatórios antes de salvar.')
      return
    }

    setSaving(true)
    setFeedback('')
    try {
      await updateEntity('bandMembers', editingId, candidate)
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: 'member_updated',
        entity: 'bandMembers',
        entityId: editingId,
        description: `Integrante ${candidate.name} atualizado.`,
      }).catch(() => undefined)
      resetForm()
      setActiveTab('access')
      setFeedback('Integrante atualizado com sucesso.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Não foi possível atualizar o integrante.'))
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(member: BandMember) {
    try {
      await updateEntity('bandMembers', member.id, { active: !member.active })
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: member.active ? 'member_disabled' : 'member_enabled',
        entity: 'bandMembers',
        entityId: member.id,
        description: `Integrante ${member.name} ${member.active ? 'desativado' : 'reativado'}.`,
      }).catch(() => undefined)
      setFeedback(`Integrante ${member.active ? 'desativado' : 'reativado'} com sucesso.`)
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Não foi possível alterar o status.'))
    }
  }

  function renderMemberFields() {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          error={formErrors.name}
          label="Nome completo *"
          onChange={(event) => updateForm('name', event.target.value)}
          required
          value={form.name}
        />
        <Input
          label="Nome artístico/apelido"
          onChange={(event) => updateForm('artisticName', event.target.value)}
          value={form.artisticName}
        />
        <AdminOptionSelect
          collectionName="memberRoles"
          currentValue={editingId ? form.role : undefined}
          error={formErrors.role}
          label="Função na banda *"
          onChange={(value) => updateForm('role', value)}
          required
          value={form.role}
        />
        <Input
          error={formErrors.defaultPayment}
          label="Valor padrão por evento *"
          min={0}
          onChange={(event) => updateForm('defaultPayment', Number(event.target.value))}
          required
          type="number"
          value={form.defaultPayment}
        />
        <Input label="Telefone" onChange={(event) => updateForm('phone', event.target.value)} value={form.phone} />
        <Input label="E-mail" onChange={(event) => updateForm('email', event.target.value)} value={form.email} />
        <Input label="Chave Pix" onChange={(event) => updateForm('pixKey', event.target.value)} value={form.pixKey} />
        <Select
          label="Tipo da chave Pix"
          onChange={(event) => updateForm('pixKeyType', event.target.value as BandMember['pixKeyType'])}
          options={pixTypes}
          value={form.pixKeyType}
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
            description: 'Consulta e gestão dos integrantes cadastrados',
          },
          {
            value: 'registration',
            label: 'Cadastro',
            description: editingId ? 'Edição do integrante selecionado' : 'Cadastro de um novo integrante',
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
          title={editingId ? 'Editar integrante' : 'Cadastrar integrante'}
        >
          {renderMemberFields()}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              icon={editingId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              isLoading={saving}
              onClick={editingId ? () => void saveEdit() : requestCreate}
            >
              {editingId ? 'Atualizar integrante' : 'Salvar integrante'}
            </Button>
            <Button onClick={cancelRegistration} variant="secondary">
              {editingId ? 'Cancelar edição' : 'Cancelar'}
            </Button>
            <Button icon={<RotateCcw className="h-4 w-4" />} onClick={resetForm} variant="secondary">
              Limpar formulário
            </Button>
            <Button icon={<ListPlus className="h-4 w-4" />} onClick={() => setManagerOpen(true)} variant="secondary">
              Gerenciar funções
            </Button>
          </div>
        </Card>
      ) : (
        <Card
          action={
            <div className="flex flex-wrap gap-3">
              <Button icon={<Plus className="h-4 w-4" />} onClick={openNew}>
                Novo integrante
              </Button>
              <Button icon={<ListPlus className="h-4 w-4" />} onClick={() => setManagerOpen(true)} variant="secondary">
                Gerenciar funções
              </Button>
            </div>
          }
          description="Consulte, filtre e edite os integrantes já cadastrados."
          role="tabpanel"
          title="Integrantes cadastrados"
        >
          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
            <Input onChange={(event) => setSearch(event.target.value)} placeholder="Buscar integrante..." value={search} />
            <Select
              onChange={(event) => setRoleFilter(event.target.value)}
              options={[
                { label: 'Todas as funções', value: 'all' },
                ...roles.map((role) => ({ label: role, value: role })),
              ]}
              value={roleFilter}
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
                header: 'Nome',
                cell: (member) => (
                  <div>
                    <p className="font-medium text-white">{member.name}</p>
                    <p className="text-xs text-slate-400">{member.artisticName}</p>
                  </div>
                ),
              },
              { header: 'Função', cell: (member) => member.role },
              {
                header: 'Contato',
                cell: (member) => (
                  <div>
                    <p>{member.phone || 'Telefone não informado'}</p>
                    <p className="text-xs text-slate-400">{member.email || 'E-mail não informado'}</p>
                  </div>
                ),
              },
              {
                header: 'Pix',
                cell: (member) => (
                  <div>
                    <p className="max-w-48 break-all">{member.pixKey || 'Não informado'}</p>
                    <p className="text-xs uppercase text-slate-400">{member.pixKeyType || '-'}</p>
                  </div>
                ),
              },
              { header: 'Pagamento padrão', cell: (member) => formatCurrency(member.defaultPayment) },
              {
                header: 'Total pago',
                cell: (member) => formatCurrency(payments.filter((payment) => payment.memberId === member.id).reduce((sum, payment) => sum + payment.amount, 0)),
              },
              { header: 'Atualização', cell: (member) => formatDate(member.updatedAt || member.createdAt) },
              {
                header: 'Status',
                cell: (member) => (
                  <Badge className={member.active ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/20' : 'bg-red-500/15 text-red-200 ring-red-300/20'}>
                    {member.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                ),
              },
              {
                header: 'Ações',
                cell: (member) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      aria-label={`Editar integrante ${member.name}`}
                      className="h-9 px-3"
                      icon={<Edit className="h-4 w-4" />}
                      onClick={() => edit(member)}
                      variant="secondary"
                    >
                      Editar
                    </Button>
                    <Button className="h-9 px-3" onClick={() => void toggleStatus(member)} variant="secondary">
                      {member.active ? 'Desativar' : 'Reativar'}
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filtered}
            emptyTitle="Nenhum integrante encontrado"
            getRowKey={(member) => member.id}
            loading={loading}
          />
        </Card>
      )}

      <RegistrationReviewModal
        confirmLabel="Confirmar cadastro"
        description="Confira os dados abaixo. O integrante somente será criado depois da sua confirmação."
        isLoading={saving}
        items={[
          { label: 'Nome completo', value: form.name },
          { label: 'Nome artístico', value: form.artisticName || 'Não informado' },
          { label: 'Função', value: form.role },
          { label: 'Valor por evento', value: formatCurrency(form.defaultPayment) },
          { label: 'Telefone', value: form.phone || 'Não informado' },
          { label: 'E-mail', value: form.email || 'Não informado' },
          { label: 'Chave Pix', value: form.pixKey || 'Não informada' },
          { label: 'Tipo da chave', value: form.pixKey ? form.pixKeyType || 'Não informado' : 'Não informado' },
          { label: 'Status', value: form.active ? 'Ativo' : 'Inativo' },
          { label: 'Observações', value: form.notes || 'Nenhuma observação' },
        ]}
        onCancel={() => setReviewOpen(false)}
        onConfirm={() => void createConfirmed()}
        open={reviewOpen}
        title="Confirmar cadastro do integrante"
      />

      <Modal onClose={() => setManagerOpen(false)} open={managerOpen} title="Funções de integrantes">
        <AdminOptionManager
          collectionName="memberRoles"
          description="Opções disponíveis no cadastro e na edição de integrantes."
          singularLabel="Função"
          title="Gerenciar funções de integrantes"
        />
      </Modal>
    </div>
  )
}
