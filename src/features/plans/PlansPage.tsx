import { useMemo, useState } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import {
  Check,
  ArrowLeft,
  Stethoscope,
  Sparkles,
  Rocket,
  Users,
  Building2,
  ShieldCheck,
  Star,
  Clock,
  CreditCard,
  X,
  LogOut,
} from 'lucide-react'
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
    id: 'essencial',
    name: 'Essencial',
    icon: Stethoscope,
    audience: 'Para começar com o pé direito.',
    monthly: 89,
    capacity: 1,
    features: [
      'Agenda inteligente com lembretes',
      'Prontuário digital e odontograma',
      'Controle financeiro básico',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'profissional',
    name: 'Profissional',
    icon: Sparkles,
    audience: 'O equilíbrio perfeito entre preço e recursos.',
    monthly: 129,
    capacity: 1,
    features: [
      'Tudo do Essencial',
      'Automações via WhatsApp',
      'Assistente de IA',
      'Radiografias e evolução 3D do tratamento',
      'Relatórios completos',
      'Suporte prioritário',
    ],
  },
  {
    id: 'performance',
    name: 'Performance',
    icon: Rocket,
    audience: 'Para quem quer escalar a agenda.',
    monthly: 189,
    capacity: 1,
    features: [
      'Tudo do Profissional',
      'Caixa de mensagens unificada (WhatsApp, Instagram e Facebook)',
      'Relatórios avançados de crescimento',
      'Onboarding assistido',
      'Suporte via WhatsApp',
    ],
  },
]

const CLINIC_PLANS: Plan[] = [
  {
    id: 'clinic_start',
    name: 'Clínica Start',
    icon: Users,
    audience: 'Até 2 dentistas · para começar organizado.',
    monthly: 219,
    capacity: 2,
    features: ['Tudo do Profissional', 'Até 2 dentistas', 'Multiusuário', 'Caixa de mensagens unificada', 'Relatórios financeiros'],
  },
  {
    id: 'clinic_pro',
    name: 'Clínica Pro',
    icon: Sparkles,
    audience: 'Até 5 dentistas · ferramentas que proporcionam crescimento.',
    monthly: 349,
    capacity: 5,
    features: ['Tudo do Start', 'Até 5 dentistas', 'Automações via WhatsApp', 'Controle de estoque avançado', 'Suporte prioritário'],
  },
  {
    id: 'clinic_premium',
    name: 'Clínica Premium',
    icon: Building2,
    audience: 'Até 10 dentistas · para ir além da eficiência.',
    monthly: 599,
    capacity: 10,
    features: ['Tudo do Pro', 'Até 10 dentistas', 'Múltiplas unidades', 'Relatórios gerenciais', 'Onboarding assistido'],
  },
  {
    id: 'clinic_enterprise',
    name: 'Enterprise',
    icon: Building2,
    audience: 'Mais de 10 dentistas · operação sob medida.',
    monthly: null,
    capacity: Infinity,
    features: ['Tudo do Premium', 'Dentistas ilimitados', 'Integrações sob medida', 'Gerente de conta', 'SLA e suporte premium'],
  },
]

/** Mínimo de dentistas que o plano precisa comportar, por faixa escolhida. */
const NEED: Record<DentistQuantity, number> = { '1': 1, '2-5': 5, '6-10': 10, '11-20': 20, '20+': 21 }

/** Anual = 10 mensalidades (2 meses grátis) ⇒ 17% OFF sobre o preço mensal. */
const OFF_PCT = '17% OFF'

const RECOMMENDED: Record<string, string> = { dentist: 'profissional', clinic: 'clinic_pro' }

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Posso trocar de plano depois?',
    a: 'Sim. Você pode fazer upgrade ou downgrade a qualquer momento — a diferença é calculada proporcionalmente ao período restante.',
  },
  {
    q: 'Como funciona o desconto do plano anual?',
    a: 'No anual você paga o equivalente a 10 mensalidades e usa por 12 meses — 2 meses grátis, o que dá 17% de desconto sobre o preço mensal.',
  },
  {
    q: 'Meus dados e os dos pacientes estão seguros?',
    a: 'Sim. Dados sensíveis (CPF, contatos, prontuário) são criptografados com AES-256 no banco de dados, em conformidade com a LGPD.',
  },
  {
    q: 'Existe fidelidade ou multa de cancelamento?',
    a: 'Não. Você pode cancelar quando quiser, direto no painel, sem multa e sem precisar falar com ninguém.',
  },
]

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const fmt2 = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

export function PlansPage() {
  const navigate = useNavigate()
  const authed = userService.isAuthenticated()
  const acc = userService.currentAccount()

  const [ciclo, setCiclo] = useState<BillingCycle>('anual')
  const [checkout, setCheckout] = useState<Plan | null>(null)
  const [segmento, setSegmento] = useState<'dentista' | 'clinica'>('dentista')
  const anual = ciclo === 'anual'

  const perfil: 'dentist' | 'clinic' | 'public' = acc?.accountType ?? 'public'

  // planos exibidos conforme o perfil (e a quantidade de dentistas da clínica)
  const { planos, recommendedId } = useMemo(() => {
    if (perfil === 'dentist') return { planos: DENTIST_PLANS, recommendedId: RECOMMENDED.dentist }
    if (perfil === 'clinic') {
      const need = acc?.dentistQuantity ? NEED[acc.dentistQuantity] : 1
      const fits = CLINIC_PLANS.filter((p) => p.capacity >= need)
      const list = fits.length ? fits : [CLINIC_PLANS[CLINIC_PLANS.length - 1]]
      const rec = list.some((p) => p.id === RECOMMENDED.clinic) ? RECOMMENDED.clinic : list[0].id
      return { planos: list, recommendedId: rec }
    }
    // público: segmentado por audiência
    return segmento === 'dentista'
      ? { planos: DENTIST_PLANS, recommendedId: RECOMMENDED.dentist }
      : { planos: CLINIC_PLANS, recommendedId: RECOMMENDED.clinic }
  }, [perfil, acc, segmento])

  // assinante ativo pode (e deve) entrar aqui — é a página de upgrade.
  // Visitante demo não tem o que assinar; volta para o painel.
  const assinante = authed && userService.hasActiveSubscription()
  const planoAtualId = assinante ? userService.currentPlanId() : undefined
  if (authed && userService.isGuest()) {
    return <Navigate to="/" replace />
  }

  const mesEquivalente = (m: number) => (anual ? Math.round((m * 10) / 12) : m)
  const totalAnual = (m: number) => m * 10
  const economiaAnual = (m: number) => m * 2

  function sair() {
    userService.logout()
    navigate('/login', { replace: true })
  }

  const titulo = assinante
    ? 'Faça upgrade e desbloqueie mais recursos'
    : authed
      ? 'Assine agora e destrave o painel da sua clínica'
      : 'Menos papelada. Mais pacientes na cadeira.'

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {authed ? (
        <>
          {assinante && (
            <Link
              to="/"
              aria-label="Voltar ao painel"
              className="absolute left-6 top-6 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
            >
              <ArrowLeft size={20} />
            </Link>
          )}
          <button
            onClick={sair}
            className="absolute right-6 top-6 z-20 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-700 cursor-pointer"
          >
            <LogOut size={16} /> Sair
          </button>
        </>
      ) : (
        <Link
          to="/login"
          aria-label="Voltar"
          className="absolute left-6 top-6 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
        >
          <ArrowLeft size={20} />
        </Link>
      )}

      {/* ----- cabeçalho (fundo cinza) ----- */}
      <header className="mx-auto max-w-3xl px-6 pt-16 text-center">
        <h1 className="text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          {titulo}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-slate-500">
          {assinante
            ? 'O upgrade é imediato e você não perde nenhum dado — seus pacientes, agenda e financeiro continuam exatamente onde estão.'
            : authed
              ? 'Seu cadastro foi criado. Escolha seu plano e garanta acesso contínuo às ferramentas que simplificam sua rotina.'
              : 'Agenda, prontuário, estoque e finanças em um lugar só. Escolha seu plano e comece hoje.'}
        </p>

        {/* prova social */}
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          <div className="flex -space-x-2" aria-hidden="true">
            {['AM', 'RC', 'JP', 'LF'].map((ini, i) => (
              <span
                key={ini}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-slate-100',
                  ['bg-brand-600', 'bg-sky-500', 'bg-indigo-500', 'bg-teal-500'][i],
                )}
              >
                {ini}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <span className="flex text-amber-400" aria-label="4,9 de 5 estrelas">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
              ))}
            </span>
            <span>
              <strong className="font-semibold text-slate-800">4,9/5</strong> · usado por centenas de dentistas no Brasil
            </span>
          </div>
        </div>
      </header>

      {/* ----- segmento (só no público) ----- */}
      {perfil === 'public' && (
        <div className="mx-auto mt-10 flex justify-center px-6">
          <div className="inline-flex items-center rounded-xl bg-white p-1 text-sm font-semibold shadow-sm ring-1 ring-slate-200">
            {(
              [
                ['dentista', 'Para você, dentista'],
                ['clinica', 'Para sua clínica'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setSegmento(id)}
                className={cn(
                  'rounded-lg px-5 py-2 transition-colors cursor-pointer',
                  segmento === id ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ----- toggle anual/mensal (centralizado; anotação em absolute não desloca) ----- */}
      <div className={cn('relative mx-auto flex max-w-6xl items-center justify-center px-6', perfil === 'public' ? 'mt-8' : 'mt-12')}>
        <div className="relative">
          {/* anotação manuscrita apontando para o "Anual" */}
          <div
            className="pointer-events-none absolute -left-44 -top-10 hidden select-none flex-col items-end sm:flex"
            aria-hidden="true"
          >
            <span className="font-script -rotate-6 whitespace-nowrap text-2xl font-semibold leading-none text-slate-700">
              assine com desconto!
            </span>
            <svg
              width="40" height="34" viewBox="0 0 40 34" fill="none"
              className="-mr-9 mt-0.5 text-brand-600"
            >
              <path
                d="M4 3c12 2 21 10 24 24m0 0l-7-5m7 5l7-5"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            role="tablist"
            aria-label="Ciclo de cobrança"
            className="inline-flex items-center rounded-xl bg-white p-1.5 text-sm font-medium shadow-sm ring-1 ring-slate-200"
          >
            <button
              role="tab"
              aria-selected={anual}
              onClick={() => setCiclo('anual')}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-5 py-2 transition-colors cursor-pointer',
                anual ? 'bg-slate-50 text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              Anual
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-600 ring-1 ring-brand-200">
                {OFF_PCT}
              </span>
            </button>
            <button
              role="tab"
              aria-selected={!anual}
              onClick={() => setCiclo('mensal')}
              className={cn(
                'rounded-lg px-6 py-2 transition-colors cursor-pointer',
                !anual ? 'bg-slate-50 text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              Mensal
            </button>
          </div>
        </div>
      </div>

      {/* ----- seção branca arredondada com os cards ----- */}
      <main className="mt-14 rounded-t-[2.5rem] bg-white pb-16 pt-16">
        <div className="mx-auto flex max-w-6xl flex-wrap items-stretch justify-center gap-5 px-6 lg:flex-nowrap lg:items-center">
          {planos.map((p) => {
            const Icon = p.icon
            const destaque = planos.length > 1 && p.id === recommendedId
            const sobConsulta = p.monthly === null
            return (
              <div
                key={p.id}
                className={cn(
                  'relative flex w-full flex-col rounded-2xl p-6 transition-all duration-200 sm:w-80',
                  destaque
                    ? 'z-10 bg-gradient-to-b from-brand-600 to-brand-800 text-white shadow-2xl shadow-brand-600/30 lg:scale-[1.04]'
                    : 'border border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg',
                )}
              >
                {destaque && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900 px-4 py-1 text-[11px] font-bold tracking-widest text-white shadow-md">
                    ★ O MAIS ESCOLHIDO
                  </span>
                )}

                {/* ícone + nome + chip OFF */}
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                      destaque ? 'bg-white/15 text-white' : 'bg-brand-50 text-brand-600',
                    )}
                  >
                    <Icon size={24} strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={cn('text-lg font-bold', destaque ? 'text-white' : 'text-slate-900')}>{p.name}</h2>
                      {anual && !sobConsulta && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-bold',
                            destaque ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600 ring-1 ring-brand-200',
                          )}
                        >
                          {OFF_PCT}
                        </span>
                      )}
                    </div>
                    <p className={cn('mt-0.5 text-xs leading-snug', destaque ? 'text-brand-100' : 'text-slate-500')}>
                      {p.audience}
                    </p>
                  </div>
                </div>

                {/* preço */}
                <div className="mt-6 min-h-[6.5rem]">
                  {sobConsulta ? (
                    <>
                      <p className={cn('text-3xl font-extrabold', destaque ? 'text-white' : 'text-slate-900')}>Sob consulta</p>
                      <p className={cn('mt-2 text-xs', destaque ? 'text-brand-100' : 'text-slate-400')}>
                        Proposta sob medida para a sua operação.
                      </p>
                    </>
                  ) : (
                    <>
                      {anual && (
                        <p className={cn('text-sm', destaque ? 'text-brand-100' : 'text-slate-500')}>
                          De <s className={destaque ? 'text-white/60' : 'text-slate-400'}>{fmt2(p.monthly!)}</s> por
                        </p>
                      )}
                      <div className="flex items-baseline gap-1.5">
                        <span className={cn('text-4xl font-extrabold tracking-tight tabular-nums', destaque ? 'text-white' : 'text-slate-900')}>
                          {fmt(mesEquivalente(p.monthly!))}
                        </span>
                        <span className={cn('text-sm font-medium', destaque ? 'text-brand-100' : 'text-slate-400')}>/mês</span>
                      </div>
                      <p className={cn('mt-2 text-xs leading-relaxed', destaque ? 'text-brand-100' : 'text-slate-500')}>
                        {anual ? (
                          <>
                            Total de {fmt2(totalAnual(p.monthly!))} em até 12x sem juros ·{' '}
                            <strong className={destaque ? 'text-white' : 'text-brand-600'}>
                              economize {fmt(economiaAnual(p.monthly!))}
                            </strong>
                          </>
                        ) : (
                          <>Cobrado mensalmente. Cancele quando quiser.</>
                        )}
                      </p>
                    </>
                  )}
                </div>

                {/* CTA + reversão de risco */}
                {!authed ? (
                  <Link
                    to="/register"
                    className={cn(
                      'mt-5 flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors',
                      destaque
                        ? 'bg-white text-brand-700 shadow-sm hover:bg-brand-50'
                        : 'bg-brand-600 text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700',
                    )}
                  >
                    {destaque ? 'Começar agora' : 'Escolher plano'}
                  </Link>
                ) : p.id === planoAtualId ? (
                  <button
                    disabled
                    className={cn(
                      'mt-5 flex h-11 w-full items-center justify-center gap-1.5 rounded-lg text-sm font-semibold',
                      destaque
                        ? 'bg-white/20 text-white ring-1 ring-white/40'
                        : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
                    )}
                  >
                    <Check size={15} /> Seu plano atual
                  </button>
                ) : sobConsulta ? (
                  <a
                    href="mailto:contato@controly.app?subject=Plano%20Enterprise%20Controly"
                    className="mt-5 flex h-11 w-full items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                  >
                    Falar com a equipe
                  </a>
                ) : (
                  <button
                    onClick={() => setCheckout(p)}
                    className={cn(
                      'mt-5 flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors cursor-pointer',
                      destaque
                        ? 'bg-white text-brand-700 shadow-sm hover:bg-brand-50'
                        : 'bg-brand-600 text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700',
                    )}
                  >
                    {assinante ? 'Fazer upgrade' : destaque ? 'Começar agora' : 'Escolher plano'}
                  </button>
                )}
                {!sobConsulta && (
                  <p className={cn('mt-2 text-center text-[11px]', destaque ? 'text-brand-100' : 'text-slate-400')}>
                    7 dias de garantia · sem fidelidade
                  </p>
                )}

                {/* features */}
                <ul className={cn('mt-5 space-y-2.5 border-t pt-5', destaque ? 'border-white/15' : 'border-slate-100')}>
                  {p.features.map((r) => (
                    <li
                      key={r}
                      className={cn('flex items-start gap-2.5 text-[13px]', destaque ? 'text-brand-50' : 'text-slate-600')}
                    >
                      <Check
                        size={15}
                        strokeWidth={2.5}
                        className={cn('mt-0.5 shrink-0', destaque ? 'text-white' : 'text-brand-600')}
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* ----- selos de confiança ----- */}
        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-4 px-6 sm:grid-cols-3">
          {(
            [
              [ShieldCheck, 'Dados criptografados', 'CPF, contatos e prontuários protegidos com AES-256, em conformidade com a LGPD.'],
              [Clock, 'Pronto em 5 minutos', 'Sem instalação e sem treinamento demorado: crie a conta e comece a agendar.'],
              [CreditCard, 'Pagamento seguro', 'Cancele quando quiser, direto no painel. Sem fidelidade e sem multa.'],
            ] as const
          ).map(([Icon, t, d]) => (
            <div key={t} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                <Icon size={19} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{t}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{d}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ----- FAQ ----- */}
        <div className="mx-auto mt-16 max-w-2xl px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">Perguntas frequentes</h2>
          <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="text-slate-400 transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{a}</p>
              </details>
            ))}
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-slate-400">
          Valores em reais (BRL). Plano anual equivale a 10 mensalidades (2 meses grátis).
        </p>
      </main>

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
                  <p className="text-xs text-slate-500">{anual ? 'Anual (2 meses grátis)' : 'Mensal'}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{fmt(total)}</p>
                  <p className="text-xs text-slate-400">{anual ? 'por ano · em até 12x sem juros' : 'por mês'}</p>
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
