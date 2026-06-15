import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { ToothRecord, ToothStatus, OrtoMarker } from '@/types'
import { STATUS_META, STATUS_ORDER, ORTO_META, ORTO_ORDER, toothName } from '@/data/teeth'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { cn } from '@/lib/cn'

export function ToothPanel({
  numero,
  record,
  onSave,
  onClose,
}: {
  numero: number
  record?: ToothRecord
  onSave: (patch: { status: ToothStatus; orto: OrtoMarker; observacao: string }) => void
  onClose: () => void
}) {
  const [status, setStatus] = useState<ToothStatus>(record?.status ?? 'saudavel')
  const [orto, setOrto] = useState<OrtoMarker>(record?.orto ?? 'nenhum')
  const [observacao, setObservacao] = useState(record?.observacao ?? '')

  useEffect(() => {
    setStatus(record?.status ?? 'saudavel')
    setOrto(record?.orto ?? 'nenhum')
    setObservacao(record?.observacao ?? '')
  }, [numero, record])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Dente · {toothName(numero)}
          </p>
          <p className="text-2xl font-bold text-slate-800">{numero}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden cursor-pointer"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-slate-700">Condição</p>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_ORDER.map((s) => {
            const meta = STATUS_META[s]
            const active = status === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition cursor-pointer',
                  active
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                <span className={cn('h-3 w-3 shrink-0 rounded-full', meta.dot)} />
                {meta.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-slate-700">Marcação ortodôntica</p>
        <div className="grid grid-cols-2 gap-2">
          {(['nenhum', ...ORTO_ORDER] as OrtoMarker[]).map((m) => {
            const meta = ORTO_META[m]
            const active = orto === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => setOrto(m)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition cursor-pointer',
                  active
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                <span className={cn('h-3 w-3 shrink-0 rounded-full', meta.dot)} />
                {meta.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex-1">
        <p className="mb-2 text-sm font-medium text-slate-700">Observação</p>
        <Textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Ex.: Cárie na face oclusal, indicar restauração..."
          className="min-h-24"
        />
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Fechar
        </Button>
        <Button
          className="flex-1"
          onClick={() => onSave({ status, orto, observacao: observacao.trim() })}
        >
          Salvar
        </Button>
      </div>
    </div>
  )
}
