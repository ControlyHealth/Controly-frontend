import type { Patient, Automation } from '@/types'

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
