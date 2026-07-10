import { useMemo, useState } from 'react'
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  Pencil,
  Trash2,
  Check,
  FileText,
  User,
  CheckCircle2,
} from 'lucide-react'
import type { Transaction, Orcamento, TransactionType } from '@/types'
import {
  financeService,
  orcamentosService,
  orcamentoTotal,
  type TransactionInput,
  type OrcamentoInput,
} from '@/services/finance'
import { patientsService } from '@/services/patients'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { TransactionForm, CATEGORY_LABEL, METHOD_LABEL } from './TransactionForm'
import { OrcamentoForm, ORCAMENTO_STATUS_LABEL } from './OrcamentoForm'
import { formatBRL, formatDate, initials } from '@/lib/format'
import { cn } from '@/lib/cn'
import { anunciar } from '@/services/notifications'

type Tab = 'lancamentos' | 'receber' | 'orcamentos'

const ORC_STATUS_STYLE: Record<string, string> = {
  rascunho: 'bg-slate-100 text-slate-600',
  aprovado: 'bg-emerald-50 text-emerald-700',
  recusado: 'bg-red-50 text-red-700',
  concluido: 'bg-brand-50 text-brand-700',
}

const hoje = new Date().toISOString().slice(0, 10)

export function FinancePage() {
  const [tab, setTab] = useState<Tab>('lancamentos')
  const [version, setVersion] = useState(0)
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | TransactionType>('todos')

  // modais de lançamento
  const [txModal, setTxModal] = useState(false)
  const [txEditing, setTxEditing] = useState<Transaction | undefined>(undefined)
  const [txType, setTxType] = useState<TransactionType>('receita')
  const [txDelete, setTxDelete] = useState<Transaction | undefined>(undefined)

  // modais de orçamento
  const [orcModal, setOrcModal] = useState(false)
  const [orcEditing, setOrcEditing] = useState<Orcamento | undefined>(undefined)
  const [orcDelete, setOrcDelete] = useState<Orcamento | undefined>(undefined)

  const transactions = useMemo(() => financeService.list(), [version])
  const receivables = useMemo(() => financeService.receivables(), [version])
  const orcamentos = useMemo(() => orcamentosService.list(), [version])
  const summary = useMemo(() => financeService.summary(), [version])

  const refresh = () => setVersion((v) => v + 1)
  const nomePaciente = (id?: string) => (id ? patientsService.get(id)?.nome : undefined)

  const filtered = transactions.filter((t) => tipoFiltro === 'todos' || t.tipo === tipoFiltro)
  const totalReceber = receivables.reduce((s, t) => s + t.valor, 0)

  // ---- handlers lançamentos ----
  function openTx(type: TransactionType) {
    setTxEditing(undefined)
    setTxType(type)
    setTxModal(true)
  }
  function submitTx(data: TransactionInput) {
    const editing = !!txEditing
    if (txEditing) financeService.update(txEditing.id, data)
    else financeService.create(data)
    setTxModal(false)
    setTxEditing(undefined)
    refresh()
    anunciar('financeiro', editing ? 'Lançamento atualizado.' : 'Lançamento criado.', `${data.descricao} · ${formatBRL(data.valor)}`)
  }
  function receber(t: Transaction) {
    financeService.setStatus(t.id, 'pago')
    refresh()
    anunciar('financeiro', t.tipo === 'receita' ? 'Recebimento confirmado.' : 'Pagamento confirmado.', `${t.descricao} · ${formatBRL(t.valor)}`)
  }

  // ---- handlers orçamentos ----
  function submitOrc(data: OrcamentoInput) {
    const editing = !!orcEditing
    if (orcEditing) orcamentosService.update(orcEditing.id, data)
    else orcamentosService.create(data)
    setOrcModal(false)
    setOrcEditing(undefined)
    refresh()
    anunciar('financeiro', editing ? 'Orçamento atualizado.' : 'Orçamento criado.', nomePaciente(data.pacienteId))
  }
  function aprovar(o: Orcamento) {
    orcamentosService.approve(o.id)
    refresh()
    anunciar('financeiro', 'Orçamento aprovado.', [nomePaciente(o.pacienteId), formatBRL(orcamentoTotal(o))].filter(Boolean).join(' · '))
  }

  const cards = [
    { label: 'Recebido', value: summary.recebido, icon: TrendingUp, color: 'bg-brand-50 text-brand-600' },
    { label: 'A receber', value: summary.aReceber, icon: Clock, color: 'bg-sky-50 text-sky-600' },
    { label: 'Despesas pagas', value: summary.despesasPagas, icon: TrendingDown, color: 'bg-slate-100 text-slate-500' },
    { label: 'Saldo', value: summary.saldo, icon: Wallet, color: 'bg-brand-600 text-white' },
  ]

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'lancamentos', label: 'Lançamentos', count: transactions.length },
    { id: 'receber', label: 'Contas a receber', count: receivables.length },
    { id: 'orcamentos', label: 'Orçamentos', count: orcamentos.length },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Finanças</h2>
          <p className="text-sm text-slate-500">Lançamentos, contas a receber e orçamentos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => openTx('despesa')}>
            <Plus size={16} /> Despesa
          </Button>
          <Button onClick={() => openTx('receita')}>
            <Plus size={16} /> Receita
          </Button>
        </div>
      </div>

      {/* resumo */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="flex items-center gap-3 p-4">
            <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', color)}>
              <Icon size={20} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-slate-800">{formatBRL(value)}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* abas */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition cursor-pointer',
              tab === t.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {t.label} {t.count !== undefined && <span className="text-slate-400">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* ----- Lançamentos ----- */}
      {tab === 'lancamentos' && (
        <div className="space-y-4">
          <div className="flex gap-1.5">
            {(['todos', 'receita', 'despesa'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTipoFiltro(f)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition cursor-pointer',
                  tipoFiltro === f ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-100',
                )}
              >
                {f === 'todos' ? 'Todos' : f === 'receita' ? 'Receitas' : 'Despesas'}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Wallet size={40} />}
              title="Nenhum lançamento"
              description="Registre receitas e despesas da clínica."
              action={<Button onClick={() => openTx(tipoFiltro === 'despesa' ? 'despesa' : 'receita')}><Plus size={16} /> Novo lançamento</Button>}
            />
          ) : (
            <>
            <Card className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 font-medium">Descrição</th>
                    <th className="px-4 py-3 font-medium">Categoria</th>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 text-right font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Situação</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((t) => {
                    const receita = t.tipo === 'receita'
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{t.descricao}</p>
                          {nomePaciente(t.pacienteId) && (
                            <p className="text-xs text-slate-400">{nomePaciente(t.pacienteId)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{CATEGORY_LABEL[t.categoria]}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(t.data)}</td>
                        <td className={cn('px-4 py-3 text-right font-semibold tabular-nums', receita ? 'text-emerald-600' : 'text-red-600')}>
                          {receita ? '+' : '−'} {formatBRL(t.valor)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                              t.status === 'pago' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                            )}
                          >
                            {t.status === 'pago' ? (receita ? 'Recebido' : 'Pago') : 'Pendente'}
                          </span>
                          {t.metodo && <span className="ml-1.5 text-xs text-slate-400">{METHOD_LABEL[t.metodo]}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {t.status === 'pendente' && (
                              <button
                                type="button"
                                onClick={() => receber(t)}
                                className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-50 cursor-pointer"
                                aria-label="Marcar como pago"
                              >
                                <Check size={15} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => { setTxEditing(t); setTxModal(true) }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                              aria-label="Editar"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setTxDelete(t)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                              aria-label="Excluir"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>

            {/* mobile: cards empilhados no lugar da tabela */}
            <div className="space-y-2 md:hidden">
              {filtered.map((t) => {
                const receita = t.tipo === 'receita'
                return (
                  <Card key={t.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{t.descricao}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {CATEGORY_LABEL[t.categoria]} · {formatDate(t.data)}
                          {nomePaciente(t.pacienteId) ? ` · ${nomePaciente(t.pacienteId)}` : ''}
                        </p>
                      </div>
                      <span className={cn('shrink-0 font-semibold tabular-nums', receita ? 'text-emerald-600' : 'text-red-600')}>
                        {receita ? '+' : '−'} {formatBRL(t.valor)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                          t.status === 'pago' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                        )}
                      >
                        {t.status === 'pago' ? (receita ? 'Recebido' : 'Pago') : 'Pendente'}
                      </span>
                      <div className="flex items-center gap-1">
                        {t.status === 'pendente' && (
                          <button
                            type="button"
                            onClick={() => receber(t)}
                            className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-50 cursor-pointer"
                            aria-label="Marcar como pago"
                          >
                            <Check size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { setTxEditing(t); setTxModal(true) }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                          aria-label="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTxDelete(t)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          aria-label="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
            </>
          )}
        </div>
      )}

      {/* ----- Contas a receber ----- */}
      {tab === 'receber' && (
        <div className="space-y-4">
          {receivables.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={40} />}
              title="Nada a receber"
              description="Não há receitas pendentes no momento."
            />
          ) : (
            <>
              <Card className="flex items-center justify-between p-4">
                <span className="text-sm font-medium text-slate-600">Total a receber</span>
                <span className="text-xl font-bold text-sky-600">{formatBRL(totalReceber)}</span>
              </Card>
              <div className="space-y-2">
                {receivables.map((t) => {
                  const atrasado = t.vencimento && t.vencimento < hoje
                  return (
                    <Card key={t.id} className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                        {nomePaciente(t.pacienteId) ? initials(nomePaciente(t.pacienteId)!) : <User size={16} />}
                      </span>
                      <div className="min-w-[9rem] flex-1 sm:min-w-0">
                        <p className="truncate font-medium text-slate-800">{t.descricao}</p>
                        <p className="text-xs text-slate-400">
                          {nomePaciente(t.pacienteId) ?? 'Sem paciente'}
                          {t.vencimento && (
                            <span className={cn('ml-2', atrasado ? 'font-medium text-red-500' : 'text-slate-400')}>
                              · vence {formatDate(t.vencimento)}{atrasado ? ' (atrasado)' : ''}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold tabular-nums text-slate-800">{formatBRL(t.valor)}</span>
                      <Button size="sm" onClick={() => receber(t)}>
                        <Check size={15} /> Receber
                      </Button>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ----- Orçamentos ----- */}
      {tab === 'orcamentos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setOrcEditing(undefined); setOrcModal(true) }}>
              <Plus size={16} /> Novo orçamento
            </Button>
          </div>
          {orcamentos.length === 0 ? (
            <EmptyState
              icon={<FileText size={40} />}
              title="Nenhum orçamento"
              description="Crie planos de tratamento com valores para seus pacientes."
              action={<Button onClick={() => setOrcModal(true)}><Plus size={16} /> Criar orçamento</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {orcamentos.map((o) => (
                <Card key={o.id} className="flex flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                        {nomePaciente(o.pacienteId) ? initials(nomePaciente(o.pacienteId)!) : <User size={15} />}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800">{nomePaciente(o.pacienteId) ?? 'Paciente removido'}</p>
                        <p className="text-xs text-slate-400">
                          {o.itens.length} {o.itens.length === 1 ? 'item' : 'itens'} · {formatDate(o.criadoEm)}
                        </p>
                      </div>
                    </div>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', ORC_STATUS_STYLE[o.status])}>
                      {ORCAMENTO_STATUS_LABEL[o.status]}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1 text-sm text-slate-600">
                    {o.itens.map((it, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span className="truncate">
                          {it.quantidade}× {it.descricao}
                          {it.dente ? ` (dente ${it.dente})` : ''}
                        </span>
                        <span className="shrink-0 tabular-nums text-slate-500">
                          {formatBRL(it.quantidade * it.valorUnitario)}
                        </span>
                      </li>
                    ))}
                    {o.desconto ? (
                      <li className="flex justify-between gap-2 text-xs text-slate-400">
                        <span>Desconto</span>
                        <span>− {formatBRL(o.desconto)}</span>
                      </li>
                    ) : null}
                  </ul>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-sm font-bold text-slate-800">{formatBRL(orcamentoTotal(o))}</span>
                    <div className="flex items-center gap-1">
                      {o.status === 'rascunho' && (
                        <Button size="sm" onClick={() => aprovar(o)}>
                          <Check size={15} /> Aprovar
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => { setOrcEditing(o); setOrcModal(true) }} aria-label="Editar">
                        <Pencil size={15} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setOrcDelete(o)} aria-label="Excluir">
                        <Trash2 size={15} className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----- Modais ----- */}
      <Modal
        open={txModal}
        onClose={() => { setTxModal(false); setTxEditing(undefined) }}
        title={txEditing ? 'Editar lançamento' : 'Novo lançamento'}
        width="max-w-lg"
      >
        <TransactionForm
          initial={txEditing}
          defaultType={txType}
          onSubmit={submitTx}
          onCancel={() => { setTxModal(false); setTxEditing(undefined) }}
        />
      </Modal>

      <Modal
        open={orcModal}
        onClose={() => { setOrcModal(false); setOrcEditing(undefined) }}
        title={orcEditing ? 'Editar orçamento' : 'Novo orçamento'}
        width="max-w-2xl"
      >
        <OrcamentoForm
          initial={orcEditing}
          onSubmit={submitOrc}
          onCancel={() => { setOrcModal(false); setOrcEditing(undefined) }}
        />
      </Modal>

      <ConfirmDialog
        open={!!txDelete}
        title="Excluir lançamento"
        description={<>Excluir <strong>{txDelete?.descricao}</strong>?</>}
        confirmLabel="Excluir"
        onConfirm={() => { if (txDelete) { financeService.remove(txDelete.id); anunciar('financeiro', 'Lançamento excluído.', txDelete.descricao) } setTxDelete(undefined); refresh() }}
        onClose={() => setTxDelete(undefined)}
      />

      <ConfirmDialog
        open={!!orcDelete}
        title="Excluir orçamento"
        description="Tem certeza que deseja excluir este orçamento?"
        confirmLabel="Excluir"
        onConfirm={() => { if (orcDelete) { orcamentosService.remove(orcDelete.id); anunciar('financeiro', 'Orçamento excluído.', nomePaciente(orcDelete.pacienteId)) } setOrcDelete(undefined); refresh() }}
        onClose={() => setOrcDelete(undefined)}
      />
    </div>
  )
}
