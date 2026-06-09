import { Edit, Plus, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { createAuditLog } from '../../services/auditService'
import { addEntity, updateEntity } from '../../services/firestoreService'
import type { AdminOption } from '../../types'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'
import { Badge, Button, DataTable, Input, Textarea } from '../ui'

type AdminOptionManagerProps = {
  collectionName: string
  title: string
  description: string
  singularLabel: string
}

export function AdminOptionManager({
  collectionName,
  title,
  description,
  singularLabel,
}: AdminOptionManagerProps) {
  const { user, profile } = useAuth()
  const constraints = useMemo(() => [], [])
  const { data, loading } = useCollection<AdminOption>(collectionName, constraints)
  const [editingId, setEditingId] = useState('')
  const [name, setName] = useState('')
  const [descriptionValue, setDescriptionValue] = useState('')
  const [order, setOrder] = useState('')
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const sorted = useMemo(
    () =>
      [...data].sort(
        (first, second) =>
          (first.order ?? Number.MAX_SAFE_INTEGER) -
            (second.order ?? Number.MAX_SAFE_INTEGER) ||
          first.name.localeCompare(second.name, 'pt-BR'),
      ),
    [data],
  )

  function resetForm() {
    setEditingId('')
    setName('')
    setDescriptionValue('')
    setOrder('')
  }

  function edit(item: AdminOption) {
    setEditingId(item.id)
    setName(item.name)
    setDescriptionValue(item.description || '')
    setOrder(item.order === undefined ? '' : String(item.order))
    setFeedback('')
  }

  async function save() {
    const normalizedName = name.trim()
    if (!normalizedName) {
      setFeedback(`Informe o nome de ${singularLabel.toLowerCase()}.`)
      return
    }

    const duplicate = data.some(
      (item) =>
        item.id !== editingId &&
        item.name.trim().localeCompare(normalizedName, 'pt-BR', { sensitivity: 'base' }) === 0,
    )
    if (duplicate) {
      setFeedback('Já existe uma opção com este nome.')
      return
    }

    const payload = {
      name: normalizedName,
      description: descriptionValue.trim(),
      active: editingId ? data.find((item) => item.id === editingId)?.active ?? true : true,
      ...(order.trim() ? { order: Number(order) } : {}),
    }

    setSaving(true)
    setFeedback('')
    try {
      let entityId = editingId
      if (editingId) {
        await updateEntity(collectionName, editingId, payload)
      } else {
        const reference = await addEntity(collectionName, payload)
        entityId = reference.id
      }
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: editingId ? 'admin_option_updated' : 'admin_option_created',
        entity: collectionName,
        entityId,
        description: `${singularLabel} "${normalizedName}" ${
          editingId ? 'atualizado' : 'cadastrado'
        }.`,
      }).catch(() => undefined)
      setFeedback(`${singularLabel} ${editingId ? 'atualizado' : 'cadastrado'} com sucesso.`)
      resetForm()
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Não foi possível salvar a opção.'))
    } finally {
      setSaving(false)
    }
  }

  async function toggle(item: AdminOption) {
    setFeedback('')
    try {
      await updateEntity(collectionName, item.id, { active: !item.active })
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: item.active ? 'admin_option_disabled' : 'admin_option_enabled',
        entity: collectionName,
        entityId: item.id,
        description: `${singularLabel} "${item.name}" ${
          item.active ? 'desativado' : 'reativado'
        }.`,
      }).catch(() => undefined)
      setFeedback(`${singularLabel} ${item.active ? 'desativado' : 'reativado'} com sucesso.`)
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Não foi possível alterar o status.'))
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-lg text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_8rem]">
        <Input
          label={`Nome de ${singularLabel.toLowerCase()} *`}
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
        <Input
          label="Ordem"
          min={0}
          onChange={(event) => setOrder(event.target.value)}
          type="number"
          value={order}
        />
        <Textarea
          label="Descrição"
          onChange={(event) => setDescriptionValue(event.target.value)}
          value={descriptionValue}
          wrapperClassName="md:col-span-2"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          icon={editingId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          isLoading={saving}
          onClick={() => void save()}
        >
          {editingId ? 'Salvar alteração' : 'Cadastrar opção'}
        </Button>
        <Button icon={<RotateCcw className="h-4 w-4" />} onClick={resetForm} variant="secondary">
          Limpar
        </Button>
      </div>
      {feedback && <p className="rounded-md bg-white/8 p-3 text-sm text-slate-200">{feedback}</p>}
      <DataTable
        columns={[
          { header: 'Nome', cell: (item) => item.name },
          { header: 'Descrição', cell: (item) => item.description || '-' },
          { header: 'Ordem', cell: (item) => item.order ?? '-' },
          {
            header: 'Status',
            cell: (item) => (
              <Badge
                className={
                  item.active
                    ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/20'
                    : 'bg-red-500/15 text-red-200 ring-red-300/20'
                }
              >
                {item.active ? 'Ativo' : 'Inativo'}
              </Badge>
            ),
          },
          {
            header: 'Ações',
            cell: (item) => (
              <div className="flex flex-wrap gap-2">
                <Button
                  aria-label={`Editar ${item.name}`}
                  className="h-9 px-3"
                  icon={<Edit className="h-4 w-4" />}
                  onClick={() => edit(item)}
                  variant="secondary"
                >
                  Editar
                </Button>
                <Button className="h-9 px-3" onClick={() => void toggle(item)} variant="secondary">
                  {item.active ? 'Desativar' : 'Reativar'}
                </Button>
              </div>
            ),
          },
        ]}
        data={sorted}
        emptyDescription="Cadastre a primeira opção para disponibilizá-la nos formulários."
        emptyTitle="Nenhuma opção cadastrada"
        getRowKey={(item) => item.id}
        loading={loading}
      />
      <p className="text-xs leading-5 text-slate-500">
        Opções em uso não são excluídas. Desative-as para preservar o histórico dos cadastros.
      </p>
    </div>
  )
}
