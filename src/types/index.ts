export type ID = string

/** ----- Usuário / Profissional logado ----- */
export interface User {
  id: ID
  nome: string
  email?: string
  clinica?: string
  cargo?: string
}

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
  | 'lesao_nao_cariosa'
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

/** ----- Linha do tempo: sessão clínica com foto + estado dos dentes ----- */
export interface OdontoSessao {
  id: ID
  pacienteId: ID
  /** data da sessão (YYYY-MM-DD) */
  data: string
  /** foto intraoral comprimida (dataURL jpeg) */
  foto?: string
  observacao?: string
  /** snapshot do odontograma no momento da sessão */
  dentes: Record<number, ToothRecord>
  criadoEm: string
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

/** ----- Mensagens / Caixa de entrada unificada ----- */

/** Redes/canais de mensagem que podem ser conectados num só lugar. */
export type MessageChannel = 'whatsapp' | 'instagram' | 'facebook'

export type ChannelStatus = 'conectado' | 'desconectado' | 'erro'

/** Conexão de um canal social da clínica (uma conta por canal). */
export interface ChannelConnection {
  canal: MessageChannel
  status: ChannelStatus
  /** Nome/handle da conta conectada (ex.: @clinicacontroly, número, página). */
  conta?: string
  conectadoEm?: string
  atualizadoEm: string
}

export type MessageDirection = 'recebida' | 'enviada'

export interface Message {
  id: ID
  conversaId: ID
  direcao: MessageDirection
  texto: string
  /** Quem enviou (nome do contato ou do atendente). */
  autor?: string
  criadoEm: string
}

/** Uma conversa = um contato dentro de um canal. */
export interface Conversation {
  id: ID
  canal: MessageChannel
  /** Nome ou @ do contato externo. */
  contato: string
  /** Foto/avatar opcional (dataURL ou URL). */
  avatar?: string
  ultimaMensagem: string
  ultimaMensagemEm: string
  naoLidas: number
  /** Vínculo opcional com um paciente já cadastrado. */
  pacienteId?: ID
  criadoEm: string
  atualizadoEm: string
}

/** ----- Agenda / Consultas ----- */
export type AppointmentStatus =
  | 'agendado'
  | 'confirmado'
  | 'atendido'
  | 'atrasado'
  | 'faltou'
  | 'cancelado'

export interface Appointment {
  id: ID
  pacienteId: ID
  data: string // YYYY-MM-DD
  inicio: string // HH:MM
  fim: string // HH:MM
  procedimento?: string
  status: AppointmentStatus
  observacao?: string
  criadoEm: string
  atualizadoEm: string
}

/** ----- Financeiro ----- */
export type TransactionType = 'receita' | 'despesa'
export type TransactionStatus = 'pago' | 'pendente'

export type PaymentMethod =
  | 'dinheiro'
  | 'pix'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'transferencia'
  | 'boleto'
  | 'convenio'

export type FinanceCategory =
  | 'procedimento'
  | 'produto'
  | 'material'
  | 'salario'
  | 'aluguel'
  | 'equipamento'
  | 'imposto'
  | 'marketing'
  | 'outro'

export interface Transaction {
  id: ID
  tipo: TransactionType
  descricao: string
  valor: number
  categoria: FinanceCategory
  status: TransactionStatus
  metodo?: PaymentMethod
  data: string // YYYY-MM-DD
  vencimento?: string // YYYY-MM-DD (para pendentes)
  pacienteId?: ID
  orcamentoId?: ID
  observacao?: string
  criadoEm: string
  atualizadoEm: string
}

/** ----- Orçamentos / Plano de tratamento ----- */
export type OrcamentoStatus = 'rascunho' | 'aprovado' | 'recusado' | 'concluido'

export interface OrcamentoItem {
  descricao: string
  dente?: number
  quantidade: number
  valorUnitario: number
}

export interface Orcamento {
  id: ID
  pacienteId: ID
  itens: OrcamentoItem[]
  desconto?: number
  status: OrcamentoStatus
  observacao?: string
  criadoEm: string
  atualizadoEm: string
}
