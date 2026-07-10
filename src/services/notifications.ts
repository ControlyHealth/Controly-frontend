/**
 * Central de notificações do app.
 *
 * Registra tudo que acontece (cadastros, consultas, estoque, finanças...) de
 * forma persistente (localStorage) e reativa: componentes assinam o store via
 * `subscribe` e re-renderizam quando algo novo chega — mesmo padrão do toast.
 *
 * O helper `anunciar()` cobre o caso comum de "ação importante concluída":
 * grava a notificação E dispara o toast de confirmação de uma vez só.
 */
import { readStore, writeStore } from '@/lib/storage'
import { uid } from '@/lib/id'
import { toast } from '@/lib/toast'

export type NotificationTipo =
  | 'paciente'
  | 'consulta'
  | 'estoque'
  | 'financeiro'
  | 'automacao'
  | 'clinico'
  | 'sistema'

export interface AppNotification {
  id: string
  tipo: NotificationTipo
  titulo: string
  descricao?: string
  criadoEm: string
  lida: boolean
}

const KEY = 'notifications'
const MAX = 100 // mantém apenas as 100 mais recentes

type Listener = (items: AppNotification[]) => void

let cache: AppNotification[] = readStore<AppNotification[]>(KEY, [])
const listeners = new Set<Listener>()

function emit(): void {
  writeStore(KEY, cache)
  for (const l of listeners) l(cache)
}

export const notificationsService = {
  list(): AppNotification[] {
    return cache
  },
  unreadCount(): number {
    return cache.filter((n) => !n.lida).length
  },
  add(tipo: NotificationTipo, titulo: string, descricao?: string): AppNotification {
    const item: AppNotification = {
      id: uid(),
      tipo,
      titulo,
      descricao,
      criadoEm: new Date().toISOString(),
      lida: false,
    }
    cache = [item, ...cache].slice(0, MAX)
    emit()
    return item
  },
  markRead(id: string): void {
    const idx = cache.findIndex((n) => n.id === id && !n.lida)
    if (idx === -1) return
    cache = cache.map((n) => (n.id === id ? { ...n, lida: true } : n))
    emit()
  },
  markAllRead(): void {
    if (!cache.some((n) => !n.lida)) return
    cache = cache.map((n) => ({ ...n, lida: true }))
    emit()
  },
  clear(): void {
    if (cache.length === 0) return
    cache = []
    emit()
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    listener(cache)
    return () => {
      listeners.delete(listener)
    }
  },
}

/**
 * Ação importante concluída: toast de confirmação + registro na central.
 * `descricao` aparece só na central de notificações (detalhe do evento).
 */
export function anunciar(tipo: NotificationTipo, titulo: string, descricao?: string): void {
  notificationsService.add(tipo, titulo, descricao)
  toast.success(titulo)
}

/** Registra na central sem toast (eventos informativos, ex.: alerta de estoque baixo). */
export function registrar(tipo: NotificationTipo, titulo: string, descricao?: string): void {
  notificationsService.add(tipo, titulo, descricao)
}
