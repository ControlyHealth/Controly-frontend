export type ID = string

export interface Patient {
  id: ID
  nome: string
  cpf?: string
  telefone?: string
  email?: string
  dataNascimento?: string
  observacoes?: string
  criadoEm: string
  atualizadoEm: string
}

export type ToothStatus =
  | 'saudavel'
  | 'carie'
  | 'restaurado'
  | 'tratamento'
  | 'ausente'
  | 'implante'

/** Marcador ortodôntico aplicado sobre o dente (independente da condição). */
export type OrtoMarker =
  | 'nenhum'
  | 'bracket'
  | 'banda'
  | 'contencao'
  | 'extracao'
  | 'alinhador'

export interface ToothRecord {
  numero: number
  status: ToothStatus
  /** marcação ortodôntica sobreposta (bráquete, contenção, etc.) */
  orto?: OrtoMarker
  observacao?: string
  atualizadoEm: string
}

export interface Odontograma {
  pacienteId: ID
  dentes: Record<number, ToothRecord>
  atualizadoEm: string
}

/** ----- Radiografias ----- */
export type RadiografiaTipo =
  | 'panoramica'
  | 'periapical'
  | 'interproximal'
  | 'oclusal'
  | 'telerradiografia'
  | 'tomografia'
  | 'outro'

export interface Radiografia {
  id: ID
  pacienteId: ID
  tipo: RadiografiaTipo
  data: string
  observacao?: string
  /** imagem em dataURL (base64) guardada localmente */
  imagem?: string
  nomeArquivo?: string
  criadoEm: string
}

/** ----- Estoque ----- */
export type StockCategory =
  | 'material'
  | 'instrumental'
  | 'ortodontia'
  | 'descartavel'
  | 'medicamento'
  | 'epi'
  | 'outro'

export interface StockItem {
  id: ID
  nome: string
  categoria: StockCategory
  quantidade: number
  minimo: number
  unidade: string
  fornecedor?: string
  validade?: string
  observacao?: string
  criadoEm: string
  atualizadoEm: string
}

/** ----- Plano de tratamento ortodôntico ----- */
export type OrthoAppliance =
  | 'metalico'
  | 'estetico'
  | 'autoligado'
  | 'lingual'
  | 'alinhador'
  | 'expansor'
  | 'contencao'

export type OrthoStatus = 'planejado' | 'ativo' | 'contencao' | 'finalizado' | 'pausado'

export interface OrthoTreatment {
  pacienteId: ID
  aparelho?: OrthoAppliance
  status: OrthoStatus
  inicio?: string
  previsaoFim?: string
  arcadas?: 'superior' | 'inferior' | 'ambas'
  queixa?: string
  objetivo?: string
  observacao?: string
  atualizadoEm: string
}

export type AutomationTrigger =
  | 'agendamento_criado'
  | 'lembrete_24h'
  | 'pos_consulta'
  | 'aniversario'
  | 'retorno_periodico'

export type AutomationChannel = 'whatsapp'

export interface Automation {
  id: ID
  nome: string
  gatilho: AutomationTrigger
  canal: AutomationChannel
  mensagem: string
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}
