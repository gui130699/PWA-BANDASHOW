import { Edit, Plus, RotateCcw } from 'lucide-react'
import { useState } from 'react'
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
import { createAuditLog } from '../../services/auditService'
import { addEntity, updateEntity } from '../../services/firestoreService'
import type { BandMember, MemberPayment } from '../../types'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'
import { formatCurrency } from '../../utils/format'

const pixTypes = ['cpf', 'email', 'telefone', 'aleatoria']

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
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  function resetForm() {
    setForm(emptyMember)
    setEditingId('')
    setFormErrors({})
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
    if (!candidate.name.trim()) errors.name = 'Informe o nome completo.'
    if (!candidate.role.trim()) errors.role = 'Informe a funcao do integrante.'
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
    setEditOpen(true)
  }

  function requestCreate() {
    setFeedback('')
    const candidate = normalizedForm()
    setForm(candidate)
    if (!validateMember(candidate)) {
      setFeedback('Revise os campos obrigatorios antes de continuar.')
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
      setFeedback('Integrante cadastrado.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Nao foi possivel salvar.'))
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit() {
    setFeedback('')
    const candidate = normalizedForm()
    setForm(candidate)
    if (!editingId || !validateMember(candidate)) {
      setFeedback('Revise os campos obrigatorios antes de salvar.')
      return
    }

    setSaving(true)
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
      setEditOpen(false)
      resetForm()
      setFeedback('Integrante atualizado.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Nao foi possivel atualizar.'))
    } finally {
      setSaving(false)
    }
  }

  function closeEdit() {
    setEditOpen(false)
    resetForm()
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
          label="Nome artistico/apelido"
          onChange={(event) => updateForm('artisticName', event.target.value)}
          value={form.artisticName}
        />
        <Input
          error={formErrors.role}
          label="Funcao na banda *"
          onChange={(event) => updateForm('role', event.target.value)}
          required
          value={form.role}
        />
        <Input
          error={formErrors.defaultPayment}
          label="Valor padrao por evento *"
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
          options={pixTypes.map((type) => ({ label: type, value: type }))}
          value={form.pixKeyType}
        />
        <Textarea
          label="Observacoes"
          onChange={(event) => updateForm('notes', event.target.value)}
          value={form.notes}
          wrapperClassName="md:col-span-2"
        />
      </div>
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
            description: 'Somente consulta e gestao dos integrantes cadastrados',
          },
          {
            value: 'registration',
            label: 'Cadastro',
            description: 'Somente para cadastrar um novo integrante',
          },
        ]}
      />

      {feedback && <p className="rounded-md bg-white/8 p-3 text-sm text-slate-200">{feedback}</p>}

      {activeTab === 'registration' ? (
        <Card
          description="Esta area e exclusiva para novos cadastros. Campos com * sao obrigatorios."
          role="tabpanel"
          title="Novo cadastro de integrante"
        >
          {renderMemberFields()}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button icon={<Plus className="h-4 w-4" />} onClick={requestCreate}>
              Revisar e cadastrar integrante
            </Button>
            <Button icon={<RotateCcw className="h-4 w-4" />} onClick={resetForm} variant="secondary">
              Limpar formulario
            </Button>
          </div>
        </Card>
      ) : (
        <div role="tabpanel">
          <Card
            description="Consulte os integrantes existentes. A edicao abre em uma janela separada e nao utiliza a aba Cadastro."
            title="Consulta de integrantes cadastrados"
          >
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
                { header: 'Funcao', cell: (member) => member.role },
                { header: 'Pagamento padrao', cell: (member) => formatCurrency(member.defaultPayment) },
                {
                  header: 'Total pago',
                  cell: (member) => formatCurrency(payments.filter((payment) => payment.memberId === member.id).reduce((sum, payment) => sum + payment.amount, 0)),
                },
                {
                  header: 'Status',
                  cell: (member) => <Badge className={member.active ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/20' : 'bg-red-500/15 text-red-200 ring-red-300/20'}>{member.active ? 'Ativo' : 'Inativo'}</Badge>,
                },
                {
                  header: 'Acoes',
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
                      <Button className="h-9 px-3" onClick={async () => {
                        await updateEntity('bandMembers', member.id, { active: !member.active })
                        await createAuditLog({
                          userId: user?.uid || 'admin',
                          userName: profile?.name || 'Admin',
                          action: member.active ? 'member_disabled' : 'member_enabled',
                          entity: 'bandMembers',
                          entityId: member.id,
                          description: `Integrante ${member.name} ${member.active ? 'desativado' : 'reativado'}.`,
                        }).catch(() => undefined)
                      }} variant="secondary">{member.active ? 'Desativar' : 'Reativar'}</Button>
                    </div>
                  ),
                },
              ]}
              data={members}
              emptyTitle="Nenhum integrante cadastrado"
              getRowKey={(member) => member.id}
              loading={loading}
            />
          </Card>
        </div>
      )}

      <RegistrationReviewModal
        confirmLabel="Confirmar cadastro"
        description="Confira os dados abaixo. O integrante somente sera criado depois da sua confirmacao."
        isLoading={saving}
        items={[
          { label: 'Nome completo', value: form.name },
          { label: 'Nome artistico', value: form.artisticName || 'Nao informado' },
          { label: 'Funcao', value: form.role },
          { label: 'Valor por evento', value: formatCurrency(form.defaultPayment) },
          { label: 'Telefone', value: form.phone || 'Nao informado' },
          { label: 'E-mail', value: form.email || 'Nao informado' },
          { label: 'Chave Pix', value: form.pixKey || 'Nao informada' },
          { label: 'Tipo da chave', value: form.pixKey ? form.pixKeyType || 'Nao informado' : 'Nao informado' },
          { label: 'Observacoes', value: form.notes || 'Nenhuma observacao' },
        ]}
        onCancel={() => setReviewOpen(false)}
        onConfirm={() => void createConfirmed()}
        open={reviewOpen}
        title="Confirmar cadastro do integrante"
      />

      <Modal onClose={closeEdit} open={editOpen} title="Editar integrante cadastrado">
        {renderMemberFields()}
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
