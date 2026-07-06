import { useMemo, useState } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { Check, ArrowLeft, Stethoscope, Users, Building2, ShieldCheck, X, LogOut } from 'lucide-react'
import { cn } from '@/lib/cn'
import { userService, type BillingCycle, type DentistQuantity } from '@/services/user'

interface Plan {
  id: string
  name: string
  icon: typeof Stethoscope
  audience: string
  monthly: number | null // null = sob consulta
  capacity: number // nº máx. de dentistas (para filtrar por perfil de clínica)
  features: string[]
}

const DENTIST_PLANS: Plan[] = [
  {
    id: 'individual',
    name: 'Individual',
    icon: Stethoscope,
    audience: 'Dentista autônomo',
    monthly: 129,
    capacity: 1,
    features: ['Agenda e lembretes', 'Prontuário e odontograma', 'Financeiro', 'Relatórios', 'Assistente de IA', 'Suporte por e-mail'],
  },
]

const CLINIC_PLANS: Plan[] = [
  {
    id: 'clinic_start',
    name: 'Clínica Start',
    icon: Users,
    audience: 'Até 2 dentistas',
    monthly: 219,
    capacity: 2,
    features: ['Tudo do Individual', 'Até 2 dentistas', 'Multiusuário', 'Caixa de mensagens', 'Relatórios financeiros'],
  },
  {
    id: 'clinic_pro',
    name: 'Clínica Pro',
    icon: Users,
    audience: 'Até 5 dentistas',
    monthly: 349,
    capacity: 5,
    features: ['Tudo do Start', 'Até 5 dentistas', 'Automações via WhatsApp', 'Controle de estoque avançado', 'Suporte prioritário'],
  },
  {
    id: 'clinic_premium',
    name: 'Clínica Premium',
    icon: Building2,
    audience: 'Até 10 dentistas',
    monthly: 599,
    capacity: 10,
    features: ['Tudo do Pro', 'Até 10 dentistas', 'Múltiplas unidades', 'Relatórios gerenciais', 'Onboarding assistido'],
  },
  {
    id: 'clinic_enterprise',
    name: 'Enterprise',
    icon: Building2,
    audience: 'Mais de 10 dentistas',
    monthly: null,
    capacity: Infinity,
    features: ['Tudo do Premium', 'Dentistas ilimitados', 'Integrações sob medida', 'Gerente de conta', 'SLA e suporte premium'],
  },
]

/** Mínimo de dentistas que o plano precisa comportar, por faixa escolhida. */
const NEED: Record<DentistQuantity, number> = { '1': 1, '2-5': 5, '6-10': 10, '11-20': 20, '20+': 21 }

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export function PlansPage() {
  const navigate = useNavigate()
  const authed = userService.isAuthenticated()
  const acc = userService.currentAccount()

  const [ciclo, setCiclo] = useState<BillingCycle>('anual')
  const [checkout, setCheckout] = useState<Plan | null>(null)
  const anual = ciclo === 'anual'

  const perfil: 'dentist' | 'clinic' | 'public' = acc?.accountType ?? 'public'

  // planos exibidos conforme o perfil (e a quantidade de dentistas da clínica)
  const { planos, recommendedId } = useMemo(() => {
    if (perfil === 'dentist') return { planos: DENTIST_PLANS, recommendedId: 'individual' }
    if (perfil === 'clinic') {
      const need = acc?.dentistQuantity ? NEED[acc.dentistQuantity] : 1
      const fits = CLINIC_PLANS.filter((p) => p.capacity >= need)
      const list = fits.length ? fits : [CLINIC_PLANS[CLINIC_PLANS.length - 1]]
      return { planos: list, recommendedId: list[0].id }
    }
    return { planos: [...DENTIST_PLANS, ...CLINIC_PLANS], recommendedId: 'clinic_pro' }
  }, [perfil, acc])

  // já tem assinatura ativa → não faz sentido ficar aqui
  if (authed && userService.hasActiveSubscription()) {
    return <Navigate to="/" replace />
  }

  const mesEquivalente = (m: number) => (anual ? Math.round((m * 10) / 12) : m)
  const totalAnual = (m: number) => m * 10
  const economia = (m: number) => m * 2 // 2 meses grátis no anual

  function sair() {
    userService.logout()
    navigate('/login', { replace: true })
  }

  const titulo =
    perfil === 'clinic'
      ? 'Escolha o plano da sua clínica'
      : perfil === 'dentist'
        ? 'Ative seu plano e comece a usar'
        : 'Planos que crescem com você'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {authed ? (
        <button
          onClick={sair}
          className="absolute right-6 top-6 z-20 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
        >
          <LogOut size={16} /> Sair
        </button>
      ) : (
        <Link
          to="/login"
          aria-label="Voltar"
          className="absolute left-6 top-6 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft size={20} />
        </Link>
      )}

      <div className="mx-auto flex max-w-6xl flex-col px-6 py-14">
        <h1 className="text-balance text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {titulo}
        </h1>
        {authed && (
          <p className="mt-2 text-center text-sm text-slate-500">
            Seu cadastro foi criado. Falta só ativar um plano para liberar o painel.
          </p>
        )}

        {/* toggle mensal / anual (global) */}
        <div className="mt-8 flex items-center justify-center">
          <div role="tablist" aria-label="Ciclo de cobrança" className="inline-flex items-center rounded-full bg-white p-1 text-sm font-medium shadow-sm ring-1 ring-slate-200">
            <button
              role="tab"
              aria-selected={!anual}
              onClick={() => setCiclo('mensal')}
              className={cn('rounded-full px-4 py-1.5 transition-colors cursor-pointer', !anual ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700')}
            >
              Mensal
            </button>
            <button
              role="tab"
              aria-selected={anual}
              onClick={() => setCiclo('anual')}
              className={cn('inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-colors cursor-pointer', anual ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700')}
            >
              Anual
              <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', anual ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600')}>2 meses grátis</span>
            </button>
          </div>
        </div>

        {/* cards */}
        <div className="mt-10 flex flex-wrap items-stretch justify-center gap-5">
          {planos.map((p) => {
            const Icon = p.icon
            const destaque = p.id === recommendedId
            const sobConsulta = p.monthly === null
            return (
              <div
                key={p.id}
                className={cn(
                  'relative flex w-full flex-col rounded-2xl border bg-white p-6 transition-colors sm:w-80',
                  destaque ? 'border-brand-300 shadow-md shadow-brand-600/10 ring-1 ring-brand-200/60' : 'border-slate-200 shadow-sm hover:border-slate-300',
                )}
              >
                {destaque && (
                  <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                    Recomendado
                  </span>
                )}

                <Icon size={28} strokeWidth={1.5} className="text-brand-600" />
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{p.name}</h2>
                <p className="mt-0.5 text-sm text-slate-500">{p.audience}</p>

                <div className="mt-5 min-h-[4.5rem]">
                  {sobConsulta ? (
                    <>
                      <p className="text-3xl font-semibold text-slate-900">Sob consulta</p>
                      <p className="mt-1 text-xs text-slate-400">Proposta sob medida para a sua operação.</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-semibold tracking-tight tabular-nums text-slate-900">{fmt(mesEquivalente(p.monthly!))}</span>
                        <span className="text-sm text-slate-400">/mês</span>
                      </div>
                      {anual ? (
                        <p className="mt-1 text-xs text-slate-500">
                          <span className="text-slate-300 line-through">{fmt(p.monthly!)}/mês</span> · {fmt(totalAnual(p.monthly!))}/ano ·{' '}
                          <span className="font-medium text-brand-600">economize {fmt(economia(p.monthly!))}</span>
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-slate-400">cobrado mensalmente</p>
                      )}
                    </>
                  )}
                </div>

                {!authed ? (
                  <Link
                    to="/register"
                    className={cn(
                      'mt-6 flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors',
                      destaque ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700' : 'border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    Criar conta
                  </Link>
                ) : sobConsulta ? (
                  <a
                    href="mailto:contato@controly.app?subject=Plano%20Enterprise%20Controly"
                    className="mt-6 flex h-11 w-full items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                  >
                    Falar com a equipe
                  </a>
                ) : (
                  <button
                    onClick={() => setCheckout(p)}
                    className={cn(
                      'mt-6 flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors cursor-pointer',
                      destaque ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700' : 'border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    Assinar {p.name}
                  </button>
                )}

                <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-6">
                  {p.features.map((r) => (
                    <li key={r} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                      <Check size={15} strokeWidth={2.5} className="mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          Valores em reais (BRL). Sem fidelidade — cancele quando quiser.
        </p>
      </div>

      {checkout && (
        <CheckoutModal
          plan={checkout}
          ciclo={ciclo}
          onClose={() => setCheckout(null)}
          onDone={() => navigate('/', { replace: true })}
        />
      )}
    </div>
  )
}

// ------------------------------------------------------ checkout (mock)

function CheckoutModal({
  plan,
  ciclo,
  onClose,
  onDone,
}: {
  plan: Plan
  ciclo: BillingCycle
  onClose: () => void
  onDone: () => void
}) {
  const [stage, setStage] = useState<'pay' | 'processing' | 'done'>('pay')
  const anual = ciclo === 'anual'
  const total = plan.monthly === null ? 0 : anual ? plan.monthly * 10 : plan.monthly

  function pagar() {
    setStage('processing')
    // pagamento simulado — no fluxo real isto chama o provider (Mercado Pago / Stripe...)
    setTimeout(() => {
      userService.subscribe({ planId: plan.id, planName: plan.name, cycle: ciclo })
      setStage('done')
      setTimeout(onDone, 1100)
    }, 1400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {stage === 'done' ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check size={28} />
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Assinatura confirmada!</h3>
            <p className="mt-1 text-sm text-slate-500">Plano {plan.name} · {anual ? 'anual' : 'mensal'}. Abrindo seu painel…</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-800">Finalizar assinatura</h3>
              <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer" aria-label="Fechar" disabled={stage === 'processing'}>
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-800">{plan.name}</p>
                  <p className="text-xs text-slate-500">{plan.audience} · {anual ? 'Anual (2 meses grátis)' : 'Mensal'}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{fmt(total)}</p>
                  <p className="text-xs text-slate-400">{anual ? 'por ano' : 'por mês'}</p>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2.5 text-xs text-brand-700">
                <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                Ambiente de demonstração — nenhum pagamento real é processado. A integração com o provedor (Mercado Pago / Stripe) entra numa próxima fase.
              </div>

              <button
                onClick={pagar}
                disabled={stage === 'processing'}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-700 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
              >
                {stage === 'processing' ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <>Confirmar pagamento · {fmt(total)}</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
