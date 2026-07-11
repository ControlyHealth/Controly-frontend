/**
 * Campanhas automáticas prontas — mock localStorage.
 *
 * Diferente das Automações (fluxos que o usuário monta do zero), campanhas
 * são modelos pré-configurados que ligam com um clique. O estado ativo e o
 * histórico de envios ficam persistidos; o disparo real é papel do backend
 * (motor de automações + provedor WhatsApp/SMS).
 */
import { readStore, writeStore } from '@/lib/storage'
import { uid } from '@/lib/id'

export type CampaignId =
  | 'aniversariantes'
  | 'retorno_semestral'
  | 'inadimplentes'
  | 'troca_alinhadores'
  | 'pesquisa_satisfacao'

export interface CampaignTemplate {
  id: CampaignId
  nome: string
  descricao: string
  /** categoria de crédito consumida pelos envios */
  credito: 'marketing' | 'confirmacoes'
  mensagem: string
}

export interface CampaignSend {
  id: string
  campanhaId: CampaignId | 'personalizada'
  campanhaNome: string
  destinatario: string
  status: 'enviada' | 'erro'
  erro?: string
  criadoEm: string
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'aniversariantes',
    nome: 'Aniversariantes',
    descricao: 'Parabenize os pacientes aniversariantes de forma automática.',
    credito: 'marketing',
    mensagem: 'Olá {{nome}}! 🎉 A equipe da clínica deseja um feliz aniversário. Conte com a gente para manter esse sorriso!',
  },
  {
    id: 'retorno_semestral',
    nome: 'Retorno semestral',
    descricao: 'Convide pacientes que fizeram a última consulta há mais de 6 meses para uma revisão.',
    credito: 'marketing',
    mensagem: 'Olá {{nome}}! Já faz 6 meses desde sua última visita. Que tal agendar uma revisão? Responda esta mensagem e cuidamos do resto.',
  },
  {
    id: 'inadimplentes',
    nome: 'Inadimplentes',
    descricao: 'Lembre os pacientes que possuem pagamentos em aberto na sua clínica.',
    credito: 'confirmacoes',
    mensagem: 'Olá {{nome}}, identificamos um pagamento em aberto na clínica. Podemos te ajudar a regularizar? Qualquer dúvida, é só responder aqui.',
  },
  {
    id: 'troca_alinhadores',
    nome: 'Troca de alinhadores',
    descricao: 'Ajude seus pacientes a lembrarem quando precisam trocar os alinhadores.',
    credito: 'confirmacoes',
    mensagem: 'Olá {{nome}}! Passando para lembrar: chegou a hora de trocar seu alinhador. 😁',
  },
  {
    id: 'pesquisa_satisfacao',
    nome: 'Pesquisa de satisfação',
    descricao: 'Colete o feedback dos seus pacientes após a consulta.',
    credito: 'marketing',
    mensagem: 'Olá {{nome}}! Como foi sua experiência na consulta de hoje? De 0 a 10, quanto você nos recomendaria?',
  },
]

const ATIVAS_KEY = 'campaigns:ativas'
const ENVIOS_KEY = 'campaigns:envios'

export const campaignsService = {
  ativas(): CampaignId[] {
    return readStore<CampaignId[]>(ATIVAS_KEY, [])
  },
  isAtiva(id: CampaignId): boolean {
    return this.ativas().includes(id)
  },
  /** Liga/desliga uma campanha. Retorna o novo estado (true = ativa). */
  toggle(id: CampaignId): boolean {
    const atuais = this.ativas()
    const ativa = atuais.includes(id)
    writeStore(ATIVAS_KEY, ativa ? atuais.filter((c) => c !== id) : [...atuais, id])
    return !ativa
  },
  envios(): CampaignSend[] {
    return readStore<CampaignSend[]>(ENVIOS_KEY, [])
  },
  /** Registro de envio (usado pelo motor real; exposto para semear demo/testes). */
  registrarEnvio(input: Omit<CampaignSend, 'id' | 'criadoEm'>): CampaignSend {
    const envio: CampaignSend = { ...input, id: uid(), criadoEm: new Date().toISOString() }
    writeStore(ENVIOS_KEY, [envio, ...this.envios()].slice(0, 200))
    return envio
  },
}
