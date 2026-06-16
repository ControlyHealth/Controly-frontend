import { useState } from 'react'
import type { Transaction, TransactionType, FinanceCategory, PaymentMethod } from '@/types'
import type { TransactionInput } from '@/services/finance'
import { patientsService } from '@/services/patients'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const CATEGORY_LABEL: Record<FinanceCategory, string> = {
  procedimento: 'Procedimento',
  produto: 'Produto / Venda',
  material: 'Material',
  salario: 'Salário',
  aluguel: 'Aluguel',
  equipamento: 'Equipamento',
  imposto: 'Imposto / Taxa',
  marketing: 'Marketing',
  outro: 'Outro',
}

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  cartao_credito: 'Cartão de crédito',
  cartao_debito: 'Cartão de débito',
  transferencia: 'Transferência',
  boleto: 'Boleto',
  convenio: 'Convênio',
}

const CATEGORIES = Object.keys(CATEGORY_LABEL) as FinanceCategory[]
const METHODS = Object.keys(METHOD_LABEL) as PaymentMethod[]

export function TransactionForm({
  initial,
  defaultType = 'receita',
  onSubmit,
  onCancel,
}: {
  initial?: Transaction
  defaultType?: TransactionType
  onSubmit: (data: TransactionInput) => void
  onCancel: () => void
}) {
  const patients = patientsService.list()
  const hoje = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState<TransactionInput>({
    tipo: initial?.tipo ?? defaultType,
    descricao: initial?.descricao ?? '',
    valor: initial?.valor ?? 0,
    categoria: initial?.categoria ?? (defaultType === 'despesa' ? 'material' : 'procedimento'),
    status: initial?.status ?? 'pago',
    metodo: initial?.metodo,
    data: initial?.data ?? hoje,
    vencimento: initial?.vencimento ?? '',
    pacienteId: initial?.pacienteId ?? '',
    observacao: initial?.observacao ?? '',
  })
  const [erro, setErro] = useState<string | null>(null)

  function set<K extends keyof TransactionInput>(key: K, value: TransactionInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.descricao.trim()) return setErro('Informe uma descrição.')
    if (!form.valor || form.valor <= 0) return setErro('Informe um valor maior que zero.')
    onSubmit({
      ...form,
      descricao: form.descricao.trim(),
      pacienteId: form.pacienteId || undefined,
      vencimento: form.status === 'pendente' ? form.vencimento || undefined : undefined,
      metodo: form.status === 'pago' ? form.metodo : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(['receita', 'despesa'] as TransactionType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => set('tipo', t)}
            className={
              'h-10 rounded-lg border text-sm font-medium transition cursor-pointer ' +
              (form.tipo === t
                ? t === 'receita'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-red-300 bg-red-50 text-red-700'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')
            }
          >
            {t === 'receita' ? 'Receita' : 'Despesa'}
          </button>
        ))}
      </div>

      <Field label="Descrição *">
        <Input
          value={form.descricao}
          onChange={(e) => set('descricao', e.target.value)}
          placeholder="Ex.: Restauração, aluguel, compra de material…"
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Valor (R$) *">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={form.valor || ''}
            onChange={(e) => set('valor', Number(e.target.value))}
            placeholder="0,00"
          />
        </Field>
        <Field label="Categoria">
          <Select value={form.categoria} onChange={(e) => set('categoria', e.target.value as FinanceCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Situação">
          <Select value={form.status} onChange={(e) => set('status', e.target.value as Transaction['status'])}>
            <option value="pago">{form.tipo === 'receita' ? 'Recebido' : 'Pago'}</option>
            <option value="pendente">Pendente</option>
          </Select>
        </Field>
        {form.status === 'pago' ? (
          <Field label="Forma de pagamento">
            <Select
              value={form.metodo ?? ''}
              onChange={(e) => set('metodo', (e.target.value || undefined) as PaymentMethod | undefined)}
            >
              <option value="">—</option>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABEL[m]}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="Vencimento">
            <Input type="date" value={form.vencimento} onChange={(e) => set('vencimento', e.target.value)} />
          </Field>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Data">
          <Input type="date" value={form.data} onChange={(e) => set('data', e.target.value)} />
        </Field>
        <Field label="Paciente (opcional)">
          <Select value={form.pacienteId} onChange={(e) => set('pacienteId', e.target.value)}>
            <option value="">Nenhum</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Observação">
        <Textarea
          value={form.observacao}
          onChange={(e) => set('observacao', e.target.value)}
          placeholder="Detalhes do lançamento…"
        />
      </Field>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{initial ? 'Salvar alterações' : 'Adicionar lançamento'}</Button>
      </div>
    </form>
  )
}
