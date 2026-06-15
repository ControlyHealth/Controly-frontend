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

/** Cores da raiz (dentina/cemento) — coroa usa as cores da condição. */
export const ROOT_FILL = '#efdcb4'
export const ROOT_STROKE = '#c8a86a'
/** cor dos sulcos/linhas da coroa */
export const GROOVE = '#94a3b8'

/**
 * Anatomia desenhada em viewBox 36 x 56, com a COROA em cima (y≈2..25) e a
 * RAIZ embaixo (y≈25..55) — orientação natural da arcada inferior. A arcada
 * superior recebe um flip vertical. Molares têm 2 raízes (inferior) ou 3
 * raízes (superior, via rootsUpper).
 */
export interface ToothShape {
  crown: string
  roots: string
  /** raízes alternativas para molares superiores (3 raízes) */
  rootsUpper?: string
  /** sulcos/linhas desenhados sobre a coroa (apenas traço) */
  grooves?: string
  /** centro Y da coroa (orientação inferior, sem flip) — usado p/ marcadores */
  crownCY: number
}

export const TOOTH_SHAPES: Record<ToothType, ToothShape> = {
  incisivo: {
    crown: 'M9 25 L9.5 12 C9.5 7 12 4 18 3.2 C24 4 26.5 7 26.5 12 L27 25 Z',
    roots: 'M12 25 C11 37 14.5 49 18 52 C21.5 49 25 37 24 25 Z',
    grooves: 'M14.5 8 L14.5 20 M21.5 8 L21.5 20',
    crownCY: 14,
  },
  canino: {
    crown: 'M9.5 25 L10 13 C10 7 13.5 5 18 2.2 C22.5 5 26 7 26 13 L26.5 25 Z',
    roots: 'M10.5 25 C8.5 40 15 54 18 55 C21 54 27.5 40 25.5 25 Z',
    grooves: 'M18 5 L18 19',
    crownCY: 14,
  },
  premolar: {
    crown:
      'M8 25 L8 12 C8 8 10.5 6.5 12.5 6.5 C14.5 6.5 15.5 8.5 18 8.5 C20.5 8.5 21.5 6.5 23.5 6.5 C25.5 6.5 28 8 28 12 L28 25 Z',
    roots: 'M11 25 C10 37 15 48 18 49.5 C21 48 26 37 25 25 Z',
    grooves: 'M18 9 L18 16 M12 12 L24 12',
    crownCY: 15,
  },
  molar: {
    crown:
      'M6 25 L6 12 C6 8 8.5 6.5 10.5 6.5 C12 6.5 12.5 8.5 14 8.5 C15.5 8.5 16 6.8 18 6.8 C20 6.8 20.5 8.5 22 8.5 C23.5 8.5 24 6.5 25.5 6.5 C27.5 6.5 30 8 30 12 L30 25 Z',
    roots:
      'M10 25 C7 35 6 47 7.5 48 C9.5 47 12 36 13 26 Z M23 26 C24 36 26.5 47 28.5 48 C30 47 29 35 26 25 Z',
    rootsUpper:
      'M9 25 C6 34 4 45 5.5 46 C7.5 45 9.5 36 11 26 Z M16.5 25 C16 35 16 46 18 47 C20 46 20 35 19.5 25 Z M25 26 C26.5 36 30 45 31 46 C32.5 45 30 34 27 25 Z',
    grooves: 'M10 12 L26 12 M18 8 L18 21',
    crownCY: 15,
  },
}

interface StatusMeta {
  label: string
  /** cor de preenchimento da coroa */
  fill: string
  /** cor da borda */
  stroke: string
  /** classe da bolinha de legenda */
  dot: string
}

export const STATUS_META: Record<ToothStatus, StatusMeta> = {
  saudavel: { label: 'Hígido', fill: '#ffffff', stroke: '#94a3b8', dot: 'bg-white border border-slate-300' },
  carie: { label: 'Cárie', fill: '#fee2e2', stroke: '#ef4444', dot: 'bg-red-400' },
  lesao_nao_cariosa: { label: 'Lesão não cariosa', fill: '#ffedd5', stroke: '#f97316', dot: 'bg-orange-400' },
  restaurado: { label: 'Restaurado', fill: '#dbeafe', stroke: '#3b82f6', dot: 'bg-blue-400' },
  tratamento: { label: 'Em tratamento', fill: '#fef9c3', stroke: '#eab308', dot: 'bg-yellow-400' },
  ausente: { label: 'Ausente', fill: '#f1f5f9', stroke: '#94a3b8', dot: 'bg-slate-300' },
  implante: { label: 'Implante', fill: '#dcfce7', stroke: '#22c55e', dot: 'bg-green-500' },
}

export const STATUS_ORDER: ToothStatus[] = [
  'saudavel',
  'carie',
  'lesao_nao_cariosa',
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
