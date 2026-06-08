import { Edit, HandCoins, Plus, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, DataTable, Input, Select, Textarea } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { createAuditLog } from '../../services/auditService'
import { addEntity, updateEntity } from '../../services/firestoreService'
import type { BandMember, MemberPayment } from '../../types'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'
import { formatCurrency, formatDate } from '../../utils/format'

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

export function AdminMembersPage() {
  const { user, profile } = useAuth()
  const { data: members, loading } = useCollection<BandMember>('bandMembers')
  const { data: payments } = useCollection<MemberPayment>('memberPayments')
  const [form, setForm] = useState(emptyMember)
  const [editingId, setEditingId] = useState('')
  const [paymentMemberId, setPaymentMemberId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentNotes, setPaymentNotes] = useState('')
  const [feedback, setFeedback] = useState('')

  function resetForm() {
    setForm(emptyMember)
    setEditingId('')
  }

  function edit(member: BandMember) {
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
  }

  async function save() {
    setFeedback('')
    try {
      if (editingId) {
        await updateEntity('bandMembers', editingId, form)
        await createAuditLog({
          userId: user?.uid || 'admin',
          userName: profile?.name || 'Admin',
          action: 'member_updated',
          entity: 'bandMembers',
          entityId: editingId,
          description: `Integrante ${form.name} atualizado.`,
        }).catch(() => undefined)
        setFeedback('Integrante atualizado.')
      } else {
        const reference = await addEntity('bandMembers', form)
        await createAuditLog({
          userId: user?.uid || 'admin',
          userName: profile?.name || 'Admin',
          action: 'member_created',
          entity: 'bandMembers',
          entityId: reference.id,
          description: `Integrante ${form.name} cadastrado.`,
        }).catch(() => undefined)
        setFeedback('Integrante cadastrado.')
      }
      resetForm()
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Nao foi possivel salvar.'))
    }
  }

  async function registerPayment() {
    const member = members.find((item) => item.id === paymentMemberId)
    if (!member || paymentAmount <= 0) return
    setFeedback('')
    try {
      await addEntity('memberPayments', {
        memberId: member.id,
        memberName: member.name,
        amount: paymentAmount,
        status: 'pago',
        pixKey: member.pixKey || '',
        notes: paymentNotes,
        paidAt: new Date(),
      })
      setPaymentMemberId('')
      setPaymentAmount(0)
      setPaymentNotes('')
      setFeedback('Pagamento de integrante registrado.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Nao foi possivel registrar pagamento.'))
    }
  }

  return (
    <div className="space-y-6">
      <Card description="Gerencie dados, Pix e valor padrao pago por evento." title="Cadastro de integrantes">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nome completo" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} value={form.name} />
          <Input label="Nome artistico/apelido" onChange={(event) => setForm((current) => ({ ...current, artisticName: event.target.value }))} value={form.artisticName} />
          <Input label="Funcao na banda" onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} value={form.role} />
          <Input label="Valor padrao por evento" min={0} onChange={(event) => setForm((current) => ({ ...current, defaultPayment: Number(event.target.value) }))} type="number" value={form.defaultPayment} />
          <Input label="Telefone" onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} value={form.phone} />
          <Input label="E-mail" onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} value={form.email} />
          <Input label="Chave Pix" onChange={(event) => setForm((current) => ({ ...current, pixKey: event.target.value }))} value={form.pixKey} />
          <Select label="Tipo da chave Pix" onChange={(event) => setForm((current) => ({ ...current, pixKeyType: event.target.value as BandMember['pixKeyType'] }))} options={pixTypes.map((type) => ({ label: type, value: type }))} value={form.pixKeyType} />
          <Textarea label="Observacoes" onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} value={form.notes} wrapperClassName="md:col-span-2" />
        </div>
        {feedback && <p className="mt-4 rounded-md bg-white/8 p-3 text-sm text-slate-200">{feedback}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button icon={<Plus className="h-4 w-4" />} onClick={save}>{editingId ? 'Salvar integrante' : 'Cadastrar integrante'}</Button>
          <Button icon={<RotateCcw className="h-4 w-4" />} onClick={resetForm} variant="secondary">Limpar</Button>
        </div>
      </Card>

      <Card description="Registre valores pagos e mantenha historico por integrante." title="Pagamento para integrante">
        <div className="grid gap-4 md:grid-cols-[1fr_10rem_1fr_auto]">
          <Select onChange={(event) => {
            const member = members.find((item) => item.id === event.target.value)
            setPaymentMemberId(event.target.value)
            setPaymentAmount(member?.defaultPayment || 0)
          }} options={members.map((member) => ({ label: member.name, value: member.id }))} placeholder="Integrante" value={paymentMemberId} />
          <Input min={0} onChange={(event) => setPaymentAmount(Number(event.target.value))} type="number" value={paymentAmount} />
          <Input onChange={(event) => setPaymentNotes(event.target.value)} placeholder="Observacao" value={paymentNotes} />
          <Button icon={<HandCoins className="h-4 w-4" />} onClick={registerPayment}>Registrar</Button>
        </div>
      </Card>

      <Card title="Integrantes cadastrados">
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
                <div className="flex gap-2">
                  <Button aria-label="Editar" className="h-9 w-9 px-0" onClick={() => edit(member)} variant="ghost"><Edit className="h-4 w-4" /></Button>
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

      <Card title="Historico de pagamentos">
        <DataTable
          columns={[
            { header: 'Integrante', cell: (payment) => payment.memberName },
            { header: 'Valor', cell: (payment) => formatCurrency(payment.amount) },
            { header: 'Status', cell: (payment) => payment.status },
            { header: 'Data', cell: (payment) => formatDate(payment.paidAt || payment.createdAt) },
          ]}
          data={payments}
          emptyTitle="Nenhum pagamento registrado"
          getRowKey={(payment) => payment.id}
        />
      </Card>
    </div>
  )
}
