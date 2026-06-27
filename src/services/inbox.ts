import type {
  ChannelConnection,
  Conversation,
  Message,
  MessageChannel,
} from '@/types'
import { readStore, writeStore } from '@/lib/storage'
import { uid } from '@/lib/id'

const CONNECTIONS_KEY = 'inbox:connections'
const CONVERSATIONS_KEY = 'inbox:conversations'
const MESSAGES_KEY = 'inbox:messages'

/** ---------- Conexões de canais ---------- */

const DEFAULT_CONNECTIONS: ChannelConnection[] = [
  { canal: 'whatsapp', status: 'desconectado', atualizadoEm: new Date().toISOString() },
  { canal: 'instagram', status: 'desconectado', atualizadoEm: new Date().toISOString() },
  { canal: 'facebook', status: 'desconectado', atualizadoEm: new Date().toISOString() },
]

function loadConnections(): ChannelConnection[] {
  const stored = readStore<ChannelConnection[]>(CONNECTIONS_KEY, [])
  if (stored.length === 0) {
    writeStore(CONNECTIONS_KEY, DEFAULT_CONNECTIONS)
    return DEFAULT_CONNECTIONS
  }
  return stored
}

/** ---------- Conversas e mensagens ---------- */

function loadConversations(): Conversation[] {
  return readStore<Conversation[]>(CONVERSATIONS_KEY, [])
}

function persistConversations(list: Conversation[]): void {
  writeStore(CONVERSATIONS_KEY, list)
}

function loadMessages(): Message[] {
  return readStore<Message[]>(MESSAGES_KEY, [])
}

function persistMessages(list: Message[]): void {
  writeStore(MESSAGES_KEY, list)
}

export const inboxService = {
  /** ----- Conexões ----- */
  connections(): ChannelConnection[] {
    return loadConnections()
  },
  connection(canal: MessageChannel): ChannelConnection | undefined {
    return loadConnections().find((c) => c.canal === canal)
  },
  connect(canal: MessageChannel, conta: string): ChannelConnection {
    const list = loadConnections()
    const now = new Date().toISOString()
    const idx = list.findIndex((c) => c.canal === canal)
    const updated: ChannelConnection = {
      canal,
      status: 'conectado',
      conta,
      conectadoEm: now,
      atualizadoEm: now,
    }
    if (idx === -1) list.push(updated)
    else list[idx] = updated
    writeStore(CONNECTIONS_KEY, list)
    return updated
  },
  disconnect(canal: MessageChannel): void {
    const list = loadConnections()
    const idx = list.findIndex((c) => c.canal === canal)
    if (idx === -1) return
    list[idx] = {
      canal,
      status: 'desconectado',
      conta: undefined,
      conectadoEm: undefined,
      atualizadoEm: new Date().toISOString(),
    }
    writeStore(CONNECTIONS_KEY, list)
  },

  /** ----- Conversas ----- */
  conversations(canal?: MessageChannel): Conversation[] {
    const list = loadConversations().sort(
      (a, b) => +new Date(b.ultimaMensagemEm) - +new Date(a.ultimaMensagemEm),
    )
    return canal ? list.filter((c) => c.canal === canal) : list
  },
  unreadTotal(): number {
    return loadConversations().reduce((sum, c) => sum + c.naoLidas, 0)
  },
  messages(conversaId: string): Message[] {
    return loadMessages()
      .filter((m) => m.conversaId === conversaId)
      .sort((a, b) => +new Date(a.criadoEm) - +new Date(b.criadoEm))
  },
  markRead(conversaId: string): void {
    const list = loadConversations()
    const idx = list.findIndex((c) => c.id === conversaId)
    if (idx === -1 || list[idx].naoLidas === 0) return
    list[idx] = { ...list[idx], naoLidas: 0, atualizadoEm: new Date().toISOString() }
    persistConversations(list)
  },
  /** Responde uma conversa (mensagem enviada pela clínica). */
  reply(conversaId: string, texto: string, autor = 'Você'): Message {
    const now = new Date().toISOString()
    const msg: Message = { id: uid(), conversaId, direcao: 'enviada', texto, autor, criadoEm: now }
    persistMessages([...loadMessages(), msg])

    const convs = loadConversations()
    const idx = convs.findIndex((c) => c.id === conversaId)
    if (idx !== -1) {
      convs[idx] = {
        ...convs[idx],
        ultimaMensagem: texto,
        ultimaMensagemEm: now,
        naoLidas: 0,
        atualizadoEm: now,
      }
      persistConversations(convs)
    }
    return msg
  },
}
