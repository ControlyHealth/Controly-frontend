import type { Transaction, Orcamento } from '@/types'
import { readStore, writeStore } from '@/lib/storage'
import { uid } from '@/lib/id'

const TKEY = 'transactions'
const OKEY = 'orcamentos'

// ---------- Lançamentos ----------
function loadT(): Transaction[] {
  return readStore<Transaction[]>(TKEY, [])
}
function persistT(list: Transaction[]): void {
  writeStore(TKEY, list)
}

export type TransactionInput = Omit<Transaction, 'id' | 'criadoEm' | 'atualizadoEm'>

export const financeService = {
  list(): Transaction[] {
    return loadT().sort((a, b) => b.data.localeCompare(a.data))
  },
  create(input: TransactionInput): Transaction {
    const now = new Date().toISOString()
    const t: Transaction = { ...input, id: uid(), criadoEm: now, atualizadoEm: now }
    persistT([t, ...loadT()])
    return t
  },
  update(id: string, input: TransactionInput): Transaction | undefined {
    const list = loadT()
    const idx = list.findIndex((t) => t.id === id)
    if (idx === -1) return undefined
    const updated: Transaction = { ...list[idx], ...input, atualizadoEm: new Date().toISOString() }
    list[idx] = updated
    persistT(list)
    return updated
  },
  setStatus(id: string, status: Transaction['status']): void {
    const list = loadT()
    const idx = list.findIndex((t) => t.id === id)
    if (idx === -1) return
    list[idx] = { ...list[idx], status, atualizadoEm: new Date().toISOString() }
    persistT(list)
  },
  remove(id: string): void {
    persistT(loadT().filter((t) => t.id !== id))
  },
  /** Receitas ainda não recebidas (contas a receber). */
  receivables(): Transaction[] {
    return loadT()
      .filter((t) => t.tipo === 'receita' && t.status === 'pendente')
      .sort((a, b) => (a.vencimento ?? a.data).localeCompare(b.vencimento ?? b.data))
  },
  /** Totais consolidados. */
  summary() {
    const list = loadT()
    let recebido = 0
    let aReceber = 0
    let despesasPagas = 0
    let despesasPendentes = 0
    for (const t of list) {
      if (t.tipo === 'receita') {
        if (t.status === 'pago') recebido += t.valor
        else aReceber += t.valor
      } else {
        if (t.status === 'pago') despesasPagas += t.valor
        else despesasPendentes += t.valor
      }
    }
    return {
      recebido,
      aReceber,
      despesasPagas,
      despesasPendentes,
      saldo: recebido - despesasPagas,
    }
  },
}

// ---------- Orçamentos ----------
function loadO(): Orcamento[] {
  return readStore<Orcamento[]>(OKEY, [])
}
function persistO(list: Orcamento[]): void {
  writeStore(OKEY, list)
}

export type OrcamentoInput = Omit<Orcamento, 'id' | 'criadoEm' | 'atualizadoEm'>

export function orcamentoTotal(o: Pick<Orcamento, 'itens' | 'desconto'>): number {
  const bruto = o.itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0)
  return Math.max(0, bruto - (o.desconto ?? 0))
}

export const orcamentosService = {
  list(): Orcamento[] {
    return loadO().sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  },
  get(id: string): Orcamento | undefined {
    return loadO().find((o) => o.id === id)
  },
  listByPatient(pacienteId: string): Orcamento[] {
    return loadO().filter((o) => o.pacienteId === pacienteId)
  },
  create(input: OrcamentoInput): Orcamento {
    const now = new Date().toISOString()
    const o: Orcamento = { ...input, id: uid(), criadoEm: now, atualizadoEm: now }
    persistO([o, ...loadO()])
    return o
  },
  update(id: string, input: OrcamentoInput): Orcamento | undefined {
    const list = loadO()
    const idx = list.findIndex((o) => o.id === id)
    if (idx === -1) return undefined
    const updated: Orcamento = { ...list[idx], ...input, atualizadoEm: new Date().toISOString() }
    list[idx] = updated
    persistO(list)
    return updated
  },
  remove(id: string): void {
    persistO(loadO().filter((o) => o.id !== id))
  },
  setStatus(id: string, status: Orcamento['status']): void {
    const list = loadO()
    const idx = list.findIndex((o) => o.id === id)
    if (idx === -1) return
    list[idx] = { ...list[idx], status, atualizadoEm: new Date().toISOString() }
    persistO(list)
  },
  /**
   * Aprova o orçamento e gera uma receita pendente (conta a receber) vinculada,
   * caso ainda não exista lançamento para este orçamento.
   */
  approve(id: string): void {
    const orc = orcamentosService.get(id)
    if (!orc) return
    orcamentosService.setStatus(id, 'aprovado')
    const jaExiste = financeService.list().some((t) => t.orcamentoId === id)
    if (jaExiste) return
    const hoje = new Date().toISOString().slice(0, 10)
    financeService.create({
      tipo: 'receita',
      descricao: `Plano de tratamento (${orc.itens.length} ${orc.itens.length === 1 ? 'item' : 'itens'})`,
      valor: orcamentoTotal(orc),
      categoria: 'procedimento',
      status: 'pendente',
      data: hoje,
      vencimento: hoje,
      pacienteId: orc.pacienteId,
      orcamentoId: orc.id,
    })
  },
}
