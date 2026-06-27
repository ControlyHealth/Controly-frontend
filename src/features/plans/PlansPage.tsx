import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ArrowLeft, User, Users, Building2 } from 'lucide-react'
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
      'Caixa de mensagens unificada',
      'Relatórios financeiros',
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

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export function PlansPage() {
  const [ciclo, setCiclo] = useState<Ciclo>('anual')
  const anual = ciclo === 'anual'

  // anual: paga 10 meses (2 grátis), exibido como valor/mês equivalente
  const precoMesEquivalente = (mensal: number) =>
    anual ? Math.round((mensal * 10) / 12) : mensal
  const totalAnual = (mensal: number) => mensal * 10
  const economiaAnual = (mensal: number) => mensal * 12 - mensal * 10

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900">
      <Link
        to="/login"
        aria-label="Voltar"
        className="absolute left-6 top-6 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        <ArrowLeft size={20} />
      </Link>

      <div className="mx-auto flex h-full max-w-6xl flex-col justify-center px-6 py-8">
        {/* título */}
        <h1 className="text-balance text-center font-serif text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl">
          Planos que crescem com a sua clínica
        </h1>

        {/* cards */}
        <div className="mt-10 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
          {PLANOS.map((p) => {
            const Icon = p.icon
            const destaque = !!p.destaque
            return (
              <div
                key={p.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border bg-white p-6 transition-colors',
                  destaque
                    ? 'border-brand-300 shadow-md shadow-brand-600/10 ring-1 ring-brand-200/60'
                    : 'border-slate-200 shadow-sm hover:border-slate-300',
                )}
              >
                {/* topo: ícone + seletor de ciclo (apenas no card em destaque) */}
                <div className="flex items-start justify-between">
                  <Icon size={30} strokeWidth={1.5} className="text-brand-600" />
                  {destaque && (
                    <div
                      role="tablist"
                      aria-label="Ciclo de cobrança"
                      className="inline-flex items-center rounded-full bg-slate-100 p-0.5 text-[11px] font-medium ring-1 ring-slate-200"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={!anual}
                        onClick={() => setCiclo('mensal')}
                        className={cn(
                          'rounded-full px-2.5 py-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                          anual ? 'text-slate-500 hover:text-slate-700' : 'bg-white text-slate-900 shadow-sm',
                        )}
                      >
                        Mensal
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={anual}
                        onClick={() => setCiclo('anual')}
                        className={cn(
                          'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                          anual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                        )}
                      >
                        Anual <span className="text-brand-600">· Economize 17%</span>
                      </button>
                    </div>
                  )}
                </div>

                <h2 className="mt-5 text-xl font-semibold text-slate-900">{p.nome}</h2>
                <p className="mt-1 text-sm text-slate-500">{p.descricao}</p>

                {/* preço */}
                <div className="mt-5 min-h-[4.5rem]">
                  {p.precoMensal === null ? (
                    <>
                      <p className="text-3xl font-semibold text-slate-900">Sob consulta</p>
                      <p className="mt-1 text-xs text-slate-400">Proposta sob medida para a sua operação.</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-semibold tracking-tight tabular-nums text-slate-900">
                          {fmt(precoMesEquivalente(p.precoMensal))}
                        </span>
                        <span className="text-sm text-slate-400">
                          {anual ? 'BRL / mês · cobrado anualmente' : 'BRL / mês'}
                        </span>
                      </div>
                      {anual && (
                        <p className="mt-1 text-xs text-slate-500">
                          <span className="text-slate-300 line-through">{fmt(p.precoMensal)}/mês</span> ·{' '}
                          {fmt(totalAnual(p.precoMensal))} por ano ·{' '}
                          <span className="font-medium text-brand-600">economize {fmt(economiaAnual(p.precoMensal))}</span>
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* CTA */}
                {p.ctaHref ? (
                  <a
                    href={p.ctaHref}
                    className={cn(
                      'mt-6 flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                      destaque
                        ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700 focus-visible:ring-brand-500'
                        : 'border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-brand-500',
                    )}
                  >
                    {p.cta}
                  </a>
                ) : (
                  <Link
                    to="/login"
                    className={cn(
                      'mt-6 flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                      destaque
                        ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700 focus-visible:ring-brand-500'
                        : 'border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-brand-500',
                    )}
                  >
                    {p.cta}
                  </Link>
                )}

                {/* recursos */}
                <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-6">
                  {p.recursos.map((r) => (
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

        {/* rodapé */}
        <p className="mt-9 text-center text-xs text-slate-400">
          Valores em reais (BRL). Sem fidelidade — cancele quando quiser. Precisa de algo diferente?{' '}
          <a
            href="mailto:contato@controly.app"
            className="font-medium text-brand-600 underline-offset-2 hover:text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded"
          >
            Fale com a nossa equipe
          </a>
          .
        </p>
      </div>
    </div>
  )
}
