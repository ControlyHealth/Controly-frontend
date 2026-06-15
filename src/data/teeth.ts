import type { ToothStatus, OrtoMarker } from '@/types'

/** Notação FDI — arcada superior (quadrantes 1 e 2) e inferior (4 e 3). */
export const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11]
export const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28]
export const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41]
export const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38]

export const UPPER_ARCH = [...UPPER_RIGHT, ...UPPER_LEFT]
export const LOWER_ARCH = [...LOWER_RIGHT, ...LOWER_LEFT]
export const ALL_TEETH = [...UPPER_ARCH, ...LOWER_ARCH]

/** ----- Tipo anatômico do dente (derivado do último dígito FDI) ----- */
export type ToothType = 'incisivo' | 'canino' | 'premolar' | 'molar'

export function toothType(numero: number): ToothType {
  const pos = numero % 10 // 1..8 dentro do quadrante
  if (pos <= 2) return 'incisivo' // central / lateral
  if (pos === 3) return 'canino'
  if (pos <= 5) return 'premolar' // 1º / 2º pré-molar
  return 'molar' // 1º / 2º / 3º molar (siso)
}

export function toothName(numero: number): string {
  const pos = numero % 10
  const map: Record<number, string> = {
    1: 'Incisivo central',
    2: 'Incisivo lateral',
    3: 'Canino',
    4: '1º pré-molar',
    5: '2º pré-molar',
    6: '1º molar',
    7: '2º molar',
    8: '3º molar (siso)',
  }
  return map[pos] ?? 'Dente'
}

/**
 * Formas anatômicas. Sistema de coordenadas: viewBox 36 x 56, dente desenhado
 * com a COROA em cima (y≈4..26) e a RAIZ embaixo (y≈26..55) — orientação natural
 * da arcada inferior. Para a arcada superior aplicamos um flip vertical.
 */
export interface ToothShape {
  crown: string
  roots: string
  /** centro Y da coroa (na orientação inferior, sem flip) — usado p/ marcadores */
  crownCY: number
}

export const TOOTH_SHAPES: Record<ToothType, ToothShape> = {
  incisivo: {
    crown: 'M10 26 L10 10 Q10 5 18 4 Q26 5 26 10 L26 26 Z',
    roots: 'M12 26 C11 40 16 52 18 53 C20 52 25 40 24 26 Z',
    crownCY: 15,
  },
  canino: {
    crown: 'M10 26 L10 12 C10 6 14 3 18 2 C22 3 26 6 26 12 L26 26 Z',
    roots: 'M11 26 C9 41 15 54 18 55 C21 54 27 41 25 26 Z',
    crownCY: 15,
  },
  premolar: {
    crown:
      'M8 26 L8 12 Q8 6 12 6 Q15 6 16 9 Q17 10 18 10 Q19 10 20 9 Q21 6 24 6 Q28 6 28 12 L28 26 Z',
    roots: 'M11 26 C10 39 15 50 18 51 C21 50 26 39 25 26 Z',
    crownCY: 16,
  },
  molar: {
    crown:
      'M6 26 L6 13 Q6 7 10 6 Q12 6 13 9 Q14 10 16 10 Q17 9 18 9 Q19 9 20 10 Q22 10 23 9 Q24 6 26 6 Q30 7 30 13 L30 26 Z',
    roots:
      'M9 26 C7 38 9 49 11 50 C13 49 13 38 13 27 Z M23 27 C23 38 23 49 25 50 C27 49 29 38 27 26 Z',
    crownCY: 16,
  },
}

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

/** ----- Marcadores ortodônticos ----- */
interface OrtoMeta {
  label: string
  /** cor do marcador desenhado sobre o dente */
  color: string
  /** classe da bolinha de legenda */
  dot: string
}

export const ORTO_META: Record<OrtoMarker, OrtoMeta> = {
  nenhum: { label: 'Sem marcação', color: 'transparent', dot: 'bg-white border border-slate-300' },
  bracket: { label: 'Bráquete', color: '#7c3aed', dot: 'bg-violet-500' },
  banda: { label: 'Banda', color: '#0891b2', dot: 'bg-cyan-600' },
  contencao: { label: 'Contenção', color: '#db2777', dot: 'bg-pink-600' },
  extracao: { label: 'Extração indicada', color: '#dc2626', dot: 'bg-red-600' },
  alinhador: { label: 'Alinhador', color: '#0d9488', dot: 'bg-teal-600' },
}

/** ordem exibida na legenda / painel (exclui "nenhum") */
export const ORTO_ORDER: OrtoMarker[] = ['bracket', 'banda', 'contencao', 'extracao', 'alinhador']
