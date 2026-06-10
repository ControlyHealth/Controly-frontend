import type { AutomationTrigger } from '@/types'

export const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  agendamento_criado: 'Quando um agendamento é criado',
  lembrete_24h: 'Lembrete 24h antes da consulta',
  pos_consulta: 'Após a consulta (pós-atendimento)',
  aniversario: 'No aniversário do paciente',
  retorno_periodico: 'Retorno periódico (ex.: 6 meses)',
}
