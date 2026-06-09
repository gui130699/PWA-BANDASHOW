import { CheckCircle2, HandCoins } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, DataTable, Input, Select } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { createAuditLog } from '../../services/auditService'
import { addEntity } from '../../services/firestoreService'
import { confirmPayment, markInternalPaymentAsPaid } from '../../services/paymentService'
import type {
  BandMember,
  MemberPayment,
  Payment,
  Supplier,
  SupplierPayment,
} from '../../types'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'
import { formatCurrency, formatDate } from '../../utils/format'

type InternalPaymentStatus = 'pendente' | 'pago'

function todayInputValue() {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

function paymentDate(value: string) {
  return new Date(`${value}T12:00:00`)
}

function statusBadge(status: InternalPaymentStatus) {
  return (
    <Badge
      className={
        status === 'pago'
          ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/20'
          : 'bg-amber-400/15 text-amber-100 ring-amber-300/20'
      }
    >
      {status === 'pago' ? 'Pago' : 'Pendente'}
    </Badge>
  )
}

export function AdminPaymentsPage() {
  const { user, profile } = useAuth()
  const legacyConstraints = useMemo(() => [], [])
  const { data: payments, loading } = useCollection<Payment>('payments')
  const { data: memberPayments } = useCollection<MemberPayment>(
    'memberPayments',
    legacyConstraints,
  )
  const { data: supplierPayments } = useCollection<SupplierPayment>(
    'supplierPayments',
    legacyConstraints,
  )
  const {
    data: members,
    loading: membersLoading,
    error: membersError,
  } = useCollection<BandMember>('bandMembers', legacyConstraints)
  const {
    data: suppliers,
    loading: suppliersLoading,
    error: suppliersError,
  } = useCollection<Supplier>('suppliers', legacyConstraints)

  const [paymentMemberId, setPaymentMemberId] = useState('')
  const [memberAmount, setMemberAmount] = useState(0)
  const [memberDate, setMemberDate] = useState(todayInputValue)
  const [memberStatus, setMemberStatus] = useState<InternalPaymentStatus>('pago')
  const [memberReference, setMemberReference] = useState('')
  const [memberNotes, setMemberNotes] = useState('')
  const [memberSaving, setMemberSaving] = useState(false)
  const [memberFeedback, setMemberFeedback] = useState('')

  const [paymentSupplierId, setPaymentSupplierId] = useState('')
  const [supplierAmount, setSupplierAmount] = useState(0)
  const [supplierDate, setSupplierDate] = useState(todayInputValue)
  const [supplierStatus, setSupplierStatus] = useState<InternalPaymentStatus>('pago')
  const [supplierReference, setSupplierReference] = useState('')
  const [supplierNotes, setSupplierNotes] = useState('')
  const [supplierSaving, setSupplierSaving] = useState(false)
  const [supplierFeedback, setSupplierFeedback] = useState('')
  const [clientFeedback, setClientFeedback] = useState('')

  const memberOptions = useMemo(
    () =>
      members
        .filter((member) => member.active !== false)
        .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR')),
    [members],
  )
  const supplierOptions = useMemo(
    () =>
      suppliers
        .filter((supplier) => supplier.active !== false)
        .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR')),
    [suppliers],
  )
  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  )
  const suppliersById = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier])),
    [suppliers],
  )
  const selectedMember = membersById.get(paymentMemberId)
  const selectedSupplier = suppliersById.get(paymentSupplierId)

  function selectMember(value: string) {
    const member = membersById.get(value)
    setPaymentMemberId(value)
    setMemberAmount(member?.defaultPayment || 0)
    setMemberFeedback('')
  }

  function selectSupplier(value: string) {
    const supplier = suppliersById.get(value)
    setPaymentSupplierId(value)
    setSupplierAmount(supplier?.defaultCost || 0)
    setSupplierFeedback('')
  }

  async function registerMemberPayment() {
    const member = membersById.get(paymentMemberId)
    if (!member || memberAmount <= 0 || !memberDate) {
      setMemberFeedback('Selecione um integrante, informe o valor e a data.')
      return
    }

    setMemberSaving(true)
    setMemberFeedback('')
    try {
      const scheduledFor = paymentDate(memberDate)
      const reference = await addEntity('memberPayments', {
        memberId: member.id,
        memberName: member.name,
        memberRole: member.role,
        artisticName: member.artisticName || '',
        phone: member.phone || '',
        email: member.email || '',
        amount: memberAmount,
        status: memberStatus,
        pixKey: member.pixKey || '',
        pixKeyType: member.pixKeyType || 'cpf',
        reference: memberReference.trim(),
        notes: memberNotes.trim(),
        scheduledFor,
        ...(memberStatus === 'pago' ? { paidAt: scheduledFor } : {}),
        registeredBy: user?.uid || 'admin',
        registeredByName: profile?.name || 'Admin',
      })
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: 'member_payment_registered',
        entity: 'memberPayments',
        entityId: reference.id,
        description: `Pagamento de ${formatCurrency(memberAmount)} registrado para ${member.name}.`,
      }).catch(() => undefined)
      setPaymentMemberId('')
      setMemberAmount(0)
      setMemberDate(todayInputValue())
      setMemberStatus('pago')
      setMemberReference('')
      setMemberNotes('')
      setMemberFeedback('Pagamento de integrante registrado com sucesso.')
    } catch (error) {
      setMemberFeedback(getFriendlyFirebaseError(error, 'Não foi possível registrar o pagamento.'))
    } finally {
      setMemberSaving(false)
    }
  }

  async function registerSupplierPayment() {
    const supplier = suppliersById.get(paymentSupplierId)
    if (!supplier || supplierAmount <= 0 || !supplierDate) {
      setSupplierFeedback('Selecione um fornecedor, informe o valor e a data.')
      return
    }

    setSupplierSaving(true)
    setSupplierFeedback('')
    try {
      const scheduledFor = paymentDate(supplierDate)
      const reference = await addEntity('supplierPayments', {
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierType: supplier.type,
        contactName: supplier.contactName || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        amount: supplierAmount,
        status: supplierStatus,
        pixKey: supplier.pixKey || '',
        pixKeyType: supplier.pixKeyType || 'cpf',
        bankName: supplier.bankName || '',
        reference: supplierReference.trim(),
        notes: supplierNotes.trim(),
        scheduledFor,
        ...(supplierStatus === 'pago' ? { paidAt: scheduledFor } : {}),
        registeredBy: user?.uid || 'admin',
        registeredByName: profile?.name || 'Admin',
      })
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: 'supplier_payment_registered',
        entity: 'supplierPayments',
        entityId: reference.id,
        description: `Pagamento de ${formatCurrency(supplierAmount)} registrado para ${supplier.name}.`,
      }).catch(() => undefined)
      setPaymentSupplierId('')
      setSupplierAmount(0)
      setSupplierDate(todayInputValue())
      setSupplierStatus('pago')
      setSupplierReference('')
      setSupplierNotes('')
      setSupplierFeedback('Pagamento de fornecedor registrado com sucesso.')
    } catch (error) {
      setSupplierFeedback(
        getFriendlyFirebaseError(error, 'Não foi possível registrar o pagamento.'),
      )
    } finally {
      setSupplierSaving(false)
    }
  }

  async function confirmClientPayment(payment: Payment) {
    setClientFeedback('')
    try {
      await confirmPayment(payment.id, {
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
      })
      setClientFeedback('Pagamento de cliente confirmado com sucesso.')
    } catch (error) {
      setClientFeedback(
        getFriendlyFirebaseError(error, 'Não foi possível confirmar o pagamento.'),
      )
    }
  }

  async function markPaid(
    collectionName: 'memberPayments' | 'supplierPayments',
    paymentId: string,
    recipientName: string,
  ) {
    const setFeedback =
      collectionName === 'memberPayments' ? setMemberFeedback : setSupplierFeedback
    setFeedback('')
    try {
      await markInternalPaymentAsPaid(collectionName, paymentId)
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: 'internal_payment_paid',
        entity: collectionName,
        entityId: paymentId,
        description: `Pagamento de ${recipientName} marcado como pago.`,
      }).catch(() => undefined)
      setFeedback('Pagamento marcado como pago.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Não foi possível atualizar o pagamento.'))
    }
  }

  return (
    <div className="space-y-6">
      <Card
        description="Confirme manualmente entradas e pagamentos finais após conferir o banco."
        title="Pagamentos de clientes"
      >
        {clientFeedback && (
          <p className="mb-4 rounded-md bg-white/8 p-3 text-sm text-slate-200">
            {clientFeedback}
          </p>
        )}
        <DataTable
          columns={[
            {
              header: 'Referência',
              cell: (payment) => (
                <div>
                  <p className="font-medium text-white">{payment.type.replaceAll('_', ' ')}</p>
                  <p className="text-xs text-slate-400">Orçamento: {payment.quoteId}</p>
                </div>
              ),
            },
            { header: 'Valor', cell: (payment) => formatCurrency(payment.amount) },
            {
              header: 'Status',
              cell: (payment) => (
                <Badge className="bg-white/8 text-slate-200 ring-white/10">
                  {payment.status.replaceAll('_', ' ')}
                </Badge>
              ),
            },
            { header: 'Pix utilizado', cell: (payment) => payment.pixKeyUsed || '-' },
            {
              header: 'Mensagem do cliente',
              cell: (payment) => payment.clientMessage || 'Nenhuma mensagem',
            },
            {
              header: 'Datas',
              cell: (payment) => (
                <div>
                  <p>Criado: {formatDate(payment.createdAt)}</p>
                  <p className="text-xs text-slate-400">
                    Confirmado: {formatDate(payment.confirmedAt)}
                  </p>
                </div>
              ),
            },
            {
              header: 'Ação',
              cell: (payment) => (
                <Button
                  className="h-9 px-3"
                  disabled={payment.status === 'confirmado'}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={() => void confirmClientPayment(payment)}
                  variant="success"
                >
                  Confirmar
                </Button>
              ),
            },
          ]}
          data={payments}
          emptyTitle="Nenhum pagamento de cliente"
          getRowKey={(payment) => payment.id}
          loading={loading}
        />
      </Card>

      <Card
        description="Selecione um nome cadastrado e registre todos os dados do pagamento."
        title="Registrar pagamento de integrante"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Select
            disabled={membersLoading || Boolean(membersError) || memberOptions.length === 0}
            label="Integrante"
            onChange={(event) => selectMember(event.target.value)}
            options={memberOptions.map((member) => ({
              label: member.artisticName
                ? `${member.name} (${member.artisticName})`
                : member.name,
              value: member.id,
            }))}
            placeholder={
              membersLoading
                ? 'Carregando integrantes...'
                : membersError
                  ? 'Erro ao carregar integrantes'
                  : memberOptions.length
                    ? 'Selecione um integrante'
                    : 'Nenhum integrante ativo cadastrado'
            }
            value={paymentMemberId}
          />
          <Input
            label="Valor do pagamento"
            min={0}
            onChange={(event) => setMemberAmount(Number(event.target.value))}
            type="number"
            value={memberAmount}
          />
          <Input
            label="Data do pagamento"
            onChange={(event) => setMemberDate(event.target.value)}
            type="date"
            value={memberDate}
          />
          <Select
            label="Status"
            onChange={(event) => setMemberStatus(event.target.value as InternalPaymentStatus)}
            options={[
              { label: 'Pago', value: 'pago' },
              { label: 'Pendente', value: 'pendente' },
            ]}
            value={memberStatus}
          />
          <Input
            label="Referência"
            onChange={(event) => setMemberReference(event.target.value)}
            placeholder="Evento, serviço ou período"
            value={memberReference}
            wrapperClassName="xl:col-span-2"
          />
          <Input
            label="Observação"
            onChange={(event) => setMemberNotes(event.target.value)}
            placeholder="Informações adicionais"
            value={memberNotes}
            wrapperClassName="xl:col-span-2"
          />
        </div>
        {selectedMember && (
          <div className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase text-slate-500">Função</p>
              <p className="mt-1 text-white">{selectedMember.role}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Contato</p>
              <p className="mt-1 text-white">{selectedMember.phone || selectedMember.email || '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Pix</p>
              <p className="mt-1 break-all text-white">{selectedMember.pixKey || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Valor padrão</p>
              <p className="mt-1 text-white">{formatCurrency(selectedMember.defaultPayment)}</p>
            </div>
          </div>
        )}
        <div className="mt-5 flex justify-end">
          <Button
            disabled={!paymentMemberId || memberAmount <= 0 || !memberDate}
            icon={<HandCoins className="h-4 w-4" />}
            isLoading={memberSaving}
            onClick={() => void registerMemberPayment()}
          >
            Registrar pagamento
          </Button>
        </div>
        {membersError && (
          <p className="mt-3 text-xs text-red-200">Não foi possível carregar a lista de integrantes.</p>
        )}
        {!membersLoading && !membersError && memberOptions.length === 0 && (
          <p className="mt-3 text-xs text-amber-200">
            Cadastre ou reative um integrante para registrar pagamentos.
          </p>
        )}
        {memberFeedback && (
          <p className="mt-4 rounded-md bg-white/8 p-3 text-sm text-slate-200">{memberFeedback}</p>
        )}
      </Card>

      <Card
        description="Selecione um nome cadastrado e registre todos os dados do pagamento."
        title="Registrar pagamento de fornecedor"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Select
            disabled={suppliersLoading || Boolean(suppliersError) || supplierOptions.length === 0}
            label="Fornecedor"
            onChange={(event) => selectSupplier(event.target.value)}
            options={supplierOptions.map((supplier) => ({
              label: supplier.name,
              value: supplier.id,
            }))}
            placeholder={
              suppliersLoading
                ? 'Carregando fornecedores...'
                : suppliersError
                  ? 'Erro ao carregar fornecedores'
                  : supplierOptions.length
                    ? 'Selecione um fornecedor'
                    : 'Nenhum fornecedor ativo cadastrado'
            }
            value={paymentSupplierId}
          />
          <Input
            label="Valor do pagamento"
            min={0}
            onChange={(event) => setSupplierAmount(Number(event.target.value))}
            type="number"
            value={supplierAmount}
          />
          <Input
            label="Data do pagamento"
            onChange={(event) => setSupplierDate(event.target.value)}
            type="date"
            value={supplierDate}
          />
          <Select
            label="Status"
            onChange={(event) => setSupplierStatus(event.target.value as InternalPaymentStatus)}
            options={[
              { label: 'Pago', value: 'pago' },
              { label: 'Pendente', value: 'pendente' },
            ]}
            value={supplierStatus}
          />
          <Input
            label="Referência"
            onChange={(event) => setSupplierReference(event.target.value)}
            placeholder="Evento, serviço ou período"
            value={supplierReference}
            wrapperClassName="xl:col-span-2"
          />
          <Input
            label="Observação"
            onChange={(event) => setSupplierNotes(event.target.value)}
            placeholder="Informações adicionais"
            value={supplierNotes}
            wrapperClassName="xl:col-span-2"
          />
        </div>
        {selectedSupplier && (
          <div className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase text-slate-500">Tipo</p>
              <p className="mt-1 text-white">{selectedSupplier.type}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Contato</p>
              <p className="mt-1 text-white">{selectedSupplier.phone || selectedSupplier.email || '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Pix/Banco</p>
              <p className="mt-1 break-all text-white">{selectedSupplier.pixKey || 'Não informado'}</p>
              {selectedSupplier.bankName && (
                <p className="text-xs text-slate-400">{selectedSupplier.bankName}</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Custo padrão</p>
              <p className="mt-1 text-white">{formatCurrency(selectedSupplier.defaultCost)}</p>
            </div>
          </div>
        )}
        <div className="mt-5 flex justify-end">
          <Button
            disabled={!paymentSupplierId || supplierAmount <= 0 || !supplierDate}
            icon={<HandCoins className="h-4 w-4" />}
            isLoading={supplierSaving}
            onClick={() => void registerSupplierPayment()}
          >
            Registrar pagamento
          </Button>
        </div>
        {suppliersError && (
          <p className="mt-3 text-xs text-red-200">Não foi possível carregar a lista de fornecedores.</p>
        )}
        {!suppliersLoading && !suppliersError && supplierOptions.length === 0 && (
          <p className="mt-3 text-xs text-amber-200">
            Cadastre ou reative um fornecedor para registrar pagamentos.
          </p>
        )}
        {supplierFeedback && (
          <p className="mt-4 rounded-md bg-white/8 p-3 text-sm text-slate-200">{supplierFeedback}</p>
        )}
      </Card>

      <Card title="Pagamentos de integrantes">
        <DataTable
          columns={[
            {
              header: 'Integrante',
              cell: (payment) => {
                const member = membersById.get(payment.memberId)
                return (
                  <div>
                    <p className="font-medium text-white">{payment.memberName}</p>
                    <p className="text-xs text-slate-400">
                      {payment.memberRole || member?.role || 'Função não informada'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {payment.reference || 'Sem referência'}
                    </p>
                  </div>
                )
              },
            },
            {
              header: 'Contato',
              cell: (payment) => {
                const member = membersById.get(payment.memberId)
                return payment.phone || payment.email || member?.phone || member?.email || '-'
              },
            },
            {
              header: 'Pix',
              cell: (payment) => (
                <div>
                  <p className="max-w-48 break-all">{payment.pixKey || 'Não informado'}</p>
                  <p className="text-xs uppercase text-slate-400">{payment.pixKeyType || '-'}</p>
                </div>
              ),
            },
            { header: 'Valor', cell: (payment) => formatCurrency(payment.amount) },
            { header: 'Status', cell: (payment) => statusBadge(payment.status) },
            {
              header: 'Datas',
              cell: (payment) => (
                <div>
                  <p>Prevista: {formatDate(payment.scheduledFor || payment.paidAt)}</p>
                  <p className="text-xs text-slate-400">Pago: {formatDate(payment.paidAt)}</p>
                </div>
              ),
            },
            {
              header: 'Detalhes',
              cell: (payment) => (
                <div>
                  <p>{payment.notes || 'Sem observação'}</p>
                  <p className="text-xs text-slate-400">
                    Registrado por {payment.registeredByName || 'Admin'}
                  </p>
                </div>
              ),
            },
            {
              header: 'Ação',
              cell: (payment) => (
                <Button
                  className="h-9 px-3"
                  disabled={payment.status === 'pago'}
                  onClick={() =>
                    void markPaid('memberPayments', payment.id, payment.memberName)
                  }
                  variant="secondary"
                >
                  Marcar pago
                </Button>
              ),
            },
          ]}
          data={memberPayments}
          emptyTitle="Nenhum pagamento de integrante"
          getRowKey={(payment) => payment.id}
        />
      </Card>

      <Card title="Pagamentos de fornecedores">
        <DataTable
          columns={[
            {
              header: 'Fornecedor',
              cell: (payment) => {
                const supplier = suppliersById.get(payment.supplierId)
                return (
                  <div>
                    <p className="font-medium text-white">{payment.supplierName}</p>
                    <p className="text-xs text-slate-400">
                      {payment.supplierType || supplier?.type || 'Tipo não informado'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {payment.reference || 'Sem referência'}
                    </p>
                  </div>
                )
              },
            },
            {
              header: 'Contato',
              cell: (payment) => {
                const supplier = suppliersById.get(payment.supplierId)
                return payment.phone || payment.email || supplier?.phone || supplier?.email || '-'
              },
            },
            {
              header: 'Pix/Banco',
              cell: (payment) => (
                <div>
                  <p className="max-w-48 break-all">{payment.pixKey || 'Não informado'}</p>
                  <p className="text-xs uppercase text-slate-400">
                    {payment.pixKeyType || '-'}
                    {payment.bankName ? ` · ${payment.bankName}` : ''}
                  </p>
                </div>
              ),
            },
            { header: 'Valor', cell: (payment) => formatCurrency(payment.amount) },
            { header: 'Status', cell: (payment) => statusBadge(payment.status) },
            {
              header: 'Datas',
              cell: (payment) => (
                <div>
                  <p>Prevista: {formatDate(payment.scheduledFor || payment.paidAt)}</p>
                  <p className="text-xs text-slate-400">Pago: {formatDate(payment.paidAt)}</p>
                </div>
              ),
            },
            {
              header: 'Detalhes',
              cell: (payment) => (
                <div>
                  <p>{payment.notes || 'Sem observação'}</p>
                  <p className="text-xs text-slate-400">
                    Registrado por {payment.registeredByName || 'Admin'}
                  </p>
                </div>
              ),
            },
            {
              header: 'Ação',
              cell: (payment) => (
                <Button
                  className="h-9 px-3"
                  disabled={payment.status === 'pago'}
                  onClick={() =>
                    void markPaid('supplierPayments', payment.id, payment.supplierName)
                  }
                  variant="secondary"
                >
                  Marcar pago
                </Button>
              ),
            },
          ]}
          data={supplierPayments}
          emptyTitle="Nenhum pagamento de fornecedor"
          getRowKey={(payment) => payment.id}
        />
      </Card>
    </div>
  )
}
