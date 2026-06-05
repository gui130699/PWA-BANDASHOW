import { Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, Input, Select, Textarea } from '../../components/ui'
import { saveSettings, getSettings } from '../../services/settingsService'
import type { PixKeyType, Settings } from '../../types'
import { defaultSettings } from '../../utils/constants'

const pixOptions: PixKeyType[] = ['cpf', 'cnpj', 'email', 'telefone', 'aleatoria']

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
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
      setFeedback('Configuracoes salvas.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
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
  )
}
