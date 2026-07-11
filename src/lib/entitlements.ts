/**
 * Entitlements — fonte única de verdade do que cada plano libera.
 *
 * As flags aqui são as MESMAS que o backend grava no jsonb `plans.features`
 * (controly/api/entitlements.py). Se a página de vendas promete algo, tem que
 * derivar deste mapa — nunca de strings soltas.
 *
 * Flags de recursos que EXISTEM no app hoje:
 *   orcamentos        → aba Orçamentos em Finanças
 *   clinico_avancado  → abas Radiografias, Visualização 3D, Linha do tempo e
 *                       Ortodontia no detalhe do paciente
 *   automacoes        → página Automações via WhatsApp
 *   mensagens         → página Mensagens (inbox unificado)
 *
 * Flags de roadmap (declaradas para o futuro; sem gate hoje):
 *   ia, relatorios, estoque_avancado, multiusuario, multiunidade
 */

export type Feature =
  | 'orcamentos'
  | 'clinico_avancado'
  | 'automacoes'
  | 'mensagens'
  | 'ia'
  | 'relatorios'
  | 'estoque_avancado'
  | 'multiusuario'
  | 'multiunidade'

interface PlanEntitlements {
  features: Feature[]
  maxDentists: number
}

const ESSENCIAL: Feature[] = []
const PROFISSIONAL: Feature[] = [...ESSENCIAL, 'orcamentos', 'clinico_avancado', 'automacoes', 'ia', 'relatorios']
const PERFORMANCE: Feature[] = [...PROFISSIONAL, 'mensagens']
const CLINIC_START: Feature[] = [...PROFISSIONAL, 'mensagens', 'multiusuario']
const CLINIC_PRO: Feature[] = [...CLINIC_START, 'estoque_avancado']
const CLINIC_PREMIUM: Feature[] = [...CLINIC_PRO, 'multiunidade']

export const PLAN_ENTITLEMENTS: Record<string, PlanEntitlements> = {
  essencial: { features: ESSENCIAL, maxDentists: 1 },
  profissional: { features: PROFISSIONAL, maxDentists: 1 },
  performance: { features: PERFORMANCE, maxDentists: 1 },
  clinic_start: { features: CLINIC_START, maxDentists: 2 },
  clinic_pro: { features: CLINIC_PRO, maxDentists: 5 },
  clinic_premium: { features: CLINIC_PREMIUM, maxDentists: 10 },
  clinic_enterprise: { features: CLINIC_PREMIUM, maxDentists: Number.POSITIVE_INFINITY },
  // legado: id antigo de plano de dentista (assinaturas locais criadas antes)
  individual: { features: PROFISSIONAL, maxDentists: 1 },
}

/** Nome amigável de cada recurso (paywall, cadeados, tooltips). */
export const FEATURE_LABEL: Record<Feature, string> = {
  orcamentos: 'Orçamentos',
  clinico_avancado: 'Radiografias, 3D e linha do tempo',
  automacoes: 'Automações via WhatsApp',
  mensagens: 'Caixa de mensagens unificada',
  ia: 'Assistente de IA',
  relatorios: 'Relatórios',
  estoque_avancado: 'Estoque avançado',
  multiusuario: 'Multiusuário',
  multiunidade: 'Múltiplas unidades',
}

/** Plano mínimo (nome comercial) que libera cada recurso — para o CTA do paywall. */
export const FEATURE_MIN_PLAN: Record<Feature, string> = {
  orcamentos: 'Profissional',
  clinico_avancado: 'Profissional',
  automacoes: 'Profissional',
  ia: 'Profissional',
  relatorios: 'Profissional',
  mensagens: 'Performance',
  multiusuario: 'Clínica Start',
  estoque_avancado: 'Clínica Pro',
  multiunidade: 'Clínica Premium',
}

/**
 * Um plano desconhecido libera tudo (fail-open) para não travar contas de
 * teste antigas no localStorage. O backend é quem falha fechado (403).
 */
export function planHasFeature(planId: string | undefined, feature: Feature): boolean {
  if (!planId) return false
  const ent = PLAN_ENTITLEMENTS[planId]
  if (!ent) return true
  return ent.features.includes(feature)
}

export function planMaxDentists(planId: string | undefined): number {
  if (!planId) return 1
  return PLAN_ENTITLEMENTS[planId]?.maxDentists ?? Number.POSITIVE_INFINITY
}
