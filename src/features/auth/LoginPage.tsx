import { useEffect, useState } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CalendarDays,
  ShieldCheck,
  Activity,
} from 'lucide-react'
import { userService, AuthError } from '@/services/user'
import { Modal } from '@/components/ui/Modal'
import Logo from '../../assets/favicon.png'
import { cn } from '@/lib/cn'

const inputBase =
  'w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-11 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100'

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [lembrar, setLembrar] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [campoErro, setCampoErro] = useState<'email' | 'senha' | null>(null)
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  // limpa o erro assim que o usuário volta a digitar
  function limparErro() {
    if (erro) {
      setErro(null)
      setCampoErro(null)
    }
  }

  // logout involuntário (ex.: sessão expirada) deixa um motivo para exibir
  useEffect(() => {
    if (userService.takeAuthReason() === 'expired') {
      setErro('Sua sessão expirou. Entre novamente.')
    }
  }, [])

  if (userService.isAuthenticated()) {
    return <Navigate to="/" replace />
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isEmail(email)) return setErro('Informe um e-mail válido.')
    if (!senha) return setErro('Informe sua senha.')
    setErro(null)
    setCampoErro(null)
    setLoading(true)
    setTimeout(() => {
      try {
        userService.login(email, senha)
        // sem assinatura ativa? completa o fluxo antes do dashboard
        navigate(userService.hasActiveSubscription() ? '/' : '/planos', { replace: true })
      } catch (err) {
        const code = err instanceof AuthError ? err.code : null
        setCampoErro(code === 'EMAIL_NOT_FOUND' ? 'email' : code === 'INVALID_PASSWORD' ? 'senha' : null)
        setErro(err instanceof Error ? err.message : 'Não foi possível entrar.')
        setLoading(false)
      }
    }, 450)
  }

  function entrarComoVisitante() {
    setErro(null)
    setLoading(true)
    setTimeout(() => {
      userService.loginAsGuest()
      navigate('/', { replace: true })
    }, 450)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* animação de entrada */}
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
              Sua clínica,
              <br />
              <span className="bg-gradient-to-r from-brand-300 to-brand-100 bg-clip-text text-transparent">
                sob controle.
              </span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-200">
              Pacientes, agenda, odontograma e estoque em um só lugar — simples,
              rápido e do seu jeito.
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
        <div className="login-up w-full max-w-sm">
          {/* logo no mobile */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
              <img src={Logo} alt="Controly" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none text-slate-800">Controly</p>
              <p className="text-xs text-slate-400">Gestão Odontológica</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Bem-vindo de volta</h2>
            <p className="mt-1.5 text-sm text-slate-500">Entre com suas credenciais para acessar sua clínica</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                E-mail
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); limparErro() }}
                  placeholder="voce@email.com"
                  aria-invalid={campoErro === 'email'}
                  className={cn(inputBase, campoErro === 'email' && 'border-red-300 focus:border-red-400 focus:ring-red-100')}
                  autoFocus
                />
              </div>
              {campoErro === 'email' && <p className="mt-1.5 text-xs text-red-500">{erro}</p>}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Senha
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 cursor-pointer"
                  onClick={() => setForgotOpen(true)}
                >
                  Esqueceu?
                </button>
              </div>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); limparErro() }}
                  placeholder="••••••••"
                  aria-invalid={campoErro === 'senha'}
                  className={cn(inputBase, 'pr-11', campoErro === 'senha' && 'border-red-300 focus:border-red-400 focus:ring-red-100')}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-600 cursor-pointer"
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {campoErro === 'senha' && <p className="mt-1.5 text-xs text-red-500">{erro}</p>}
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={lembrar}
              onClick={() => setLembrar((v) => !v)}
              className="flex w-full select-none items-center gap-2.5 text-sm text-slate-600 cursor-pointer"
            >
              <span
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                  lembrar ? 'bg-brand-600' : 'bg-slate-300',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform',
                    lembrar ? 'translate-x-[22px]' : 'translate-x-0.5',
                  )}
                />
              </span>
              Manter conectado
            </button>

            {erro && !campoErro && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-700 hover:shadow-brand-700/30 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <>
                  Entrar
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">ou</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={entrarComoVisitante}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-70 cursor-pointer"
            >
              Entrar como visitante
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Ainda não tem conta?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Criar conta
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-slate-400">
            Protegido localmente · seus dados não saem deste dispositivo
          </p>
        </div>
      </main>

      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Recuperar acesso">
        <p className="text-sm text-slate-600">
          Como os dados desta clínica são armazenados localmente no seu dispositivo, não há senha a
          recuperar — basta entrar com o seu e-mail para acessar.
        </p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => setForgotOpen(false)}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 cursor-pointer"
          >
            Entendi
          </button>
        </div>
      </Modal>
    </div>
  )
}
