import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { FirebaseNotice } from '../../components/FirebaseNotice'
import { Button, Card, Input, Select, Textarea } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { brazilianStates } from '../../utils/constants'
import { getFriendlyFirebaseError } from '../../utils/firebaseErrors'

const registerSchema = z.object({
  name: z.string().min(3, 'Informe seu nome completo.'),
  document: z.string().min(11, 'Informe CPF ou CNPJ.'),
  phone: z.string().min(10, 'Informe telefone ou WhatsApp.'),
  email: z.string().email('Informe um e-mail valido.'),
  city: z.string().min(2, 'Informe a cidade.'),
  state: z.string().min(2, 'Informe o estado.'),
  notes: z.string().optional(),
  password: z.string().min(6, 'Use pelo menos 6 caracteres.'),
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const { registerClient, firebaseReady } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterForm) {
    setFormError('')
    try {
      await registerClient(data)
      navigate('/cliente/novo-orcamento', { replace: true })
    } catch (error) {
      setFormError(getFriendlyFirebaseError(error, 'Nao foi possivel criar o cadastro.'))
    }
  }

  return (
    <div className="min-h-screen bg-night-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl space-y-4">
        {!firebaseReady && <FirebaseNotice />}
        <Card>
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-md bg-gold-400 text-night-950">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Cadastro do cliente</h1>
              <p className="text-sm text-slate-400">Depois do cadastro voce ja pode solicitar orcamento.</p>
            </div>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <Input error={errors.name?.message} label="Nome completo" wrapperClassName="md:col-span-2" {...register('name')} />
            <Input error={errors.document?.message} label="CPF ou CNPJ" {...register('document')} />
            <Input error={errors.phone?.message} label="Telefone/WhatsApp" {...register('phone')} />
            <Input error={errors.email?.message} label="E-mail" type="email" {...register('email')} />
            <Input error={errors.password?.message} label="Senha" type="password" {...register('password')} />
            <Input error={errors.city?.message} label="Cidade" {...register('city')} />
            <Select
              error={errors.state?.message}
              label="Estado"
              options={brazilianStates.map((state) => ({ label: state, value: state }))}
              placeholder="Selecione"
              {...register('state')}
            />
            <Textarea label="Observacoes" wrapperClassName="md:col-span-2" {...register('notes')} />
            {formError && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-200 md:col-span-2">{formError}</p>}
            <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <Link className="text-sm text-gold-300 hover:text-gold-100" to="/login">
                Ja tenho cadastro
              </Link>
              <Button isLoading={isSubmitting} type="submit">
                Criar cadastro
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
