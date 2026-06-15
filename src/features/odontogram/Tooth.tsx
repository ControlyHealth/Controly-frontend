import type { ToothRecord, OrtoMarker } from '@/types'
import {
  STATUS_META,
  ORTO_META,
  TOOTH_SHAPES,
  toothType,
  ROOT_FILL,
  ROOT_STROKE,
  GROOVE,
} from '@/data/teeth'
import { cn } from '@/lib/cn'

/** Desenha o marcador ortodôntico sobre a coroa (em coordenadas de tela). */
function OrtoOverlay({ marker, cy }: { marker: OrtoMarker; cy: number }) {
  const color = ORTO_META[marker].color
  const cx = 18
  switch (marker) {
    case 'bracket':
      return (
        <g>
          <line x1={2} y1={cy} x2={34} y2={cy} stroke={color} strokeWidth={1.5} />
          <rect
            x={cx - 4}
            y={cy - 3.5}
            width={8}
            height={7}
            rx={1.5}
            fill="#fff"
            stroke={color}
            strokeWidth={1.6}
          />
          <line x1={cx} y1={cy - 3.5} x2={cx} y2={cy + 3.5} stroke={color} strokeWidth={1.2} />
        </g>
      )
    case 'banda':
      return (
        <rect x={5} y={cy - 4} width={26} height={8} rx={2} fill="none" stroke={color} strokeWidth={2} />
      )
    case 'contencao':
      return (
        <g>
          <line
            x1={6}
            y1={cy + 6}
            x2={30}
            y2={cy + 6}
            stroke={color}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          <circle cx={10} cy={cy + 6} r={1.6} fill={color} />
          <circle cx={26} cy={cy + 6} r={1.6} fill={color} />
        </g>
      )
    case 'extracao':
      return (
        <g stroke={color} strokeWidth={2.4} strokeLinecap="round">
          <line x1={9} y1={cy - 8} x2={27} y2={cy + 8} />
          <line x1={27} y1={cy - 8} x2={9} y2={cy + 8} />
        </g>
      )
    case 'alinhador':
      return (
        <rect
          x={7}
          y={cy - 7}
          width={22}
          height={16}
          rx={5}
          fill="none"
          stroke={color}
          strokeWidth={1.8}
          strokeDasharray="3 2"
        />
      )
    default:
      return null
  }
}

export function Tooth({
  numero,
  record,
  arch,
  selected,
  onClick,
}: {
  numero: number
  record?: ToothRecord
  arch: 'upper' | 'lower'
  selected: boolean
  onClick: () => void
}) {
  const status = record?.status ?? 'saudavel'
  const orto = record?.orto ?? 'nenhum'
  const meta = STATUS_META[status]
  const type = toothType(numero)
  const shape = TOOTH_SHAPES[type]
  const hasNote = !!record?.observacao?.trim()
  const ausente = status === 'ausente'

  const flip = arch === 'upper'
  const crownCY = flip ? 56 - shape.crownCY : shape.crownCY
  // molares superiores têm 3 raízes
  const roots = type === 'molar' && flip && shape.rootsUpper ? shape.rootsUpper : shape.roots

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Dente ${numero} — ${meta.label}${orto !== 'nenhum' ? ` · ${ORTO_META[orto].label}` : ''}`}
      className={cn(
        'group relative flex flex-col items-center gap-1 rounded-lg p-1 transition',
        selected ? 'bg-brand-100 ring-2 ring-brand-500' : 'hover:bg-slate-100',
      )}
    >
      <svg width="34" height="52" viewBox="0 0 36 56" className="shrink-0 drop-shadow-sm">
        <g transform={flip ? 'translate(0,56) scale(1,-1)' : undefined}>
          {/* raiz (dentina/cemento, creme) */}
          <path
            d={roots}
            fill={ausente ? 'none' : ROOT_FILL}
            stroke={ausente ? meta.stroke : ROOT_STROKE}
            strokeWidth={1.4}
            strokeLinejoin="round"
            strokeDasharray={ausente ? '3 3' : undefined}
            opacity={ausente ? 0.5 : 1}
          />
          {/* coroa (esmalte) — recebe a cor da condição */}
          <path
            d={shape.crown}
            fill={meta.fill}
            stroke={meta.stroke}
            strokeWidth={1.7}
            strokeLinejoin="round"
            strokeDasharray={ausente ? '3 3' : undefined}
          />
          {/* sulcos da coroa */}
          {!ausente && shape.grooves && (
            <path
              d={shape.grooves}
              fill="none"
              stroke={GROOVE}
              strokeWidth={1}
              strokeLinecap="round"
              opacity={0.55}
            />
          )}
        </g>
        {/* marcador ortodôntico (sem flip, em coordenadas de tela) */}
        {orto !== 'nenhum' && !ausente && <OrtoOverlay marker={orto} cy={crownCY} />}
      </svg>
      <span className="text-[11px] font-medium tabular-nums text-slate-500">{numero}</span>
      {hasNote && (
        <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white" />
      )}
    </button>
  )
}
