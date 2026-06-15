import { useMemo, useState } from 'react'
import { Plus, Search, Package, Trash2, Pencil, Minus, AlertTriangle } from 'lucide-react'
import type { StockItem } from '@/types'
import { stockService, type StockInput } from '@/services/stock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { StockForm, CATEGORY_LABEL } from './StockForm'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'

function isExpiringSoon(validade?: string): boolean {
  if (!validade) return false
  const d = new Date(validade).getTime()
  const in60 = Date.now() + 60 * 24 * 60 * 60 * 1000
  return d <= in60
}

export function StockPage() {
  const [items, setItems] = useState<StockItem[]>(() => stockService.list())
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StockItem | undefined>(undefined)
  const [onlyLow, setOnlyLow] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((i) => {
      if (onlyLow && i.quantidade > i.minimo) return false
      if (!q) return true
      return (
        i.nome.toLowerCase().includes(q) ||
        CATEGORY_LABEL[i.categoria].toLowerCase().includes(q) ||
        i.fornecedor?.toLowerCase().includes(q)
      )
    })
  }, [items, query, onlyLow])

  const lowCount = useMemo(() => items.filter((i) => i.quantidade <= i.minimo).length, [items])

  function refresh() {
    setItems(stockService.list())
  }

  function handleSubmit(data: StockInput) {
    if (editing) stockService.update(editing.id, data)
    else stockService.create(data)
    setModalOpen(false)
    setEditing(undefined)
    refresh()
  }

  function handleDelete(i: StockItem) {
    if (confirm(`Remover "${i.nome}" do estoque?`)) {
      stockService.remove(i.id)
      refresh()
    }
  }

  function adjust(i: StockItem, delta: number) {
    stockService.adjust(i.id, delta)
    refresh()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Estoque</h2>
          <p className="text-sm text-slate-500">{items.length} itens cadastrados</p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined)
            setModalOpen(true)
          }}
        >
          <Plus size={16} /> Novo item
        </Button>
      </div>

      {lowCount > 0 && (
        <button
          type="button"
          onClick={() => setOnlyLow((v) => !v)}
          className={cn(
            'flex w-full items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm transition cursor-pointer',
            onlyLow
              ? 'border-amber-300 bg-amber-100 text-amber-900'
              : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
          )}
        >
          <AlertTriangle size={18} className="shrink-0" />
          <span>
            <strong>{lowCount}</strong> {lowCount === 1 ? 'item está' : 'itens estão'} no nível mínimo
            ou abaixo. {onlyLow ? 'Mostrando apenas estes.' : 'Clique para filtrar.'}
          </span>
        </button>
      )}

      <div className="relative max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, categoria ou fornecedor"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={40} />}
          title={query || onlyLow ? 'Nenhum item encontrado' : 'Estoque vazio'}
          description={
            query || onlyLow ? 'Ajuste a busca ou o filtro.' : 'Cadastre materiais, instrumentais e insumos.'
          }
          action={
            !query &&
            !onlyLow && (
              <Button
                onClick={() => {
                  setEditing(undefined)
                  setModalOpen(true)
                }}
              >
                <Plus size={16} /> Adicionar item
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Validade</th>
                <th className="px-4 py-3 text-center font-medium">Quantidade</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((i) => {
                const low = i.quantidade <= i.minimo
                return (
                  <tr key={i.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{i.nome}</p>
                      <p className="text-xs text-slate-400">
                        {i.fornecedor ? i.fornecedor + ' · ' : ''}mín. {i.minimo} {i.unidade}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{CATEGORY_LABEL[i.categoria]}</td>
                    <td className="px-4 py-3">
                      {i.validade ? (
                        <span
                          className={cn(
                            'text-sm',
                            isExpiringSoon(i.validade) ? 'font-medium text-amber-600' : 'text-slate-600',
                          )}
                        >
                          {formatDate(i.validade)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => adjust(i, -1)}
                          className="rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
                          aria-label="Diminuir"
                        >
                          <Minus size={14} />
                        </button>
                        <Badge
                          className={cn(
                            'min-w-14 justify-center tabular-nums',
                            low ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700',
                          )}
                        >
                          {i.quantidade} {i.unidade}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => adjust(i, 1)}
                          className="rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
                          aria-label="Aumentar"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(i)
                            setModalOpen(true)
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                          aria-label="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(i)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          aria-label="Remover"
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
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(undefined)
        }}
        title={editing ? 'Editar item' : 'Novo item de estoque'}
        width="max-w-xl"
      >
        <StockForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setEditing(undefined)
          }}
        />
      </Modal>
    </div>
  )
}
