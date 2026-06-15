import type { Patient, Automation, StockItem } from '@/types'

const now = new Date().toISOString()

export const SEED_PATIENTS: Patient[] = [
  {
    id: 'seed-ana',
    nome: 'Ana Beatriz Lima',
    cpf: '123.456.789-00',
    telefone: '(11) 99876-5432',
    email: 'ana.lima@email.com',
    dataNascimento: '1992-04-18',
    observacoes: 'Sensibilidade a anestésico com adrenalina.',
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: 'seed-carlos',
    nome: 'Carlos Henrique Souza',
    cpf: '987.654.321-00',
    telefone: '(11) 98123-4567',
    email: 'carlos.souza@email.com',
    dataNascimento: '1985-11-02',
    observacoes: '',
    criadoEm: now,
    atualizadoEm: now,
  },
]

export const SEED_STOCK: StockItem[] = [
  {
    id: 'seed-stock-luva',
    nome: 'Luva de procedimento (M)',
    categoria: 'descartavel',
    quantidade: 8,
    minimo: 10,
    unidade: 'caixa',
    fornecedor: 'Dental Cremer',
    validade: '2027-03-01',
    observacao: '',
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: 'seed-stock-anestesico',
    nome: 'Anestésico Lidocaína 2%',
    categoria: 'medicamento',
    quantidade: 24,
    minimo: 12,
    unidade: 'tubete',
    fornecedor: 'DFL',
    validade: '2026-09-01',
    observacao: '',
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: 'seed-stock-bracket',
    nome: 'Kit de bráquetes metálicos Roth',
    categoria: 'ortodontia',
    quantidade: 5,
    minimo: 3,
    unidade: 'kit',
    fornecedor: 'Morelli',
    observacao: 'Slot 0.022"',
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: 'seed-stock-resina',
    nome: 'Resina composta A2',
    categoria: 'material',
    quantidade: 2,
    minimo: 4,
    unidade: 'seringa',
    fornecedor: '3M',
    validade: '2026-12-01',
    observacao: '',
    criadoEm: now,
    atualizadoEm: now,
  },
]

export const SEED_AUTOMATIONS: Automation[] = [
  {
    id: 'seed-auto-lembrete',
    nome: 'Lembrete de consulta (24h antes)',
    gatilho: 'lembrete_24h',
    canal: 'whatsapp',
    mensagem:
      'Olá {{nome}}! 😁 Passando para lembrar da sua consulta amanhã às {{horario}} na Clínica Controly. Posso confirmar sua presença?',
    ativo: true,
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: 'seed-auto-pos',
    nome: 'Pós-atendimento',
    gatilho: 'pos_consulta',
    canal: 'whatsapp',
    mensagem:
      'Oi {{nome}}, tudo bem? Como você está se sentindo após o procedimento de hoje? Qualquer dúvida estamos à disposição. 🦷',
    ativo: true,
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: 'seed-auto-retorno',
    nome: 'Retorno semestral',
    gatilho: 'retorno_periodico',
    canal: 'whatsapp',
    mensagem:
      'Olá {{nome}}! Já faz 6 meses desde sua última visita. Que tal agendar sua limpeza e avaliação? Responda aqui que cuidamos do resto. 🪥',
    ativo: false,
    criadoEm: now,
    atualizadoEm: now,
  },
]
