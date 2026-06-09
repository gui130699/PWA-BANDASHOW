import { Edit, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, ConfirmDialog, Input, Loading } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { createAuditLog } from '../../services/auditService'
import {
  getSettings,
  renameServiceType,
  saveCatalogTypes,
} from '../../services/settingsService'
import { eventTypes, serviceCategories } from '../../utils/constants'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'

type CatalogKind = 'service' | 'event'

type CatalogState = Record<CatalogKind, string[]>
type DraftState = Record<CatalogKind, string>
type EditingState = Record<CatalogKind, number | null>

type PendingDelete = {
  kind: CatalogKind
  index: number
  name: string
} | null

const catalogMeta: Record<
  CatalogKind,
  {
    title: string
    description: string
    inputLabel: string
    emptyTitle: string
  }
> = {
  service: {
    title: 'Tipos de servico',
    description:
      'Categorias usadas no cadastro de servicos. Ao renomear, os servicos atuais dessa categoria tambem sao atualizados.',
    inputLabel: 'Nome do tipo de servico',
    emptyTitle: 'Nenhum tipo de servico cadastrado',
  },
  event: {
    title: 'Tipos de evento',
    description:
      'Opcoes exibidas ao cliente em novos orcamentos. Eventos ja enviados preservam o nome original.',
    inputLabel: 'Nome do tipo de evento',
    emptyTitle: 'Nenhum tipo de evento cadastrado',
  },
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function AdminCatalogTypesPage() {
  const { user, profile } = useAuth()
  const [catalogs, setCatalogs] = useState<CatalogState>({
    service: [...serviceCategories],
    event: [...eventTypes],
  })
  const [drafts, setDrafts] = useState<DraftState>({ service: '', event: '' })
  const [editing, setEditing] = useState<EditingState>({ service: null, event: null })
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null)
  const [loading, setLoading] = useState(true)
  const [savingKind, setSavingKind] = useState<CatalogKind | null>(null)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    getSettings()
      .then((settings) => {
        setCatalogs({
          service: settings.serviceTypes?.length ? settings.serviceTypes : [...serviceCategories],
          event: settings.eventTypes?.length ? settings.eventTypes : [...eventTypes],
        })
      })
      .catch((error) => {
        setFeedback(getFriendlyFirebaseError(error, 'Nao foi possivel carregar os tipos.'))
      })
      .finally(() => setLoading(false))
  }, [])

  function resetEditor(kind: CatalogKind) {
    setDrafts((current) => ({ ...current, [kind]: '' }))
    setEditing((current) => ({ ...current, [kind]: null }))
  }

  function startEditing(kind: CatalogKind, index: number) {
    setDrafts((current) => ({ ...current, [kind]: catalogs[kind][index] }))
    setEditing((current) => ({ ...current, [kind]: index }))
    setFeedback('')
  }

  async function persistCatalog(
    kind: CatalogKind,
    nextValues: string[],
    actionDescription: string,
    renamedFrom?: string,
    renamedTo?: string,
  ) {
    setSavingKind(kind)
    setFeedback('')

    try {
      const nextCatalogs: CatalogState = { ...catalogs, [kind]: nextValues }

      if (kind === 'service' && renamedFrom && renamedTo && renamedFrom !== renamedTo) {
        await renameServiceType(
          nextCatalogs.service,
          nextCatalogs.event,
          renamedFrom,
          renamedTo,
        )
      } else {
        await saveCatalogTypes(nextCatalogs.service, nextCatalogs.event)
      }

      setCatalogs(nextCatalogs)
      resetEditor(kind)
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: 'catalog_types_updated',
        entity: 'settings',
        entityId: 'main',
        description: actionDescription,
      }).catch(() => undefined)
      setFeedback(actionDescription)
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Nao foi possivel salvar o tipo.'))
    } finally {
      setSavingKind(null)
    }
  }

  async function saveType(kind: CatalogKind) {
    const name = normalizeName(drafts[kind])
    const editingIndex = editing[kind]

    if (!name) {
      setFeedback('Informe um nome para o tipo.')
      return
    }

    const duplicate = catalogs[kind].some(
      (item, index) =>
        index !== editingIndex &&
        item.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'),
    )

    if (duplicate) {
      setFeedback('Ja existe um tipo cadastrado com esse nome.')
      return
    }

    if (editingIndex === null) {
      await persistCatalog(
        kind,
        [...catalogs[kind], name],
        `${kind === 'service' ? 'Tipo de servico' : 'Tipo de evento'} ${name} criado.`,
      )
      return
    }

    const previousName = catalogs[kind][editingIndex]
    const nextValues = catalogs[kind].map((item, index) => (index === editingIndex ? name : item))
    await persistCatalog(
      kind,
      nextValues,
      `${kind === 'service' ? 'Tipo de servico' : 'Tipo de evento'} ${previousName} renomeado para ${name}.`,
      previousName,
      name,
    )
  }

  async function confirmDelete() {
    if (!pendingDelete) return

    const { kind, index, name } = pendingDelete
    setPendingDelete(null)

    if (catalogs[kind].length <= 1) {
      setFeedback('Mantenha pelo menos um tipo cadastrado.')
      return
    }

    await persistCatalog(
      kind,
      catalogs[kind].filter((_, itemIndex) => itemIndex !== index),
      `${kind === 'service' ? 'Tipo de servico' : 'Tipo de evento'} ${name} excluido.`,
    )
  }

  function renderCatalog(kind: CatalogKind) {
    const meta = catalogMeta[kind]
    const editingIndex = editing[kind]

    return (
      <Card description={meta.description} title={meta.title}>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            label={meta.inputLabel}
            onChange={(event) =>
              setDrafts((current) => ({ ...current, [kind]: event.target.value }))
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') void saveType(kind)
            }}
            placeholder="Digite o nome"
            value={drafts[kind]}
          />
          <Button
            className="self-end"
            icon={<Plus className="h-4 w-4" />}
            isLoading={savingKind === kind}
            onClick={() => void saveType(kind)}
          >
            {editingIndex === null ? 'Criar tipo' : 'Salvar alteracao'}
          </Button>
        </div>

        {editingIndex !== null && (
          <div className="mt-3">
            <Button
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={() => resetEditor(kind)}
              variant="secondary"
            >
              Cancelar edicao
            </Button>
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-lg border border-white/10">
          {catalogs[kind].length === 0 ? (
            <p className="p-4 text-sm text-slate-400">{meta.emptyTitle}</p>
          ) : (
            catalogs[kind].map((name, index) => (
              <div
                className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.025] px-4 py-3 last:border-b-0"
                key={`${name}-${index}`}
              >
                <span className="text-sm font-medium text-ivory-50">{name}</span>
                <div className="flex gap-2">
                  <Button
                    aria-label={`Editar ${name}`}
                    className="h-9 w-9 px-0"
                    disabled={savingKind !== null}
                    onClick={() => startEditing(kind, index)}
                    variant="ghost"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    aria-label={`Excluir ${name}`}
                    className="h-9 w-9 px-0"
                    disabled={savingKind !== null}
                    onClick={() => setPendingDelete({ kind, index, name })}
                    variant="danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    )
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        {renderCatalog('service')}
        {renderCatalog('event')}
      </div>

      {feedback && <p className="rounded-md bg-white/8 p-3 text-sm text-slate-200">{feedback}</p>}

      <ConfirmDialog
        confirmLabel="Excluir tipo"
        description={`O tipo "${pendingDelete?.name || ''}" deixara de aparecer em novos cadastros. Registros existentes manterao o valor salvo.`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        open={Boolean(pendingDelete)}
        title="Excluir tipo?"
        variant="danger"
      />
    </div>
  )
}
