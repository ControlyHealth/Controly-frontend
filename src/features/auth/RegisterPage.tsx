import { useMemo, useState } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import {
  Stethoscope,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  CalendarDays,
  ShieldCheck,
  Activity,
} from 'lucide-react'
import { userService, type DentistQuantity, type RegisterInput } from '@/services/user'
import { AuthError } from '@/services/user'
import Logo from '../../assets/favicon.png'
import { cn } from '@/lib/cn'
import {
  maskCPF,
  maskCNPJ,
  maskPhone,
  maskCRO,
  isValidCPF,
  isValidCNPJ,
  isValidPhone,
  isValidCRO,
  isValidEmail,
  UF_LIST,
} from '@/lib/masks'

type AccountType = 'dentist' | 'clinic'
type Sub = 'dados' | 'equipe'

const QUANTITIES: { value: DentistQuantity; label: string }[] = [
  { value: '1', label: '1 dentista' },
  { value: '2-5', label: '2 a 5' },
  { value: '6-10', label: '6 a 10' },
  { value: '11-20', label: '11 a 20' },
  { value: '20+', label: 'Mais de 20' },
]

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirm: '',
  cpf: '',
  cro: '',
  croState: '',
  specialty: '',
  phone: '',
  professionalName: '',
  clinicName: '',
  cnpj: '',
  responsible: '',
  address: '',
  city: '',
  state: '',
}
type FormState = typeof initialForm

function inputCls(hasError: boolean, extra = '') {
  return cn(
    'w-full rounded-xl border bg-slate-50/60 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4',
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100',
    extra,
  )
}

function Labeled({
  label,
  error,
  optional,
  children,
}: {
  label: string
  error?: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {optional && <span className="ml-1 font-normal normal-case text-slate-400">(opcional)</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const [sub, setSub] = useState<Sub>('dados')
  const [form, setForm] = useState<FormState>(initialForm)
  const [quantity, setQuantity] = useState<DentistQuantity | ''>('')
  const [showSenha, setShowSenha] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  // ---- validação em tempo real (erros por campo) ----
  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState | 'quantity', string>> = {}
    const req = (v: string) => v.trim().length === 0

    // comuns
    if (req(form.email)) e.email = 'Informe o e-mail.'
    else if (!isValidEmail(form.email)) e.email = 'E-mail inválido.'
    if (req(form.password)) e.password = 'Crie uma senha.'
    else if (form.password.length < 6) e.password = 'Mínimo de 6 caracteres.'
    if (form.confirm !== form.password) e.confirm = 'As senhas não coincidem.'
    if (req(form.phone)) e.phone = 'Informe o telefone.'
    else if (!isValidPhone(form.phone)) e.phone = 'Telefone incompleto.'

    if (accountType === 'dentist') {
      if (form.name.trim().length < 3) e.name = 'Informe o nome completo.'
      if (req(form.cpf)) e.cpf = 'Informe o CPF.'
      else if (!isValidCPF(form.cpf)) e.cpf = 'CPF inválido.'
      if (!isValidCRO(form.cro)) e.cro = 'CRO inválido.'
      if (req(form.croState)) e.croState = 'UF do CRO.'
      if (form.specialty.trim().length < 2) e.specialty = 'Informe a especialidade.'
    }

    if (accountType === 'clinic') {
      if (form.clinicName.trim().length < 2) e.clinicName = 'Informe o nome da clínica.'
      if (req(form.cnpj)) e.cnpj = 'Informe o CNPJ.'
      else if (!isValidCNPJ(form.cnpj)) e.cnpj = 'CNPJ inválido.'
      if (form.responsible.trim().length < 3) e.responsible = 'Informe o responsável.'
      if (form.address.trim().length < 3) e.address = 'Informe o endereço.'
      if (form.city.trim().length < 2) e.city = 'Informe a cidade.'
      if (req(form.state)) e.state = 'UF.'
    }
    return e
  }, [form, accountType])

  const dadosValidos = useMemo(() => {
    const keys: (keyof FormState)[] =
      accountType === 'dentist'
        ? ['name', 'email', 'password', 'confirm', 'cpf', 'cro', 'croState', 'specialty', 'phone']
        : ['clinicName', 'cnpj', 'responsible', 'email', 'password', 'confirm', 'phone', 'address', 'city', 'state']
    return keys.every((k) => !errors[k])
  }, [errors, accountType])

  const err = (k: keyof FormState) => (submitted ? errors[k] : undefined)

  // já autenticado? sai do fluxo de cadastro (após os hooks acima)
  if (userService.isAuthenticated()) {
    return <Navigate to="/" replace />
  }

  // ---- passos ----
  const steps = accountType === 'clinic' ? ['Tipo', 'Dados', 'Equipe'] : ['Tipo', 'Dados']
  const stepIndex = accountType === null ? 0 : sub === 'equipe' ? 2 : 1

  function escolherTipo(t: AccountType) {
    setAccountType(t)
    setSub('dados')
    setSubmitted(false)
    setErroGeral(null)
  }

  function voltar() {
    setErroGeral(null)
    if (sub === 'equipe') return setSub('dados')
    setAccountType(null)
    setSubmitted(false)
  }

  function avancarDados(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!dadosValidos) return
    if (accountType === 'clinic') {
      setSubmitted(false)
      setSub('equipe')
    } else {
      finalizar()
    }
  }

  function finalizar() {
    setErroGeral(null)
    if (accountType === 'clinic' && !quantity) {
      return setErroGeral('Selecione a quantidade de dentistas.')
    }
    setLoading(true)
    setTimeout(() => {
      try {
        const input: RegisterInput =
          accountType === 'dentist'
            ? {
                accountType: 'dentist',
                name: form.name,
                email: form.email,
                password: form.password,
                cpf: form.cpf,
                cro: form.cro,
                croState: form.croState,
                specialty: form.specialty,
                phone: form.phone,
                professionalName: form.professionalName,
              }
            : {
                accountType: 'clinic',
                clinicName: form.clinicName,
                cnpj: form.cnpj,
                responsible: form.responsible,
                email: form.email,
                password: form.password,
                phone: form.phone,
                address: form.address,
                city: form.city,
                state: form.state,
                dentistQuantity: quantity as DentistQuantity,
              }
        userService.register(input)
        // conta criada e sessão iniciada — próximo passo é escolher o plano
        navigate('/planos', { replace: true })
      } catch (e2) {
        setLoading(false)
        setErroGeral(e2 instanceof AuthError ? e2.message : 'Não foi possível concluir o cadastro.')
      }
    }, 500)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <style>{`
        @keyframes loginUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
        .login-up { animation: loginUp .5s cubic-bezier(.22,1,.36,1) both }
      `}</style>

      {/* ----- Painel de marca (esquerda) ----- */}
      <aside className="relative hidden w-1/2 overflow-hidden bg-slate-950 lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950 via-brand-900 to-brand-800" />
        <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-brand-600/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        <div className="pointer-events-none absolute right-12 top-16 h-24 w-24 rounded-3xl border border-white/10 backdrop-blur-sm" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg shadow-black/20">
              <img src={Logo} alt="Controly" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">Controly</p>
              <p className="text-xs text-brand-100">Gestão Odontológica</p>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight drop-shadow-sm">
              Comece hoje,
              <br />
              <span className="bg-gradient-to-r from-brand-300 to-brand-100 bg-clip-text text-transparent">
                sem complicação.
              </span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-200">
              Crie sua conta e organize pacientes, agenda, odontograma e estoque
              em um só lugar — simples, rápido e do seu jeito.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                { icon: CalendarDays, t: 'Agenda inteligente', d: 'Consultas e lembretes automáticos' },
                { icon: Activity, t: 'Odontograma completo', d: 'Registro clínico visual por dente' },
                { icon: ShieldCheck, t: 'Dados locais', d: 'Tudo guardado com segurança no seu dispositivo' },
              ].map(({ icon: Icon, t, d }) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-200 ring-1 ring-white/10 backdrop-blur">
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{t}</span>
                    <span className="block text-xs text-slate-400">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Controly · Gestão Odontológica</p>
        </div>
      </aside>

      {/* ----- Formulário (direita) ----- */}
      <main className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2">
        <div className="login-up w-full max-w-md">
          {/* logo no mobile */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
              <img src={Logo} alt="Controly" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none text-slate-800">Controly</p>
              <p className="text-xs text-slate-400">Gestão Odontológica</p>
            </div>
          </div>

          {/* barra de progresso */}
          <div className="mb-6 flex items-center gap-2">
            {steps.map((label, i) => (
              <div key={label} className="flex flex-1 flex-col gap-1.5">
                <span
                  className={cn(
                    'h-1.5 rounded-full transition-colors',
                    i <= stepIndex ? 'bg-brand-600' : 'bg-slate-200',
                  )}
                />
                <span className={cn('text-[11px] font-medium', i <= stepIndex ? 'text-brand-700' : 'text-slate-400')}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* ====== Passo 1: escolha do tipo ====== */}
          {accountType === null && (
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Como você vai usar a plataforma?</h2>
              <p className="mt-1.5 text-sm text-slate-500">Isso define seu cadastro e os planos disponíveis.</p>

              <div className="mt-6 grid gap-3">
                {[
                  { t: 'dentist' as const, icon: Stethoscope, title: 'Sou Dentista', desc: 'Profissional autônomo, com atendimento individual.' },
                  { t: 'clinic' as const, icon: Building2, title: 'Sou Clínica Odontológica', desc: 'Clínica com uma equipe de dentistas.' },
                ].map(({ t, icon: Icon, title, desc }) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => escolherTipo(t)}
                    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-brand-300 hover:shadow-md hover:shadow-brand-600/5 cursor-pointer"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                      <Icon size={22} />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold text-slate-800">{title}</span>
                      <span className="block text-sm text-slate-500">{desc}</span>
                    </span>
                    <ArrowRight size={18} className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
                  </button>
                ))}
              </div>

              <p className="mt-6 text-center text-sm text-slate-500">
                Já tem uma conta?{' '}
                <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
                  Entrar
                </Link>
              </p>
            </div>
          )}

          {/* ====== Passo 2: dados ====== */}
          {accountType !== null && sub === 'dados' && (
            <form onSubmit={avancarDados} className="space-y-4">
              <div className="mb-2 flex items-center gap-2">
                <button type="button" onClick={voltar} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer" aria-label="Voltar">
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {accountType === 'dentist' ? 'Seus dados' : 'Dados da clínica'}
                </h2>
              </div>

              {accountType === 'dentist' ? (
                <>
                  <Labeled label="Nome completo" error={err('name')}>
                    <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex.: Ana Paula Souza" className={inputCls(!!err('name'))} autoFocus />
                  </Labeled>

                  <div className="grid grid-cols-2 gap-3">
                    <Labeled label="CPF" error={err('cpf')}>
                      <input value={form.cpf} onChange={(e) => set('cpf', maskCPF(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" className={inputCls(!!err('cpf'))} />
                    </Labeled>
                    <Labeled label="Telefone" error={err('phone')}>
                      <input value={form.phone} onChange={(e) => set('phone', maskPhone(e.target.value))} placeholder="(00) 00000-0000" inputMode="numeric" className={inputCls(!!err('phone'))} />
                    </Labeled>
                  </div>

                  <div className="grid grid-cols-[1fr_5rem] gap-3">
                    <Labeled label="CRO" error={err('cro')}>
                      <input value={form.cro} onChange={(e) => set('cro', maskCRO(e.target.value))} placeholder="00000" inputMode="numeric" className={inputCls(!!err('cro'))} />
                    </Labeled>
                    <Labeled label="UF" error={err('croState')}>
                      <select value={form.croState} onChange={(e) => set('croState', e.target.value)} className={inputCls(!!err('croState'), 'cursor-pointer')}>
                        <option value="">—</option>
                        {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                      </select>
                    </Labeled>
                  </div>

                  <Labeled label="Especialidade" error={err('specialty')}>
                    <input value={form.specialty} onChange={(e) => set('specialty', e.target.value)} placeholder="Ex.: Ortodontia, Clínico geral..." className={inputCls(!!err('specialty'))} />
                  </Labeled>

                  <Labeled label="Nome profissional" optional>
                    <input value={form.professionalName} onChange={(e) => set('professionalName', e.target.value)} placeholder="Como aparece para os pacientes" className={inputCls(false)} />
                  </Labeled>
                </>
              ) : (
                <>
                  <Labeled label="Nome da clínica" error={err('clinicName')}>
                    <input value={form.clinicName} onChange={(e) => set('clinicName', e.target.value)} placeholder="Ex.: Clínica OdontoBem" className={inputCls(!!err('clinicName'))} autoFocus />
                  </Labeled>

                  <div className="grid grid-cols-2 gap-3">
                    <Labeled label="CNPJ" error={err('cnpj')}>
                      <input value={form.cnpj} onChange={(e) => set('cnpj', maskCNPJ(e.target.value))} placeholder="00.000.000/0000-00" inputMode="numeric" className={inputCls(!!err('cnpj'))} />
                    </Labeled>
                    <Labeled label="Telefone" error={err('phone')}>
                      <input value={form.phone} onChange={(e) => set('phone', maskPhone(e.target.value))} placeholder="(00) 00000-0000" inputMode="numeric" className={inputCls(!!err('phone'))} />
                    </Labeled>
                  </div>

                  <Labeled label="Responsável" error={err('responsible')}>
                    <input value={form.responsible} onChange={(e) => set('responsible', e.target.value)} placeholder="Nome do responsável" className={inputCls(!!err('responsible'))} />
                  </Labeled>

                  <Labeled label="Endereço" error={err('address')}>
                    <input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Rua, número, bairro" className={inputCls(!!err('address'))} />
                  </Labeled>

                  <div className="grid grid-cols-[1fr_5rem] gap-3">
                    <Labeled label="Cidade" error={err('city')}>
                      <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Cidade" className={inputCls(!!err('city'))} />
                    </Labeled>
                    <Labeled label="UF" error={err('state')}>
                      <select value={form.state} onChange={(e) => set('state', e.target.value)} className={inputCls(!!err('state'), 'cursor-pointer')}>
                        <option value="">—</option>
                        {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                      </select>
                    </Labeled>
                  </div>
                </>
              )}

              {/* credenciais (comuns) */}
              <Labeled label="E-mail" error={err('email')}>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="voce@email.com" className={inputCls(!!err('email'))} />
              </Labeled>

              <div className="grid grid-cols-2 gap-3">
                <Labeled label="Senha" error={err('password')}>
                  <div className="relative">
                    <input type={showSenha ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" className={inputCls(!!err('password'), 'pr-10')} />
                    <button type="button" onClick={() => setShowSenha((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 cursor-pointer" aria-label={showSenha ? 'Ocultar' : 'Mostrar'}>
                      {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Labeled>
                <Labeled label="Confirmar senha" error={err('confirm')}>
                  <input type={showSenha ? 'text' : 'password'} value={form.confirm} onChange={(e) => set('confirm', e.target.value)} placeholder="••••••••" className={inputCls(!!err('confirm'))} />
                </Labeled>
              </div>

              <button
                type="submit"
                className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-700 active:scale-[0.99] cursor-pointer"
              >
                {accountType === 'clinic' ? 'Continuar' : 'Criar conta'}
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
          )}

          {/* ====== Passo 3 (clínica): equipe ====== */}
          {accountType === 'clinic' && sub === 'equipe' && (
            <div className="space-y-4">
              <div className="mb-2 flex items-center gap-2">
                <button type="button" onClick={voltar} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer" aria-label="Voltar">
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tamanho da equipe</h2>
              </div>
              <p className="text-sm text-slate-500">Quantos dentistas trabalham na clínica? Usamos isso para recomendar o plano ideal.</p>

              <div className="grid grid-cols-1 gap-2">
                {QUANTITIES.map((q) => {
                  const ativo = quantity === q.value
                  return (
                    <button
                      key={q.value}
                      type="button"
                      onClick={() => setQuantity(q.value)}
                      className={cn(
                        'flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all cursor-pointer',
                        ativo ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                      )}
                    >
                      {q.label}
                      {ativo && <Check size={18} className="text-brand-600" />}
                    </button>
                  )
                })}
              </div>

              {erroGeral && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erroGeral}</p>}

              <button
                type="button"
                disabled={loading}
                onClick={finalizar}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-700 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <>
                    Criar conta
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* erro geral no passo de dados do dentista */}
          {accountType === 'dentist' && sub === 'dados' && erroGeral && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erroGeral}</p>
          )}
          {loading && accountType === 'dentist' && (
            <p className="mt-3 text-center text-xs text-slate-400">Criando sua conta…</p>
          )}
        </div>
      </main>
    </div>
  )
}
