import type { StockItem } from '@/types'
import { readStore, writeStore } from '@/lib/storage'
import { uid } from '@/lib/id'
import { SEED_STOCK } from '@/data/seed'

const KEY = 'stock'

function load(): StockItem[] {
  return readStore<StockItem[]>(KEY, SEED_STOCK)
}

function persist(list: StockItem[]): void {
  writeStore(KEY, list)
}

export type StockInput = Omit<StockItem, 'id' | 'criadoEm' | 'atualizadoEm'>

export const stockService = {
  list(): StockItem[] {
    return load().sort((a, b) => a.nome.localeCompare(b.nome))
  },
  get(id: string): StockItem | undefined {
    return load().find((i) => i.id === id)
  },
  lowStock(): StockItem[] {
    return load().filter((i) => i.quantidade <= i.minimo)
  },
  create(input: StockInput): StockItem {
    const now = new Date().toISOString()
    const item: StockItem = { ...input, id: uid(), criadoEm: now, atualizadoEm: now }
    persist([item, ...load()])
    return item
  },
  update(id: string, input: StockInput): StockItem | undefined {
    const list = load()
    const idx = list.findIndex((i) => i.id === id)
    if (idx === -1) return undefined
    const updated: StockItem = { ...list[idx], ...input, atualizadoEm: new Date().toISOString() }
    list[idx] = updated
    persist(list)
    return updated
  },
  /** Ajuste rápido de quantidade (+/-), nunca abaixo de zero. */
  adjust(id: string, delta: number): StockItem | undefined {
    const list = load()
    const idx = list.findIndex((i) => i.id === id)
    if (idx === -1) return undefined
    list[idx] = {
      ...list[idx],
      quantidade: Math.max(0, list[idx].quantidade + delta),
      atualizadoEm: new Date().toISOString(),
    }
    persist(list)
    return list[idx]
  },
  remove(id: string): void {
    persist(load().filter((i) => i.id !== id))
  },
}
