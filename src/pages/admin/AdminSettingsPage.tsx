import { Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Modal, Select, Textarea } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { saveSettings, getSettings } from '../../services/settingsService'
import type { PixKeyType, Settings } from '../../types'
import { defaultSettings } from '../../utils/constants'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'

const pixOptions: PixKeyType[] = ['cpf', 'cnpj', 'email', 'telefone', 'aleatoria']

export function AdminSettingsPage() {
  const { deleteAdminAccount } = useAuth()
  const navigate = useNavigate()
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [masterPassword, setMasterPassword] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [deleteFeedback, setDeleteFeedback] = useState('')
  const [deleting, setDeleting] = useState(false)

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

  function closeDeleteModal() {
    if (deleting) return
    setDeleteOpen(false)
    setMasterPassword('')
    setAccountPassword('')
    setDeleteFeedback('')
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteFeedback('')
    try {
      await deleteAdminAccount({ masterPassword, accountPassword })
      navigate('/admin/acesso', { replace: true })
    } catch (error) {
      setDeleteFeedback(getFriendlyFirebaseError(error, 'Nao foi possivel excluir o cadastro.'))
    } finally {
      setDeleting(false)
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
          <Button icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteOpen(true)} variant="danger">
            Excluir cadastro
          </Button>
        }
        description="Remove o unico cadastro admin e libera a criacao de um novo primeiro admin."
        title="Cadastro admin"
      >
        <p className="text-sm leading-6 text-slate-300">
          Esta acao exige a senha mestre e a senha da propria conta admin para confirmar a exclusao no Firebase.
        </p>
      </Card>

      <Modal onClose={closeDeleteModal} open={deleteOpen} title="Excluir cadastro admin">
        <div className="space-y-4">
          <p className="rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm leading-6 text-red-100">
            Depois de excluir, o painel admin ficara sem cadastro e o proximo acesso podera criar um novo primeiro admin.
          </p>
          <Input
            label="Senha mestre"
            onChange={(event) => setMasterPassword(event.target.value)}
            type="password"
            value={masterPassword}
          />
          <Input
            label="Senha da conta admin"
            onChange={(event) => setAccountPassword(event.target.value)}
            type="password"
            value={accountPassword}
          />
          {deleteFeedback && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-200">{deleteFeedback}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button disabled={deleting} onClick={closeDeleteModal} variant="secondary">
              Cancelar
            </Button>
            <Button
              icon={<Trash2 className="h-4 w-4" />}
              isLoading={deleting}
              onClick={confirmDelete}
              variant="danger"
            >
              Excluir cadastro
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
