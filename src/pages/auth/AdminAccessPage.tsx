import { zodResolver } from '@hookform/resolvers/zod'
import { LogIn, ShieldCheck, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AuthShell } from '../../components/brand/AuthShell'
import { FirebaseNotice } from '../../components/FirebaseNotice'
import { Button, Card, Input, Loading } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { getAdminSetupStatus } from '../../services/adminAccountService'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'

const adminSetupSchema = z
  .object({
    name: z.string().min(3, 'Informe o nome do admin.'),
    email: z.string().email('Informe um e-mail válido.'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Use pelo menos 6 caracteres.'),
    confirmPassword: z.string().min(6, 'Confirme a senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas precisam ser iguais.',
    path: ['confirmPassword'],
  })

const adminLoginSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(6, 'Informe sua senha.'),
})

type AdminSetupForm = z.infer<typeof adminSetupSchema>
type AdminLoginForm = z.infer<typeof adminLoginSchema>

export function AdminAccessPage() {
  const { firebaseReady, login, logout, profile, registerAdmin } = useAuth()
  const navigate = useNavigate()
  const [adminConfigured, setAdminConfigured] = useState<boolean | null>(null)
  const [formError, setFormError] = useState('')

  const setupForm = useForm<AdminSetupForm>({ resolver: zodResolver(adminSetupSchema) })
  const loginForm = useForm<AdminLoginForm>({ resolver: zodResolver(adminLoginSchema) })

  useEffect(() => {
    getAdminSetupStatus()
      .then((status) => setAdminConfigured(status.configured))
      .catch(() => setAdminConfigured(true))
  }, [])

  useEffect(() => {
    if (profile?.role === 'admin') navigate('/admin/dashboard', { replace: true })
  }, [navigate, profile])

  async function createAdmin(data: AdminSetupForm) {
    setFormError('')
    try {
      await registerAdmin({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      })
      navigate('/admin/dashboard', { replace: true })
    } catch (error) {
      setFormError(getFriendlyFirebaseError(error, 'Não foi possível criar o admin.'))
      getAdminSetupStatus().then((status) => setAdminConfigured(status.configured)).catch(() => undefined)
    }
  }

  async function enterAdmin(data: AdminLoginForm) {
    setFormError('')
    try {
      await login(data.email, data.password)
    } catch (error) {
      setFormError(getFriendlyFirebaseError(error, 'Não foi possível entrar como admin.'))
    }
  }

  if (adminConfigured === null) {
    return <Loading label="Verificando cadastro admin..." />
  }

  const isClientAccount = profile?.role === 'client'

  return (
    <AuthShell eyebrow="Area administrativa">
      <div className="mx-auto w-full max-w-md space-y-4">
        {!firebaseReady && <FirebaseNotice />}

        <Card className="border-gold-300/20 bg-night-850/95">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-md border border-gold-300/30 bg-gold-400 text-night-950 shadow-gold">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl text-ivory-50">Acesso administrativo</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {adminConfigured
                ? 'Entre com a conta admin cadastrada.'
                : 'Crie o primeiro e unico cadastro admin deste painel.'}
            </p>
          </div>

          {isClientAccount ? (
            <div className="space-y-4">
              <p className="rounded-md bg-white/8 p-3 text-sm text-slate-200">
                Você está logado como cliente. Saia desta conta para acessar o admin.
              </p>
              <Button className="w-full" onClick={logout} variant="secondary">
                Sair da conta cliente
              </Button>
            </div>
          ) : adminConfigured ? (
            <form className="space-y-4" onSubmit={loginForm.handleSubmit(enterAdmin)}>
              <Input
                error={loginForm.formState.errors.email?.message}
                label="E-mail admin"
                type="email"
                {...loginForm.register('email')}
              />
              <Input
                error={loginForm.formState.errors.password?.message}
                label="Senha"
                type="password"
                {...loginForm.register('password')}
              />
              {formError && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-200">{formError}</p>}
              <Button
                className="w-full"
                icon={<LogIn className="h-4 w-4" />}
                isLoading={loginForm.formState.isSubmitting}
                type="submit"
              >
                Entrar no admin
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={setupForm.handleSubmit(createAdmin)}>
              <Input
                error={setupForm.formState.errors.name?.message}
                label="Nome do admin"
                {...setupForm.register('name')}
              />
              <Input
                error={setupForm.formState.errors.email?.message}
                label="E-mail admin"
                type="email"
                {...setupForm.register('email')}
              />
              <Input label="Telefone/WhatsApp" {...setupForm.register('phone')} />
              <Input
                error={setupForm.formState.errors.password?.message}
                label="Senha"
                type="password"
                {...setupForm.register('password')}
              />
              <Input
                error={setupForm.formState.errors.confirmPassword?.message}
                label="Confirmar senha"
                type="password"
                {...setupForm.register('confirmPassword')}
              />
              {formError && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-200">{formError}</p>}
              <Button
                className="w-full"
                icon={<UserPlus className="h-4 w-4" />}
                isLoading={setupForm.formState.isSubmitting}
                type="submit"
              >
                Criar admin
              </Button>
            </form>
          )}
        </Card>
      </div>
    </AuthShell>
  )
}
