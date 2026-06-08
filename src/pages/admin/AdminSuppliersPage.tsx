import { Edit, HandCoins, Plus, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, DataTable, Input, Select, Textarea } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { createAuditLog } from '../../services/auditService'
import { addEntity, updateEntity } from '../../services/firestoreService'
import type { Supplier, SupplierPayment } from '../../types'
import { supplierTypes } from '../../utils/constants'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'
import { formatCurrency, formatDate } from '../../utils/format'

const pixTypes = ['cpf', 'email', 'telefone', 'aleatoria']

const emptySupplier: Omit<Supplier, 'id'> = {
  name: '',
  type: 'Som',
  contactName: '',
  phone: '',
  email: '',
  pixKey: '',
  pixKeyType: 'cpf',
  defaultCost: 0,
  active: true,
  notes: '',
}

export function AdminSuppliersPage() {
  const { user, profile } = useAuth()
  const { data: suppliers, loading } = useCollection<Supplier>('suppliers')
  const { data: payments } = useCollection<SupplierPayment>('supplierPayments')
  const [form, setForm] = useState(emptySupplier)
  const [editingId, setEditingId] = useState('')
  const [paymentSupplierId, setPaymentSupplierId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentNotes, setPaymentNotes] = useState('')
  const [feedback, setFeedback] = useState('')

  function resetForm() {
    setForm(emptySupplier)
    setEditingId('')
  }

  function edit(supplier: Supplier) {
    setEditingId(supplier.id)
    setForm({
      name: supplier.name,
      type: supplier.type,
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      pixKey: supplier.pixKey || '',
      pixKeyType: supplier.pixKeyType || 'cpf',
      defaultCost: supplier.defaultCost,
      active: supplier.active,
      notes: supplier.notes || '',
    })
  }

  async function save() {
    setFeedback('')
    try {
      if (editingId) {
        await updateEntity('suppliers', editingId, form)
        await createAuditLog({
          userId: user?.uid || 'admin',
          userName: profile?.name || 'Admin',
          action: 'supplier_updated',
          entity: 'suppliers',
          entityId: editingId,
          description: `Fornecedor ${form.name} atualizado.`,
        }).catch(() => undefined)
        setFeedback('Fornecedor atualizado.')
      } else {
        const reference = await addEntity('suppliers', form)
        await createAuditLog({
          userId: user?.uid || 'admin',
          userName: profile?.name || 'Admin',
          action: 'supplier_created',
          entity: 'suppliers',
          entityId: reference.id,
          description: `Fornecedor ${form.name} cadastrado.`,
        }).catch(() => undefined)
        setFeedback('Fornecedor cadastrado.')
      }
      resetForm()
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Nao foi possivel salvar.'))
    }
  }

  async function registerPayment() {
    const supplier = suppliers.find((item) => item.id === paymentSupplierId)
    if (!supplier || paymentAmount <= 0) return
    setFeedback('')
    try {
      await addEntity('supplierPayments', {
        supplierId: supplier.id,
        supplierName: supplier.name,
        amount: paymentAmount,
        status: 'pago',
        pixKey: supplier.pixKey || '',
        notes: paymentNotes,
        paidAt: new Date(),
      })
      setPaymentSupplierId('')
      setPaymentAmount(0)
      setPaymentNotes('')
      setFeedback('Pagamento de fornecedor registrado.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Nao foi possivel registrar pagamento.'))
    }
  }

  return (
    <div className="space-y-6">
      <Card description="Gerencie contatos, Pix e custos padrao de fornecedores." title="Cadastro de fornecedores">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nome/Razao Social" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} value={form.name} />
          <Select label="Tipo de fornecedor" onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} options={supplierTypes.map((type) => ({ label: type, value: type }))} value={form.type} />
          <Input label="Contato" onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))} value={form.contactName} />
          <Input label="Valor padrao cobrado" min={0} onChange={(event) => setForm((current) => ({ ...current, defaultCost: Number(event.target.value) }))} type="number" value={form.defaultCost} />
          <Input label="Telefone" onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} value={form.phone} />
          <Input label="E-mail" onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} value={form.email} />
          <Input label="Chave Pix" onChange={(event) => setForm((current) => ({ ...current, pixKey: event.target.value }))} value={form.pixKey} />
          <Select label="Tipo da chave Pix" onChange={(event) => setForm((current) => ({ ...current, pixKeyType: event.target.value as Supplier['pixKeyType'] }))} options={pixTypes.map((type) => ({ label: type, value: type }))} value={form.pixKeyType} />
          <Textarea label="Observacoes" onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} value={form.notes} wrapperClassName="md:col-span-2" />
        </div>
        {feedback && <p className="mt-4 rounded-md bg-white/8 p-3 text-sm text-slate-200">{feedback}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button icon={<Plus className="h-4 w-4" />} onClick={save}>{editingId ? 'Salvar fornecedor' : 'Cadastrar fornecedor'}</Button>
          <Button icon={<RotateCcw className="h-4 w-4" />} onClick={resetForm} variant="secondary">Limpar</Button>
        </div>
      </Card>

      <Card description="Registre custos pagos e mantenha historico financeiro." title="Pagamento para fornecedor">
        <div className="grid gap-4 md:grid-cols-[1fr_10rem_1fr_auto]">
          <Select onChange={(event) => {
            const supplier = suppliers.find((item) => item.id === event.target.value)
            setPaymentSupplierId(event.target.value)
            setPaymentAmount(supplier?.defaultCost || 0)
          }} options={suppliers.map((supplier) => ({ label: supplier.name, value: supplier.id }))} placeholder="Fornecedor" value={paymentSupplierId} />
          <Input min={0} onChange={(event) => setPaymentAmount(Number(event.target.value))} type="number" value={paymentAmount} />
          <Input onChange={(event) => setPaymentNotes(event.target.value)} placeholder="Observacao" value={paymentNotes} />
          <Button icon={<HandCoins className="h-4 w-4" />} onClick={registerPayment}>Registrar</Button>
        </div>
      </Card>

      <Card title="Fornecedores cadastrados">
        <DataTable
          columns={[
            { header: 'Nome', cell: (supplier) => supplier.name },
            { header: 'Tipo', cell: (supplier) => supplier.type },
            { header: 'Custo padrao', cell: (supplier) => formatCurrency(supplier.defaultCost) },
            {
              header: 'Total pago',
              cell: (supplier) => formatCurrency(payments.filter((payment) => payment.supplierId === supplier.id).reduce((sum, payment) => sum + payment.amount, 0)),
            },
            {
              header: 'Status',
              cell: (supplier) => <Badge className={supplier.active ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/20' : 'bg-red-500/15 text-red-200 ring-red-300/20'}>{supplier.active ? 'Ativo' : 'Inativo'}</Badge>,
            },
            {
              header: 'Acoes',
              cell: (supplier) => (
                <div className="flex gap-2">
                  <Button aria-label="Editar" className="h-9 w-9 px-0" onClick={() => edit(supplier)} variant="ghost"><Edit className="h-4 w-4" /></Button>
                  <Button className="h-9 px-3" onClick={async () => {
                    await updateEntity('suppliers', supplier.id, { active: !supplier.active })
                    await createAuditLog({
                      userId: user?.uid || 'admin',
                      userName: profile?.name || 'Admin',
                      action: supplier.active ? 'supplier_disabled' : 'supplier_enabled',
                      entity: 'suppliers',
                      entityId: supplier.id,
                      description: `Fornecedor ${supplier.name} ${supplier.active ? 'desativado' : 'reativado'}.`,
                    }).catch(() => undefined)
                  }} variant="secondary">{supplier.active ? 'Desativar' : 'Reativar'}</Button>
                </div>
              ),
            },
          ]}
          data={suppliers}
          emptyTitle="Nenhum fornecedor cadastrado"
          getRowKey={(supplier) => supplier.id}
          loading={loading}
        />
      </Card>

      <Card title="Historico de pagamentos">
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
    </div>
  )
}
