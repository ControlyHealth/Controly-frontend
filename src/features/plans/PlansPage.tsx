import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ArrowLeft, Sparkles, User, Users, Building2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Ciclo = 'mensal' | 'anual'

interface Plano {
  id: string
  nome: string
  icon: typeof User
  descricao: string
  precoMensal: number | null // null = sob consulta
  destaque?: boolean
  recursos: string[]
  cta: string
  ctaHref?: string
}

const PLANOS: Plano[] = [
  {
    id: 'individual',
    nome: 'Individual',
    icon: User,
    descricao: 'Para o dentista autônomo, com um único profissional.',
    precoMensal: 129,
    recursos: [
      '1 dentista',
      'Pacientes ilimitados',
      'Agenda e odontograma completos',
      'Estoque e financeiro',
      'Radiografias e laudos',
      'Suporte por e-mail',
    ],
    cta: 'Começar agora',
  },
  {
    id: 'equipe',
    nome: 'Equipe',
    icon: Users,
    descricao: 'Para clínicas pequenas com mais de um profissional.',
    precoMensal: 249,
    destaque: true,
    recursos: [
      'Tudo do plano Individual',
      'Até 5 profissionais',
      'Automações via WhatsApp',
      'Relatórios financeiros',
      'Contas a receber e orçamentos',
      'Suporte prioritário',
    ],
    cta: 'Começar agora',
  },
  {
    id: 'personalizado',
    nome: 'Personalizado',
    icon: Building2,
    descricao: 'Para clínicas maiores, redes e necessidades específicas.',
    precoMensal: null,
    recursos: [
      'Profissionais ilimitados',
      'Múltiplas unidades',
      'Onboarding dedicado',
      'Integrações sob medida',
      'Gerente de conta',
      'SLA e suporte premium',
    ],
    cta: 'Falar com a equipe',
    ctaHref: 'mailto:contato@controly.app?subject=Plano%20Personalizado%20Controly',
  },
]

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export function PlansPage() {
  const [ciclo, setCiclo] = useState<Ciclo>('mensal')

  // anual: paga 10 meses (2 grátis), exibido como valor/mês equivalente
  const precoExibido = (mensal: number) =>
    ciclo === 'anual' ? Math.round((mensal * 10) / 12) : mensal

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link
          to="/login"
          className="mb-8 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} /> Voltar ao login
        </Link>

        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <Sparkles size={13} /> Planos Controly
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Escolha o plano da sua clínica
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
            Comece pequeno e cresça quando precisar. Sem fidelidade — cancele quando quiser.
          </p>
        </div>

        {/* toggle de ciclo */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setCiclo('mensal')}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition cursor-pointer',
              ciclo === 'mensal' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100',
            )}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setCiclo('anual')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition cursor-pointer',
              ciclo === 'anual' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100',
            )}
          >
            Anual
            <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold', ciclo === 'anual' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700')}>
              2 meses grátis
            </span>
          </button>
        </div>

        {/* cards */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANOS.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border bg-white p-6 transition',
                  p.destaque
                    ? 'border-brand-300 shadow-xl shadow-brand-600/10 md:-translate-y-2'
                    : 'border-slate-200 shadow-sm',
                )}
              >
                {p.destaque && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow">
                    Mais popular
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', p.destaque ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600')}>
                    <Icon size={20} />
                  </span>
                  <h3 className="text-lg font-bold text-slate-800">{p.nome}</h3>
                </div>

                <p className="mt-3 min-h-10 text-sm text-slate-500">{p.descricao}</p>

                <div className="mt-4 min-h-16">
                  {p.precoMensal === null ? (
                    <p className="text-2xl font-bold text-slate-800">Sob consulta</p>
                  ) : (
                    <>
                      <p className="flex items-end gap-1">
                        <span className="text-3xl font-extrabold text-slate-900">{fmt(precoExibido(p.precoMensal))}</span>
                        <span className="mb-1 text-sm text-slate-400">/mês</span>
                      </p>
                      {ciclo === 'anual' && (
                        <p className="text-xs text-emerald-600">cobrado anualmente · 2 meses grátis</p>
                      )}
                    </>
                  )}
                </div>

                {p.ctaHref ? (
                  <a
                    href={p.ctaHref}
                    className={cn(
                      'flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition-colors',
                      'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    {p.cta}
                  </a>
                ) : (
                  <Link
                    to="/login"
                    className={cn(
                      'flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition-colors',
                      p.destaque
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700'
                        : 'border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100',
                    )}
                  >
                    {p.cta}
                  </Link>
                )}

                <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-5">
                  {p.recursos.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check size={16} className={cn('mt-0.5 shrink-0', p.destaque ? 'text-brand-600' : 'text-emerald-500')} />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          Valores em reais (BRL). Precisa de algo diferente?{' '}
          <a href="mailto:contato@controly.app" className="font-medium text-brand-600 hover:text-brand-700">
            Fale com a nossa equipe
          </a>
          .
        </p>
      </div>
    </div>
  )
}
