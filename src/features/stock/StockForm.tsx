import { useState } from 'react'
import type { StockItem, StockCategory } from '@/types'
import type { StockInput } from '@/services/stock'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const CATEGORY_LABEL: Record<StockCategory, string> = {
  material: 'Material restaurador',
  instrumental: 'Instrumental',
  ortodontia: 'Ortodontia',
  descartavel: 'Descartável',
  medicamento: 'Medicamento',
  epi: 'EPI',
  outro: 'Outro',
}

const CATEGORIES = Object.keys(CATEGORY_LABEL) as StockCategory[]

export function StockForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: StockItem
  onSubmit: (data: StockInput) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<StockInput>({
    nome: initial?.nome ?? '',
    categoria: initial?.categoria ?? 'material',
    quantidade: initial?.quantidade ?? 0,
    minimo: initial?.minimo ?? 0,
    unidade: initial?.unidade ?? 'un',
    fornecedor: initial?.fornecedor ?? '',
    validade: initial?.validade ?? '',
    observacao: initial?.observacao ?? '',
  })

  function set<K extends keyof StockInput>(key: K, value: StockInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) return
    onSubmit({ ...form, nome: form.nome.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nome do item *">
        <Input
          value={form.nome}
          onChange={(e) => set('nome', e.target.value)}
          placeholder="Ex.: Luva de procedimento (M)"
          autoFocus
          required
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Categoria">
          <Select value={form.categoria} onChange={(e) => set('categoria', e.target.value as StockCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Unidade">
          <Input
            value={form.unidade}
            onChange={(e) => set('unidade', e.target.value)}
            placeholder="caixa, tubete, un…"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Quantidade atual">
          <Input
            type="number"
            min={0}
            value={form.quantidade}
            onChange={(e) => set('quantidade', Number(e.target.value))}
          />
        </Field>
        <Field label="Estoque mínimo" hint="Abaixo disso o item é marcado como baixo.">
          <Input
            type="number"
            min={0}
            value={form.minimo}
            onChange={(e) => set('minimo', Number(e.target.value))}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Fornecedor">
          <Input
            value={form.fornecedor}
            onChange={(e) => set('fornecedor', e.target.value)}
            placeholder="Opcional"
          />
        </Field>
        <Field label="Validade">
          <Input type="date" value={form.validade} onChange={(e) => set('validade', e.target.value)} />
        </Field>
      </div>

      <Field label="Observação">
        <Textarea
          value={form.observacao}
          onChange={(e) => set('observacao', e.target.value)}
          placeholder="Lote, marca, especificação…"
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{initial ? 'Salvar alterações' : 'Adicionar item'}</Button>
      </div>
    </form>
  )
}
