import { useMemo } from 'react'
import { Stethoscope, HeartPulse, ChevronRight, CircleCheck, FileText } from 'lucide-react'
import type { ToothStatus, OrtoMarker } from '@/types'
import { odontogramService } from '@/services/odontogram'
import { STATUS_META, STATUS_ORDER, ORTO_META, ORTO_ORDER, toothName } from '@/data/teeth'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

/** Junta uma lista em português: [a, b, c] -> "a, b e c". */
function juntar(itens: string[]): string {
  if (itens.length === 0) return ''
  if (itens.length === 1) return itens[0]
  return itens.slice(0, -1).join(', ') + ' e ' + itens[itens.length - 1]
}

const fmtData = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

export function OdontogramaResumo({
  pacienteId,
  onOpen,
}: {
  pacienteId: string
  onOpen?: () => void
}) {
  const resumo = useMemo(() => {
    const chart = odontogramService.get(pacienteId)
    const dentes = Object.values(chart.dentes)
    const porStatus = {
      saudavel: 0, carie: 0, lesao_nao_cariosa: 0, restaurado: 0, tratamento: 0, ausente: 0, implante: 0,
    } as Record<ToothStatus, number>
    const porOrto = {
      nenhum: 0, bracket: 0, banda: 0, contencao: 0, extracao: 0, alinhador: 0,
    } as Record<OrtoMarker, number>
    const dentesPorStatus = {} as Record<ToothStatus, number[]>
    STATUS_ORDER.forEach((s) => (dentesPorStatus[s] = []))
    const dentesPorOrto = {} as Record<OrtoMarker, number[]>
    ORTO_ORDER.forEach((m) => (dentesPorOrto[m] = []))
    const observacoes: { numero: number; texto: string }[] = []

    for (const d of dentes) {
      porStatus[d.status]++
      dentesPorStatus[d.status].push(d.numero)
      const orto = d.orto ?? 'nenhum'
      porOrto[orto]++
      if (orto !== 'nenhum') dentesPorOrto[orto].push(d.numero)
      if (d.observacao?.trim()) observacoes.push({ numero: d.numero, texto: d.observacao.trim() })
    }
    Object.values(dentesPorStatus).forEach((l) => l.sort((a, b) => a - b))
    Object.values(dentesPorOrto).forEach((l) => l.sort((a, b) => a - b))
    observacoes.sort((a, b) => a.numero - b.numero)

    const total = dentes.length
    const higidos = porStatus.saudavel
    const ausentes = porStatus.ausente
    const comCondicao = total - higidos - ausentes
    const comOrto = total - porOrto.nenhum
    const saude = total > 0 ? Math.round((higidos / total) * 100) : 0
    return {
      porStatus, porOrto, dentesPorStatus, dentesPorOrto, observacoes,
      total, higidos, ausentes, comCondicao, comOrto, saude, atualizadoEm: chart.atualizadoEm,
    }
  }, [pacienteId])

  // ----- Geração do laudo técnico (texto corrido) -----
  const laudo = useMemo(() => {
    const p: string[] = []
    const { total, higidos, saude, ausentes } = resumo

    let intro = `Foram avaliados ${total} dentes segundo a notação FDI, dos quais ${higidos} (${saude}%) apresentam-se hígidos`
    intro += ausentes > 0
      ? `, com registro de ${ausentes} ${ausentes === 1 ? 'elemento dentário ausente' : 'elementos dentários ausentes'}.`
      : '.'
    p.push(intro)

    const cond: string[] = []
    for (const s of STATUS_ORDER) {
      if (s === 'saudavel' || s === 'ausente') continue
      const lista = resumo.dentesPorStatus[s]
      if (lista.length) {
        cond.push(
          `${STATUS_META[s].label.toLowerCase()} ${lista.length === 1 ? 'no dente' : 'nos dentes'} ${juntar(lista.map(String))}`,
        )
      }
    }
    if (cond.length) p.push(`Quanto às condições clínicas, observa-se ${juntar(cond)}.`)

    const orto: string[] = []
    for (const m of ORTO_ORDER) {
      const lista = resumo.dentesPorOrto[m]
      if (lista.length) {
        orto.push(
          `${ORTO_META[m].label.toLowerCase()} ${lista.length === 1 ? 'no dente' : 'nos dentes'} ${juntar(lista.map(String))}`,
        )
      }
    }
    if (orto.length) p.push(`No aspecto ortodôntico, há ${juntar(orto)}.`)

    if (resumo.observacoes.length) {
      p.push(
        'Observações específicas: ' +
          resumo.observacoes
            .map((o) => `dente ${o.numero} (${toothName(o.numero).toLowerCase()}) — ${o.texto}`)
            .join('; ') +
          '.',
      )
    }

    const requerAtencao =
      resumo.dentesPorStatus.carie.length +
      resumo.dentesPorStatus.lesao_nao_cariosa.length +
      resumo.dentesPorStatus.tratamento.length
    if (resumo.comCondicao === 0 && resumo.ausentes === 0) {
      p.push(
        'Conclusão: arcada hígida, sem condições que demandem intervenção no momento. Recomenda-se manutenção preventiva e revisão clínica semestral.',
      )
    } else if (requerAtencao > 0) {
      p.push(
        'Conclusão: foram identificadas condições que requerem atenção odontológica. Recomenda-se a elaboração de um plano de tratamento para os elementos acometidos, seguido de acompanhamento periódico.',
      )
    } else {
      p.push(
        'Conclusão: arcada estável, com tratamentos prévios registrados. Recomenda-se acompanhamento de rotina e reforço das orientações de higiene bucal.',
      )
    }
    return p
  }, [resumo])

  const condicoes = STATUS_ORDER.filter((s) => s !== 'saudavel' && resumo.porStatus[s] > 0)
  const marcacoes = ORTO_ORDER.filter((m) => resumo.porOrto[m] > 0)

  const saudeColor =
    resumo.saude >= 80 ? 'bg-emerald-500' : resumo.saude >= 50 ? 'bg-amber-500' : 'bg-red-500'

  const stats = [
    { label: 'Hígidos', value: resumo.higidos, dot: 'bg-emerald-500' },
    { label: 'Com condição', value: resumo.comCondicao, dot: 'bg-amber-500' },
    { label: 'Ausentes', value: resumo.ausentes, dot: 'bg-slate-400' },
    { label: 'Marcações orto', value: resumo.comOrto, dot: 'bg-violet-500' },
  ]

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onOpen}
          disabled={!onOpen}
          className={cn('flex items-center gap-2 text-left', onOpen && 'group cursor-pointer')}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Stethoscope size={16} />
          </span>
          <h3 className="font-semibold text-slate-800 group-hover:text-brand-700">
            Resumo geral do odontograma
          </h3>
          {onOpen && (
            <ChevronRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
          )}
        </button>
        <span className="text-xs text-slate-400">{resumo.total} dentes</span>
      </div>

      {/* índice de saúde bucal */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <HeartPulse size={15} className="text-rose-500" /> Saúde bucal
          </span>
          <span className="font-semibold tabular-nums text-slate-800">{resumo.saude}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn('h-full rounded-full transition-all', saudeColor)}
            style={{ width: `${resumo.saude}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          {resumo.higidos} de {resumo.total} dentes hígidos
        </p>
      </div>

      {/* mini-cards de contagem */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
            <p className="text-xl font-bold tabular-nums text-slate-800">{s.value}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* detalhamento das condições */}
      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          Condições registradas
        </p>
        {condicoes.length === 0 ? (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CircleCheck size={15} /> Nenhuma condição — arcada saudável.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {condicoes.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{ backgroundColor: STATUS_META[s].fill, color: STATUS_META[s].stroke }}
              >
                <span className={cn('h-2 w-2 rounded-full', STATUS_META[s].dot)} />
                {STATUS_META[s].label}: {resumo.porStatus[s]}
              </span>
            ))}
          </div>
        )}

        {marcacoes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
            {marcacoes.map((m) => (
              <span key={m} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <span className={cn('h-2 w-2 rounded-full', ORTO_META[m].dot)} />
                {ORTO_META[m].label}: {resumo.porOrto[m]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* laudo técnico escrito */}
      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <FileText size={15} className="text-brand-600" /> Laudo técnico
          </p>
          <span className="text-xs text-slate-400">Emitido em {fmtData(new Date().toISOString())}</span>
        </div>
        <div className="space-y-1.5 text-xs leading-relaxed text-slate-600">
          {laudo.map((par, i) => (
            <p key={i} className={i === laudo.length - 1 ? 'font-medium text-slate-700' : undefined}>
              {par}
            </p>
          ))}
        </div>
        <p className="mt-2 border-t border-slate-200 pt-2 text-[11px] text-slate-400">
          Documento gerado automaticamente a partir do odontograma · última atualização do mapa em{' '}
          {fmtData(resumo.atualizadoEm)}. Não substitui avaliação clínica presencial.
        </p>
      </div>
    </Card>
  )
}
