import { zodResolver } from '@hookform/resolvers/zod'
import { Music2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
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
    <div className="grid min-h-screen place-items-center bg-night-950 px-4 py-10 text-white">
      <div className="w-full max-w-md space-y-4">
        {!firebaseReady && <FirebaseNotice />}
        <Card>
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-md bg-gold-400 text-night-950">
              <Music2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-semibold">Entrar no Grupo Dvanera</h1>
            <p className="mt-2 text-sm text-slate-400">Acesse como admin ou cliente.</p>
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
    </div>
  )
}
