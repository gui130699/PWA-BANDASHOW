import {
  Building2,
  ClipboardCopy,
  FileClock,
  ListChecks,
  MessageSquareText,
  Palette,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TerminalSquare,
  WalletCards,
} from 'lucide-react'
import type { QueryConstraint } from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import { AdminOptionManager } from '../../components/admin/AdminOptionManager'
import {
  AccordionSection,
  Badge,
  Button,
  DataTable,
  Input,
  Modal,
  Select,
  Textarea,
} from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { createAuditLog } from '../../services/auditService'
import { getSettings, saveSettings } from '../../services/settingsService'
import type { AdminOption, AuditLog, PixKeyType, Settings } from '../../types'
import { brazilianStates, defaultSettings } from '../../utils/constants'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'
import { formatDateTime } from '../../utils/format'

const pixOptions: Array<{ label: string; value: PixKeyType }> = [
  { label: 'CPF', value: 'cpf' },
  { label: 'CNPJ', value: 'cnpj' },
  { label: 'E-mail', value: 'email' },
  { label: 'Telefone', value: 'telefone' },
  { label: 'Chave aleatória', value: 'aleatoria' },
]
const emptyConstraints: QueryConstraint[] = []

type CatalogConfig = {
  collectionName: string
  title: string
  description: string
  singularLabel: string
}

const catalogs: CatalogConfig[] = [
  {
    collectionName: 'serviceCategories',
    title: 'Categorias de serviços',
    description: 'Usadas no cadastro de serviços.',
    singularLabel: 'Categoria',
  },
  {
    collectionName: 'supplierTypes',
    title: 'Tipos de fornecedores',
    description: 'Usados no cadastro de fornecedores.',
    singularLabel: 'Tipo',
  },
  {
    collectionName: 'memberRoles',
    title: 'Funções de integrantes',
    description: 'Usadas no cadastro de integrantes.',
    singularLabel: 'Função',
  },
  {
    collectionName: 'eventTypes',
    title: 'Tipos de evento',
    description: 'Exibidos ao cliente na solicitação de orçamento.',
    singularLabel: 'Tipo',
  },
]

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function BooleanSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | undefined
  onChange: (value: boolean) => void
}) {
  return (
    <Select
      label={label}
      onChange={(event) => onChange(event.target.value === 'true')}
      options={[
        { label: 'Sim', value: 'true' },
        { label: 'Não', value: 'false' },
      ]}
      value={String(value ?? false)}
    />
  )
}

function CatalogCard({
  config,
  onManage,
}: {
  config: CatalogConfig
  onManage: (config: CatalogConfig) => void
}) {
  const { data, loading } = useCollection<AdminOption>(config.collectionName, emptyConstraints)
  const activeCount = data.filter((item) => item.active).length

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{config.title}</h3>
          <p className="mt-1 text-sm text-slate-400">{config.description}</p>
        </div>
        <Badge>{loading ? 'Carregando...' : `${activeCount} ativas de ${data.length}`}</Badge>
      </div>
      <Button className="mt-4" onClick={() => onManage(config)} variant="secondary">
        Gerenciar
      </Button>
    </div>
  )
}

export function AdminSettingsPage() {
  const { user, profile } = useAuth()
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const { data: auditLogs, loading: auditLoading } = useCollection<AuditLog>('auditLogs')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogConfig | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setFeedback('')
    try {
      setSettings(await getSettings())
      setFeedback('Configurações recarregadas.')
    } catch (error) {
      setSettings(defaultSettings)
      setFeedback(getFriendlyFirebaseError(error, 'Não foi possível carregar as configurações.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  function updateMessage(key: keyof NonNullable<Settings['messages']>, value: string) {
    setSettings((current) => ({
      ...current,
      messages: { ...(current.messages || {}), [key]: value },
    }))
  }

  async function submit() {
    if (settings.defaultDepositPercent < 1 || settings.defaultDepositPercent > 100) {
      setFeedback('O percentual de entrada deve estar entre 1 e 100.')
      return
    }

    setSaving(true)
    setFeedback('')
    try {
      await saveSettings(settings)
      await createAuditLog({
        userId: user?.uid || 'admin',
        userName: profile?.name || 'Admin',
        action: 'settings_updated',
        entity: 'settings',
        entityId: 'main',
        description: 'Configurações administrativas e públicas atualizadas.',
      }).catch(() => undefined)
      setFeedback('Configurações salvas e dados públicos sincronizados.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Não foi possível salvar as configurações.'))
    } finally {
      setSaving(false)
    }
  }

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value)
      setFeedback(successMessage)
    } catch {
      setFeedback('Não foi possível copiar automaticamente.')
    }
  }

  const normalizedSearch = normalizeSearch(search)
  function visible(title: string, description: string, keywords = '') {
    if (!normalizedSearch) return true
    return normalizeSearch(`${title} ${description} ${keywords}`).includes(normalizedSearch)
  }
  const forceOpen = Boolean(normalizedSearch)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">
            Administração
          </p>
          <h1 className="mt-2 font-display text-3xl text-white">Configurações</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Gerencie dados da banda, pagamentos, aparência, regras do sistema e listas auxiliares.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            icon={<RefreshCcw className="h-4 w-4" />}
            isLoading={loading}
            onClick={() => void reload()}
            variant="secondary"
          >
            Recarregar dados
          </Button>
          <Button
            icon={<Save className="h-4 w-4" />}
            isLoading={saving}
            onClick={() => void submit()}
          >
            Salvar alterações
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
        <Input
          aria-label="Buscar configuração"
          className="pl-10"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar configuração..."
          value={search}
        />
      </div>

      {feedback && <p className="rounded-md bg-white/8 p-3 text-sm text-slate-200">{feedback}</p>}

      {visible('Dados da Banda', 'Nome, contatos e informações públicas do Grupo Dvanera.', 'instagram cidade estado sobre') && (
        <AccordionSection
          defaultOpen
          description="Nome, contatos e informações públicas do Grupo Dvanera."
          forceOpen={forceOpen}
          icon={<Building2 className="h-5 w-5" />}
          id="band-data"
          title="Dados da Banda"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Nome da banda" onChange={(event) => update('bandName', event.target.value)} value={settings.bandName} />
            <Input label="WhatsApp" onChange={(event) => update('whatsapp', event.target.value)} value={settings.whatsapp || ''} />
            <Input label="E-mail" onChange={(event) => update('email', event.target.value)} type="email" value={settings.email || ''} />
            <Input label="Instagram" onChange={(event) => update('instagram', event.target.value)} value={settings.instagram || ''} />
            <Input label="Cidade" onChange={(event) => update('city', event.target.value)} value={settings.city || ''} />
            <Select
              label="Estado"
              onChange={(event) => update('state', event.target.value)}
              options={brazilianStates.map((state) => ({ label: state, value: state }))}
              placeholder="Selecione"
              value={settings.state || ''}
            />
            <Textarea label="Descrição curta da banda" onChange={(event) => update('shortDescription', event.target.value)} value={settings.shortDescription || ''} wrapperClassName="md:col-span-2" />
            <Textarea label="Texto institucional/sobre a banda" onChange={(event) => update('aboutText', event.target.value)} value={settings.aboutText || ''} wrapperClassName="md:col-span-2" />
          </div>
        </AccordionSection>
      )}

      {visible('Pagamento e Pix', 'Configure a chave Pix, recebedor e percentual de entrada.', 'banco percentual instruções chave') && (
        <AccordionSection
          description="Configure a chave Pix, recebedor e percentual de entrada."
          forceOpen={forceOpen}
          icon={<WalletCards className="h-5 w-5" />}
          id="payment-pix"
          title="Pagamento e Pix"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Nome do recebedor Pix" onChange={(event) => update('pixReceiverName', event.target.value)} value={settings.pixReceiverName} />
            <Input label="Chave Pix" onChange={(event) => update('pixKey', event.target.value)} value={settings.pixKey} />
            <Select
              label="Tipo da chave Pix"
              onChange={(event) => update('pixKeyType', event.target.value as PixKeyType)}
              options={pixOptions}
              value={settings.pixKeyType}
            />
            <Input label="Banco" onChange={(event) => update('bankName', event.target.value)} value={settings.bankName || ''} />
            <Input
              label="Percentual de entrada padrão"
              max={100}
              min={1}
              onChange={(event) => update('defaultDepositPercent', Number(event.target.value))}
              type="number"
              value={settings.defaultDepositPercent}
            />
            <Textarea label="Instruções de pagamento" onChange={(event) => update('paymentInstructions', event.target.value)} value={settings.paymentInstructions} wrapperClassName="md:col-span-2" />
            <Textarea label="Mensagem exibida antes do pagamento" onChange={(event) => update('paymentWarningMessage', event.target.value)} value={settings.paymentWarningMessage || ''} wrapperClassName="md:col-span-2" />
          </div>
          {!settings.pixKey && (
            <p className="mt-4 rounded-md bg-amber-400/10 p-3 text-sm text-amber-100">
              A chave Pix está vazia. Os clientes não conseguirão copiar os dados de pagamento.
            </p>
          )}
          <Button
            className="mt-4"
            disabled={!settings.pixKey}
            icon={<ClipboardCopy className="h-4 w-4" />}
            onClick={() => void copyText(settings.pixKey, 'Chave Pix copiada.')}
            variant="secondary"
          >
            Testar cópia da chave Pix
          </Button>
        </AccordionSection>
      )}

      {visible('Regras de Orçamento', 'Defina regras comerciais usadas nos orçamentos.', 'validade desconto deslocamento aprovação observações') && (
        <AccordionSection
          description="Defina regras comerciais usadas nos orçamentos."
          forceOpen={forceOpen}
          icon={<SlidersHorizontal className="h-5 w-5" />}
          id="quote-rules"
          title="Regras de Orçamento"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Validade padrão do orçamento em dias" min={1} onChange={(event) => update('quoteValidityDays', Number(event.target.value))} type="number" value={settings.quoteValidityDays || 7} />
            <BooleanSelect label="Permitir desconto manual" onChange={(value) => update('allowManualDiscount', value)} value={settings.allowManualDiscount} />
            <BooleanSelect label="Permitir taxa de deslocamento" onChange={(value) => update('allowTravelFee', value)} value={settings.allowTravelFee} />
            <BooleanSelect label="Mostrar valor estimado antes da aprovação" onChange={(value) => update('showEstimatedValueBeforeApproval', value)} value={settings.showEstimatedValueBeforeApproval} />
            <BooleanSelect label="Permitir observações do cliente" onChange={(value) => update('allowClientNotes', value)} value={settings.allowClientNotes} />
            <Textarea label="Mensagem padrão ao enviar orçamento" onChange={(event) => update('quoteSubmittedMessage', event.target.value)} value={settings.quoteSubmittedMessage || ''} wrapperClassName="md:col-span-2" />
            <Textarea label="Mensagem padrão de aprovação" onChange={(event) => update('quoteApprovedMessage', event.target.value)} value={settings.quoteApprovedMessage || ''} />
            <Textarea label="Mensagem padrão de recusa" onChange={(event) => update('quoteRejectedMessage', event.target.value)} value={settings.quoteRejectedMessage || ''} />
            <Textarea label="Mensagem padrão de cancelamento" onChange={(event) => update('quoteCanceledMessage', event.target.value)} value={settings.quoteCanceledMessage || ''} wrapperClassName="md:col-span-2" />
          </div>
        </AccordionSection>
      )}

      {visible('Cadastros Auxiliares', 'Gerencie listas usadas nos formulários do sistema.', 'categoria fornecedor função integrante evento') && (
        <AccordionSection
          description="Gerencie listas usadas nos formulários do sistema."
          forceOpen={forceOpen}
          icon={<ListChecks className="h-5 w-5" />}
          id="auxiliary-records"
          title="Cadastros Auxiliares"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {catalogs.map((catalog) => (
              <CatalogCard config={catalog} key={catalog.collectionName} onManage={setSelectedCatalog} />
            ))}
          </div>
        </AccordionSection>
      )}

      {visible('Mensagens Automáticas', 'Personalize os textos exibidos ao cliente em cada etapa.', 'enviado análise aprovado pagamento entrada agendado realizado recusado cancelado') && (
        <AccordionSection
          description="Personalize os textos exibidos ao cliente em cada etapa."
          forceOpen={forceOpen}
          icon={<MessageSquareText className="h-5 w-5" />}
          id="automatic-messages"
          title="Mensagens Automáticas"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Textarea label="Mensagem quando orçamento é enviado" onChange={(event) => updateMessage('quoteSubmitted', event.target.value)} value={settings.messages?.quoteSubmitted || ''} />
            <Textarea label="Mensagem quando orçamento está em análise" onChange={(event) => updateMessage('quoteInReview', event.target.value)} value={settings.messages?.quoteInReview || ''} />
            <Textarea label="Mensagem quando orçamento é aprovado" onChange={(event) => updateMessage('quoteApproved', event.target.value)} value={settings.messages?.quoteApproved || ''} />
            <Textarea label="Mensagem quando pagamento é informado" onChange={(event) => updateMessage('paymentReported', event.target.value)} value={settings.messages?.paymentReported || ''} />
            <Textarea label="Mensagem quando entrada é confirmada" onChange={(event) => updateMessage('depositConfirmed', event.target.value)} value={settings.messages?.depositConfirmed || ''} />
            <Textarea label="Mensagem quando evento é agendado" onChange={(event) => updateMessage('eventScheduled', event.target.value)} value={settings.messages?.eventScheduled || ''} />
            <Textarea label="Mensagem quando evento é realizado" onChange={(event) => updateMessage('eventCompleted', event.target.value)} value={settings.messages?.eventCompleted || ''} />
            <Textarea label="Mensagem quando orçamento é recusado" onChange={(event) => updateMessage('quoteRejected', event.target.value)} value={settings.messages?.quoteRejected || ''} />
            <Textarea label="Mensagem quando orçamento é cancelado" onChange={(event) => updateMessage('quoteCanceled', event.target.value)} value={settings.messages?.quoteCanceled || ''} wrapperClassName="md:col-span-2" />
          </div>
        </AccordionSection>
      )}

      {visible('Aparência do Sistema', 'Configure textos e elementos visuais principais.', 'logo home imagem cor botão subtítulo') && (
        <AccordionSection
          description="Configure textos e elementos visuais principais."
          forceOpen={forceOpen}
          icon={<Palette className="h-5 w-5" />}
          id="appearance"
          title="Aparência do Sistema"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Título principal da Home" onChange={(event) => update('homeTitle', event.target.value)} value={settings.homeTitle || ''} />
            <Input label="Subtítulo da Home" onChange={(event) => update('homeSubtitle', event.target.value)} value={settings.homeSubtitle || ''} />
            <Input label="Texto do botão principal" onChange={(event) => update('homePrimaryButtonText', event.target.value)} value={settings.homePrimaryButtonText || ''} />
            <Input label="Texto do botão secundário" onChange={(event) => update('homeSecondaryButtonText', event.target.value)} value={settings.homeSecondaryButtonText || ''} />
            <BooleanSelect label="Usar imagem de fundo na Home" onChange={(value) => update('useHeroImage', value)} value={settings.useHeroImage} />
            <Input label="URL ou caminho da imagem principal" onChange={(event) => update('heroImagePath', event.target.value)} value={settings.heroImagePath || ''} />
            <Input label="URL ou caminho da logo" onChange={(event) => update('logoPath', event.target.value)} value={settings.logoPath || ''} />
            <Input label="Cor de destaque" onChange={(event) => update('brandAccentColor', event.target.value)} placeholder="#D6B25E" value={settings.brandAccentColor || ''} />
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Use URLs públicas ou caminhos de assets existentes. O branding padrão continua sendo usado quando os campos estiverem vazios.
          </p>
        </AccordionSection>
      )}

      {visible('Segurança e Administração', 'Informações do admin, reset seguro e status de acesso.', 'uid email reset comando') && (
        <AccordionSection
          badge={<Badge className="bg-emerald-400/15 text-emerald-200 ring-emerald-300/20">Admin único</Badge>}
          description="Informações do admin, reset seguro e status de acesso."
          forceOpen={forceOpen}
          icon={<ShieldCheck className="h-5 w-5" />}
          id="security"
          title="Segurança e Administração"
        >
          <div className="grid gap-3 rounded-md border border-white/10 bg-white/[0.035] p-4 text-sm md:grid-cols-2">
            <p><strong className="text-white">Admin atual:</strong> {profile?.name || 'Administrador'}</p>
            <p><strong className="text-white">E-mail:</strong> {user?.email || profile?.email || '-'}</p>
            <p><strong className="text-white">UID:</strong> {user?.uid || '-'}</p>
            <p><strong className="text-white">Criação:</strong> {user?.metadata.creationTime ? formatDateTime(user.metadata.creationTime) : '-'}</p>
          </div>
          <div className="mt-4 rounded-md border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-300">
            <div className="flex items-center gap-3 text-white">
              <TerminalSquare className="h-5 w-5 text-gold-200" />
              <strong>Reset administrativo seguro</strong>
            </div>
            <p className="mt-3">Por segurança, o reset do admin não é feito pelo navegador.</p>
            <p>Para resetar o admin principal, use no ambiente local:</p>
            <pre className="mt-3 overflow-x-auto rounded-md bg-night-950 p-3 text-gold-200">npm run reset-admin</pre>
            <Button
              className="mt-3"
              icon={<ClipboardCopy className="h-4 w-4" />}
              onClick={() => void copyText('npm run reset-admin', 'Comando de reset copiado.')}
              variant="secondary"
            >
              Copiar comando reset-admin
            </Button>
          </div>
        </AccordionSection>
      )}

      {visible('Auditoria e Manutenção', 'Acompanhe ações recentes e status do sistema.', 'logs versão cache deploy públicas') && (
        <AccordionSection
          badge={<Badge className="bg-emerald-400/15 text-emerald-200 ring-emerald-300/20">Sincronização ativa</Badge>}
          description="Acompanhe ações recentes e status do sistema."
          forceOpen={forceOpen}
          icon={<FileClock className="h-5 w-5" />}
          id="audit-maintenance"
          title="Auditoria e Manutenção"
        >
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md bg-white/[0.035] p-3 text-sm"><strong className="block text-white">Versão</strong><span className="text-slate-400">1.0.0</span></div>
            <div className="rounded-md bg-white/[0.035] p-3 text-sm"><strong className="block text-white">Cache PWA</strong><span className="text-slate-400">grupo-dvanera-v6</span></div>
            <div className="rounded-md bg-white/[0.035] p-3 text-sm"><strong className="block text-white">Último deploy</strong><span className="text-slate-400">Não documentado</span></div>
            <div className="rounded-md bg-white/[0.035] p-3 text-sm"><strong className="block text-white">Configurações públicas</strong><span className="text-slate-400">Sincronizadas ao salvar</span></div>
          </div>
          <div className="mb-4 flex justify-end">
            <Button icon={<RefreshCcw className="h-4 w-4" />} onClick={() => void reload()} variant="secondary">
              Recarregar configurações
            </Button>
          </div>
          <DataTable
            columns={[
              { header: 'Data', cell: (log) => formatDateTime(log.createdAt) },
              { header: 'Usuário', cell: (log) => log.userName },
              { header: 'Ação', cell: (log) => log.action },
              { header: 'Entidade', cell: (log) => log.entity },
              { header: 'Descrição', cell: (log) => log.description },
            ]}
            data={auditLogs.slice(0, 20)}
            emptyTitle="Nenhum log registrado"
            getRowKey={(log) => log.id}
            loading={auditLoading}
          />
        </AccordionSection>
      )}

      {normalizedSearch &&
        ![
          visible('Dados da Banda', 'Nome, contatos e informações públicas do Grupo Dvanera.', 'instagram cidade estado sobre'),
          visible('Pagamento e Pix', 'Configure a chave Pix, recebedor e percentual de entrada.', 'banco percentual instruções chave'),
          visible('Regras de Orçamento', 'Defina regras comerciais usadas nos orçamentos.', 'validade desconto deslocamento aprovação observações'),
          visible('Cadastros Auxiliares', 'Gerencie listas usadas nos formulários do sistema.', 'categoria fornecedor função integrante evento'),
          visible('Mensagens Automáticas', 'Personalize os textos exibidos ao cliente em cada etapa.', 'enviado análise aprovado pagamento entrada agendado realizado recusado cancelado'),
          visible('Aparência do Sistema', 'Configure textos e elementos visuais principais.', 'logo home imagem cor botão subtítulo'),
          visible('Segurança e Administração', 'Informações do admin, reset seguro e status de acesso.', 'uid email reset comando'),
          visible('Auditoria e Manutenção', 'Acompanhe ações recentes e status do sistema.', 'logs versão cache deploy públicas'),
        ].some(Boolean) && (
          <p className="rounded-md border border-white/10 bg-white/[0.035] p-5 text-center text-sm text-slate-400">
            Nenhuma configuração encontrada para “{search}”.
          </p>
        )}

      <Modal
        onClose={() => setSelectedCatalog(null)}
        open={Boolean(selectedCatalog)}
        title={selectedCatalog?.title || 'Cadastro auxiliar'}
      >
        {selectedCatalog && (
          <AdminOptionManager
            collectionName={selectedCatalog.collectionName}
            description={selectedCatalog.description}
            singularLabel={selectedCatalog.singularLabel}
            title={`Gerenciar ${selectedCatalog.title.toLocaleLowerCase('pt-BR')}`}
          />
        )}
      </Modal>
    </div>
  )
}
