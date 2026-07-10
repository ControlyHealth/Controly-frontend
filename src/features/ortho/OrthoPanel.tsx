import { useState } from 'react'
import { Save, Braces } from 'lucide-react'
import type { OrthoAppliance, OrthoStatus } from '@/types'
import { orthoService, type OrthoInput } from '@/services/ortho'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { anunciar } from '@/services/notifications'

export const APPLIANCE_LABEL: Record<OrthoAppliance, string> = {
  metalico: 'Aparelho fixo metálico',
  estetico: 'Aparelho fixo estético (cerâmica/safira)',
  autoligado: 'Autoligado',
  lingual: 'Lingual',
  alinhador: 'Alinhador invisível',
  expansor: 'Expansor palatino',
  contencao: 'Contenção',
}

const APPLIANCES = Object.keys(APPLIANCE_LABEL) as OrthoAppliance[]

export const ORTHO_STATUS_LABEL: Record<OrthoStatus, string> = {
  planejado: 'Planejado',
  ativo: 'Em tratamento',
  contencao: 'Contenção',
  finalizado: 'Finalizado',
  pausado: 'Pausado',
}

const STATUS_STYLE: Record<OrthoStatus, string> = {
  planejado: 'bg-slate-100 text-slate-700',
  ativo: 'bg-brand-100 text-brand-700',
  contencao: 'bg-pink-100 text-pink-700',
  finalizado: 'bg-green-100 text-green-700',
  pausado: 'bg-amber-100 text-amber-700',
}

const STATUSES = Object.keys(ORTHO_STATUS_LABEL) as OrthoStatus[]

export function OrthoPanel({ pacienteId }: { pacienteId: string }) {
  const inicial = orthoService.get(pacienteId)
  const [form, setForm] = useState<OrthoInput>({
    aparelho: inicial.aparelho,
    status: inicial.status,
    inicio: inicial.inicio ?? '',
    previsaoFim: inicial.previsaoFim ?? '',
    arcadas: inicial.arcadas ?? 'ambas',
    queixa: inicial.queixa ?? '',
    objetivo: inicial.objetivo ?? '',
    observacao: inicial.observacao ?? '',
  })
  const [salvoEm, setSalvoEm] = useState<string | null>(null)

  function set<K extends keyof OrthoInput>(key: K, value: OrthoInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSave() {
    const saved = orthoService.save(pacienteId, form)
    setSalvoEm(saved.atualizadoEm)
    anunciar('clinico', 'Plano ortodôntico salvo.', ORTHO_STATUS_LABEL[form.status])
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Braces size={18} />
          </span>
          <h3 className="font-semibold text-slate-800">Plano ortodôntico</h3>
        </div>
        <Badge className={cn(STATUS_STYLE[form.status])}>{ORTHO_STATUS_LABEL[form.status]}</Badge>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tipo de aparelho">
            <Select
              value={form.aparelho ?? ''}
              onChange={(e) => set('aparelho', (e.target.value || undefined) as OrthoAppliance | undefined)}
            >
              <option value="">— Não definido —</option>
              {APPLIANCES.map((a) => (
                <option key={a} value={a}>
                  {APPLIANCE_LABEL[a]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status do tratamento">
            <Select value={form.status} onChange={(e) => set('status', e.target.value as OrthoStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ORTHO_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Arcadas">
            <Select
              value={form.arcadas}
              onChange={(e) => set('arcadas', e.target.value as OrthoInput['arcadas'])}
            >
              <option value="ambas">Ambas</option>
              <option value="superior">Superior</option>
              <option value="inferior">Inferior</option>
            </Select>
          </Field>
          <Field label="Início">
            <Input type="date" value={form.inicio} onChange={(e) => set('inicio', e.target.value)} />
          </Field>
          <Field label="Previsão de término">
            <Input
              type="date"
              value={form.previsaoFim}
              onChange={(e) => set('previsaoFim', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Queixa principal">
          <Input
            value={form.queixa}
            onChange={(e) => set('queixa', e.target.value)}
            placeholder="Ex.: Apinhamento ântero-inferior, mordida cruzada…"
          />
        </Field>

        <Field label="Objetivo do tratamento">
          <Input
            value={form.objetivo}
            onChange={(e) => set('objetivo', e.target.value)}
            placeholder="Ex.: Nivelamento e alinhamento, correção de Classe II…"
          />
        </Field>

        <Field label="Observações">
          <Textarea
            value={form.observacao}
            onChange={(e) => set('observacao', e.target.value)}
            placeholder="Evolução, trocas de fio, elásticos, próximos passos…"
          />
        </Field>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-400">
            {salvoEm
              ? `Salvo às ${new Date(salvoEm).toLocaleTimeString('pt-BR')}`
              : `Última atualização: ${formatDate(inicial.atualizadoEm)}`}
          </span>
          <Button onClick={handleSave}>
            <Save size={16} /> Salvar plano
          </Button>
        </div>
      </div>
    </Card>
  )
}
