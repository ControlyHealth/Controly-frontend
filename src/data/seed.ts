import type { Patient, Automation, StockItem, Appointment, Transaction, Orcamento } from '@/types'

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
      'Olá {{nome}}! Passando para lembrar da sua consulta amanhã às {{horario}} na Clínica Controly. Posso confirmar sua presença?',
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
      'Oi {{nome}}, tudo bem? Como você está se sentindo após o procedimento de hoje? Qualquer dúvida estamos à disposição.',
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
      'Olá {{nome}}! Já faz 6 meses desde sua última visita. Que tal agendar sua limpeza e avaliação? Responda aqui que cuidamos do resto.',
    ativo: false,
    criadoEm: now,
    atualizadoEm: now,
  },
]

/** datas relativas a hoje para a agenda já vir com exemplos */
function ymd(offsetDias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDias)
  return d.toISOString().slice(0, 10)
}

export const SEED_APPOINTMENTS: Appointment[] = [
  {
    id: 'seed-appt-1',
    pacienteId: 'seed-ana',
    data: ymd(0),
    inicio: '09:00',
    fim: '09:45',
    procedimento: 'Limpeza e profilaxia',
    status: 'confirmado',
    observacao: '',
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: 'seed-appt-2',
    pacienteId: 'seed-carlos',
    data: ymd(0),
    inicio: '10:30',
    fim: '11:30',
    procedimento: 'Restauração dente 36',
    status: 'agendado',
    observacao: '',
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: 'seed-appt-3',
    pacienteId: 'seed-ana',
    data: ymd(0),
    inicio: '14:00',
    fim: '14:30',
    procedimento: 'Ajuste de aparelho',
    status: 'agendado',
    observacao: '',
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: 'seed-appt-4',
    pacienteId: 'seed-carlos',
    data: ymd(1),
    inicio: '08:30',
    fim: '09:15',
    procedimento: 'Avaliação inicial',
    status: 'agendado',
    observacao: '',
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: 'seed-appt-5',
    pacienteId: 'seed-ana',
    data: ymd(2),
    inicio: '11:00',
    fim: '11:45',
    procedimento: 'Retorno ortodôntico',
    status: 'agendado',
    observacao: '',
    criadoEm: now,
    atualizadoEm: now,
  },
]

export const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'seed-tx-1',
    tipo: 'receita',
    descricao: 'Limpeza e profilaxia',
    valor: 180,
    categoria: 'procedimento',
    status: 'pago',
    metodo: 'pix',
    data: ymd(-2),
    pacienteId: 'seed-ana',
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: 'seed-tx-2',
    tipo: 'receita',
    descricao: 'Restauração dente 36',
    valor: 350,
    categoria: 'procedimento',
    status: 'pendente',
    data: ymd(-1),
    vencimento: ymd(5),
    pacienteId: 'seed-carlos',
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: 'seed-tx-3',
    tipo: 'despesa',
    descricao: 'Compra de luvas e descartáveis',
    valor: 240,
    categoria: 'material',
    status: 'pago',
    metodo: 'boleto',
    data: ymd(-3),
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: 'seed-tx-4',
    tipo: 'despesa',
    descricao: 'Aluguel do consultório',
    valor: 2200,
    categoria: 'aluguel',
    status: 'pendente',
    data: ymd(-5),
    vencimento: ymd(4),
    criadoEm: now,
    atualizadoEm: now,
  },
]

export const SEED_ORCAMENTOS: Orcamento[] = [
  {
    id: 'seed-orc-1',
    pacienteId: 'seed-carlos',
    itens: [
      { descricao: 'Restauração em resina', dente: 36, quantidade: 1, valorUnitario: 350 },
      { descricao: 'Clareamento dental', quantidade: 1, valorUnitario: 800 },
    ],
    desconto: 50,
    status: 'rascunho',
    observacao: 'Paciente avaliando opção de parcelamento.',
    criadoEm: now,
    atualizadoEm: now,
  },
]
