import { Save, TerminalSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, DataTable, Input, Select, Textarea } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { createAuditLog } from '../../services/auditService'
import { saveSettings, getSettings } from '../../services/settingsService'
import type { AuditLog, PixKeyType, Settings } from '../../types'
import { defaultSettings } from '../../utils/constants'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'
import { formatDate } from '../../utils/format'

const pixOptions: PixKeyType[] = ['cpf', 'cnpj', 'email', 'telefone', 'aleatoria']

export function AdminSettingsPage() {
  const { user, profile } = useAuth()
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const { data: auditLogs, loading: auditLoading } = useCollection<AuditLog>('auditLogs')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings(defaultSettings))
  }, [])

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  async function submit() {
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
        description: 'Configuracoes de Pix e pagamento atualizadas.',
      }).catch(() => undefined)
      setFeedback('Configuracoes salvas.')
    } catch (error) {
      setFeedback(getFriendlyFirebaseError(error, 'Nao foi possivel salvar.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card description="Dados usados nas instrucoes Pix exibidas ao cliente." title="Configuracoes">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nome da banda" onChange={(event) => update('bandName', event.target.value)} value={settings.bandName} />
          <Input label="Nome do recebedor Pix" onChange={(event) => update('pixReceiverName', event.target.value)} value={settings.pixReceiverName} />
          <Input label="Chave Pix da banda" onChange={(event) => update('pixKey', event.target.value)} value={settings.pixKey} />
          <Select
            label="Tipo da chave Pix"
            onChange={(event) => update('pixKeyType', event.target.value as PixKeyType)}
            options={pixOptions.map((type) => ({ label: type, value: type }))}
            value={settings.pixKeyType}
          />
          <Input label="Banco" onChange={(event) => update('bankName', event.target.value)} value={settings.bankName || ''} />
          <Input label="WhatsApp" onChange={(event) => update('whatsapp', event.target.value)} value={settings.whatsapp || ''} />
          <Input label="E-mail" onChange={(event) => update('email', event.target.value)} type="email" value={settings.email || ''} />
          <Input
            label="Percentual de entrada"
            max={100}
            min={1}
            onChange={(event) => update('defaultDepositPercent', Number(event.target.value))}
            type="number"
            value={settings.defaultDepositPercent}
          />
          <Textarea
            label="Mensagem padrao para pagamento"
            onChange={(event) => update('paymentInstructions', event.target.value)}
            value={settings.paymentInstructions}
            wrapperClassName="md:col-span-2"
          />
        </div>
        {feedback && <p className="mt-4 rounded-md bg-white/8 p-3 text-sm text-slate-200">{feedback}</p>}
        <div className="mt-6 flex justify-end">
          <Button icon={<Save className="h-4 w-4" />} isLoading={saving} onClick={submit}>
            Salvar configuracoes
          </Button>
        </div>
      </Card>

      <Card
        action={
          <div className="grid h-11 w-11 place-items-center rounded-md bg-white/8 text-gold-200">
            <TerminalSquare className="h-5 w-5" />
          </div>
        }
        description="O reset do admin deve ser feito somente no terminal, com service account."
        title="Reset seguro do admin"
      >
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
          <p>Por seguranca, o painel nao possui segredo fixo nem exclusao de admin no front-end.</p>
          <p className="mt-3">Para liberar a criacao de um novo primeiro admin, rode localmente:</p>
          <pre className="mt-3 overflow-x-auto rounded-md bg-night-950 p-3 text-gold-200">npm run reset-admin</pre>
        </div>
      </Card>

      <Card description="Ultimas acoes registradas no painel administrativo." title="Auditoria">
        <DataTable
          columns={[
            { header: 'Data', cell: (log) => formatDate(log.createdAt) },
            { header: 'Usuario', cell: (log) => log.userName },
            { header: 'Acao', cell: (log) => log.action },
            { header: 'Descricao', cell: (log) => log.description },
          ]}
          data={auditLogs.slice(0, 10)}
          emptyTitle="Nenhum log registrado"
          getRowKey={(log) => log.id}
          loading={auditLoading}
        />
      </Card>
    </div>
  )
}
