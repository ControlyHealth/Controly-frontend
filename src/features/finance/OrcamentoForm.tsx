import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Orcamento, OrcamentoItem, OrcamentoStatus } from '@/types'
import { type OrcamentoInput, orcamentoTotal } from '@/services/finance'
import { patientsService } from '@/services/patients'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatBRL } from '@/lib/format'

export const ORCAMENTO_STATUS_LABEL: Record<OrcamentoStatus, string> = {
  rascunho: 'Rascunho',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  concluido: 'Concluído',
}

const STATUSES = Object.keys(ORCAMENTO_STATUS_LABEL) as OrcamentoStatus[]

const emptyItem = (): OrcamentoItem => ({ descricao: '', quantidade: 1, valorUnitario: 0 })

export function OrcamentoForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Orcamento
  onSubmit: (data: OrcamentoInput) => void
  onCancel: () => void
}) {
  const patients = patientsService.list()
  const [form, setForm] = useState<OrcamentoInput>({
    pacienteId: initial?.pacienteId ?? patients[0]?.id ?? '',
    itens: initial?.itens?.length ? initial.itens.map((i) => ({ ...i })) : [emptyItem()],
    desconto: initial?.desconto ?? 0,
    status: initial?.status ?? 'rascunho',
    observacao: initial?.observacao ?? '',
  })
  const [erro, setErro] = useState<string | null>(null)

  function setItem(idx: number, patch: Partial<OrcamentoItem>) {
    setForm((f) => ({
      ...f,
      itens: f.itens.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }))
  }
  function addItem() {
    setForm((f) => ({ ...f, itens: [...f.itens, emptyItem()] }))
  }
  function removeItem(idx: number) {
    setForm((f) => ({ ...f, itens: f.itens.filter((_, i) => i !== idx) }))
  }

  const total = orcamentoTotal(form)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.pacienteId) return setErro('Selecione um paciente.')
    const itens = form.itens.filter((i) => i.descricao.trim() && i.valorUnitario > 0)
    if (itens.length === 0) return setErro('Adicione ao menos um item com descrição e valor.')
    onSubmit({ ...form, itens, desconto: form.desconto || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Paciente *">
        {patients.length === 0 ? (
          <p className="text-sm text-slate-400">Cadastre um paciente primeiro.</p>
        ) : (
          <Select value={form.pacienteId} onChange={(e) => setForm((f) => ({ ...f, pacienteId: e.target.value }))}>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {/* Itens */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Itens / procedimentos</span>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 cursor-pointer"
          >
            <Plus size={14} /> Adicionar item
          </button>
        </div>
        <div className="space-y-2">
          {form.itens.map((it, idx) => (
            <div key={idx} className="flex items-end gap-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2">
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-medium text-slate-400">Descrição</label>
                <Input
                  value={it.descricao}
                  onChange={(e) => setItem(idx, { descricao: e.target.value })}
                  placeholder="Ex.: Restauração em resina"
                />
              </div>
              <div className="w-14">
                <label className="mb-1 block text-[11px] font-medium text-slate-400">Dente</label>
                <Input
                  value={it.dente ?? ''}
                  onChange={(e) => setItem(idx, { dente: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="—"
                />
              </div>
              <div className="w-14">
                <label className="mb-1 block text-[11px] font-medium text-slate-400">Qtd</label>
                <Input
                  type="number"
                  min={1}
                  value={it.quantidade}
                  onChange={(e) => setItem(idx, { quantidade: Math.max(1, Number(e.target.value)) })}
                />
              </div>
              <div className="w-24">
                <label className="mb-1 block text-[11px] font-medium text-slate-400">Valor un.</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={it.valorUnitario || ''}
                  onChange={(e) => setItem(idx, { valorUnitario: Number(e.target.value) })}
                  placeholder="0,00"
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                disabled={form.itens.length === 1}
                className="mb-1.5 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                aria-label="Remover item"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Desconto (R$)">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={form.desconto || ''}
            onChange={(e) => setForm((f) => ({ ...f, desconto: Number(e.target.value) }))}
            placeholder="0,00"
          />
        </Field>
        <Field label="Situação">
          <Select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as OrcamentoStatus }))}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORCAMENTO_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Observação">
        <Textarea
          value={form.observacao}
          onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
          placeholder="Condições de pagamento, parcelamento…"
        />
      </Field>

      <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
        <span className="text-sm font-medium text-brand-700">Total do orçamento</span>
        <span className="text-lg font-bold text-brand-700">{formatBRL(total)}</span>
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={patients.length === 0}>
          {initial ? 'Salvar alterações' : 'Criar orçamento'}
        </Button>
      </div>
    </form>
  )
}
