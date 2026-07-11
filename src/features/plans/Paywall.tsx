/**
 * Paywall — o que aparece quando o plano do usuário não inclui um recurso.
 *
 * Estratégia de conversão: o recurso nunca é escondido. Ele aparece na
 * navegação com cadeado e, ao abrir, esta tela explica o valor e leva
 * direto para o upgrade em /planos.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Sparkles, ArrowRight } from 'lucide-react'
import { userService } from '@/services/user'
import { FEATURE_LABEL, FEATURE_MIN_PLAN, type Feature } from '@/lib/entitlements'

/** Envolve uma rota/tela: renderiza os filhos ou o paywall de página inteira. */
export function RequireFeature({ feature, children }: { feature: Feature; children: ReactNode }) {
  if (userService.hasFeature(feature)) return <>{children}</>
  return <PaywallPage feature={feature} />
}

/** Paywall de página inteira (rotas bloqueadas: Mensagens, Automações...). */
export function PaywallPage({ feature }: { feature: Feature }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/25">
          <Lock size={28} />
        </span>
        <h2 className="mt-5 text-xl font-bold text-slate-900">{FEATURE_LABEL[feature]}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Este recurso está disponível a partir do plano{' '}
          <strong className="text-slate-700">{FEATURE_MIN_PLAN[feature]}</strong>. Faça o upgrade e
          desbloqueie agora — sem perder nenhum dado.
        </p>
        <Link
          to="/planos"
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700"
        >
          <Sparkles size={16} /> Fazer upgrade
        </Link>
        <p className="mt-3 text-[11px] text-slate-400">Upgrade imediato · sem fidelidade · cancele quando quiser</p>
      </div>
    </div>
  )
}

/** Paywall compacto para abas/seções dentro de uma página. */
export function PaywallInline({ feature }: { feature: Feature }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
        <Lock size={22} />
      </span>
      <p className="mt-4 font-semibold text-slate-800">{FEATURE_LABEL[feature]}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Disponível a partir do plano <strong>{FEATURE_MIN_PLAN[feature]}</strong>.
      </p>
      <Link
        to="/planos"
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Fazer upgrade <ArrowRight size={14} />
      </Link>
    </div>
  )
}
