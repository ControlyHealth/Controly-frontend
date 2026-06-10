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

export interface ToothRecord {
  numero: number
  status: ToothStatus
  observacao?: string
  atualizadoEm: string
}

export interface Odontograma {
  pacienteId: ID
  dentes: Record<number, ToothRecord>
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
