import type { ToothStatus } from '@/types'

/** Notação FDI — arcada superior (quadrantes 1 e 2) e inferior (4 e 3). */
export const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11]
export const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28]
export const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41]
export const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38]

export const UPPER_ARCH = [...UPPER_RIGHT, ...UPPER_LEFT]
export const LOWER_ARCH = [...LOWER_RIGHT, ...LOWER_LEFT]
export const ALL_TEETH = [...UPPER_ARCH, ...LOWER_ARCH]

interface StatusMeta {
  label: string
  /** cor de preenchimento do dente */
  fill: string
  /** cor da borda */
  stroke: string
  /** classe da bolinha de legenda */
  dot: string
}

export const STATUS_META: Record<ToothStatus, StatusMeta> = {
  saudavel: { label: 'Saudável', fill: '#ffffff', stroke: '#cbd5e1', dot: 'bg-white border border-slate-300' },
  carie: { label: 'Cárie', fill: '#fee2e2', stroke: '#ef4444', dot: 'bg-red-400' },
  restaurado: { label: 'Restaurado', fill: '#dbeafe', stroke: '#3b82f6', dot: 'bg-blue-400' },
  tratamento: { label: 'Em tratamento', fill: '#fef9c3', stroke: '#eab308', dot: 'bg-yellow-400' },
  ausente: { label: 'Ausente', fill: '#f1f5f9', stroke: '#94a3b8', dot: 'bg-slate-300' },
  implante: { label: 'Implante', fill: '#dcfce7', stroke: '#22c55e', dot: 'bg-green-500' },
}

export const STATUS_ORDER: ToothStatus[] = [
  'saudavel',
  'carie',
  'restaurado',
  'tratamento',
  'ausente',
  'implante',
]
