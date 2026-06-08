import { collection, getDocs } from 'firebase/firestore'
import { Edit, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, DataTable, Input, Select, Textarea } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { requireDb } from '../../lib/firebase'
import { createService, removeService, updateService } from '../../services/serviceService'
import { createAuditLog } from '../../services/auditService'
import type { BandMember, MemberCostLink, Quote, Service, Supplier, SupplierLink } from '../../types'
import { serviceCategories } from '../../utils/constants'
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

export function AdminServicesPage() {
  const { user, profile } = useAuth()
  const { data: services, loading } = useCollection<Service>('services')
  const { data: suppliers } = useCollection<Supplier>('suppliers')
  const { data: members } = useCollection<BandMember>('bandMembers')
  const [form, setForm] = useState(emptyService)
  const [editingId, setEditingId] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [supplierCost, setSupplierCost] = useState(0)
  const [memberId, setMemberId] = useState('')
  const [memberCost, setMemberCost] = useState(0)
  const [feedback, setFeedback] = useState('')

  const filtered = useMemo(
    () =>
      services
        .filter((service) => (filter === 'all' ? true : filter === 'active' ? service.active : !service.active))
        .filter((service) => service.name.toLowerCase().includes(search.toLowerCase())),
    [filter, search, services],
  )

  function resetForm() {
    setForm(emptyService)
    setEditingId('')
    setSupplierId('')
    setMemberId('')
    setSupplierCost(0)
    setMemberCost(0)
  }

  function edit(service: Service) {
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
  }

  async function save() {
    setFeedback('')
    try {
      if (editingId) {
        await updateService(editingId, form)
        await createAuditLog({
          userId: user?.uid || 'admin',
          userName: profile?.name || 'Admin',
          action: 'service_updated',
          entity: 'services',
          entityId: editingId,
          description: `Servico ${form.name} atualizado.`,
        }).catch(() => undefined)
        setFeedback('Servico atualizado.')
      } else {
        const reference = await createService(form)
        await createAuditLog({
          userId: user?.uid || 'admin',
          userName: profile?.name || 'Admin',
          action: 'service_created',
          entity: 'services',
          entityId: reference.id,
          description: `Servico ${form.name} criado.`,
        }).catch(() => undefined)
        setFeedback('Servico criado.')
      }
      resetForm()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel salvar o servico.')
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
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel excluir.')
    }
  }

  return (
    <div className="space-y-6">
      <Card description="Cadastre servicos vendidos ao cliente e seus custos internos." title="Cadastro de servicos">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nome do servico" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} value={form.name} />
          <Select label="Categoria" onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} options={serviceCategories.map((category) => ({ label: category, value: category }))} value={form.category} />
          <Input label="Valor padrao" min={0} onChange={(event) => setForm((current) => ({ ...current, basePrice: Number(event.target.value) }))} type="number" value={form.basePrice} />
          <Select
            label="Permitir edicao do valor"
            onChange={(event) => setForm((current) => ({ ...current, allowPriceEdit: event.target.value === 'true' }))}
            options={[
              { label: 'Sim', value: 'true' },
              { label: 'Nao', value: 'false' },
            ]}
            value={String(form.allowPriceEdit)}
          />
          <Textarea label="Descricao" onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} value={form.description} wrapperClassName="md:col-span-2" />
          <Textarea label="Observacoes internas" onChange={(event) => setForm((current) => ({ ...current, internalNotes: event.target.value }))} value={form.internalNotes} wrapperClassName="md:col-span-2" />
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
                  <button className="text-red-200" onClick={() => setForm((current) => ({ ...current, supplierLinks: current.supplierLinks.filter((_, itemIndex) => itemIndex !== index) }))} type="button">
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
                  <button className="text-red-200" onClick={() => setForm((current) => ({ ...current, memberCostLinks: current.memberCostLinks.filter((_, itemIndex) => itemIndex !== index) }))} type="button">
                    remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {feedback && <p className="mt-4 rounded-md bg-white/8 p-3 text-sm text-slate-200">{feedback}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button icon={<Plus className="h-4 w-4" />} onClick={save}>
            {editingId ? 'Salvar alteracoes' : 'Criar servico'}
          </Button>
          <Button icon={<RotateCcw className="h-4 w-4" />} onClick={resetForm} variant="secondary">
            Limpar
          </Button>
        </div>
      </Card>

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
        title="Servicos cadastrados"
      >
        <DataTable
          columns={[
            { header: 'Servico', cell: (service) => service.name },
            { header: 'Categoria', cell: (service) => service.category },
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
                <div className="flex gap-2">
                  <Button aria-label="Editar" className="h-9 w-9 px-0" onClick={() => edit(service)} variant="ghost">
                    <Edit className="h-4 w-4" />
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
    </div>
  )
}
