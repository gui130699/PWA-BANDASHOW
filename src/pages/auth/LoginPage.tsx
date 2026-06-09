import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AuthShell } from '../../components/brand/AuthShell'
import { FirebaseNotice } from '../../components/FirebaseNotice'
import { Button, Card, Input } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail valido.'),
  password: z.string().min(6, 'Informe sua senha.'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login, profile, firebaseReady } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  useEffect(() => {
    if (profile?.role === 'admin') navigate('/admin/dashboard', { replace: true })
    if (profile?.role === 'client') navigate('/cliente', { replace: true })
  }, [navigate, profile])

  async function onSubmit(data: LoginForm) {
    setFormError('')
    try {
      await login(data.email, data.password)
    } catch (error) {
      setFormError(getFriendlyFirebaseError(error, 'Nao foi possivel entrar.'))
    }
  }

  return (
    <AuthShell eyebrow="Acesso ao sistema">
      <div className="mx-auto w-full max-w-md space-y-4">
        {!firebaseReady && <FirebaseNotice />}
        <Card className="border-gold-300/20 bg-night-850/95">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Bem-vindo</p>
            <h1 className="mt-2 font-display text-3xl text-ivory-50">Entrar no Grupo Dvanera</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Acesse seus orcamentos, eventos e pagamentos.
            </p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input error={errors.email?.message} label="E-mail" type="email" {...register('email')} />
            <Input error={errors.password?.message} label="Senha" type="password" {...register('password')} />
            {formError && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-200">{formError}</p>}
            <Button className="w-full" isLoading={isSubmitting} type="submit">
              Entrar
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-400">
            Novo cliente?{' '}
            <Link className="font-semibold text-gold-300 hover:text-gold-100" to="/cadastro">
              Criar cadastro
            </Link>
          </p>
        </Card>
      </div>
    </AuthShell>
  )
}
