import { useMemo, useState, type ReactNode } from 'react'
import { Inbox, Plug, Send, MessagesSquare, ChevronLeft } from 'lucide-react'
import type { Conversation, MessageChannel } from '@/types'
import { inboxService } from '@/services/inbox'
import { CHANNELS, CHANNEL_ORDER } from './channels'
import { ConnectChannels } from './ConnectChannels'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { initials } from '@/lib/format'

type Filtro = 'todos' | MessageChannel

/** Hora curta (HH:MM) ou data, conforme o dia. */
function horaCurta(iso: string): string {
  const d = new Date(iso)
  const hoje = new Date()
  const mesmoDia = d.toDateString() === hoje.toDateString()
  return mesmoDia
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function ChannelDot({ canal }: { canal: MessageChannel }) {
  const meta = CHANNELS[canal]
  const Icon = meta.icon
  return (
    <span
      className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white ${meta.dot} ring-2 ring-white`}
    >
      <Icon size={9} />
    </span>
  )
}

export function InboxPage() {
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [connectOpen, setConnectOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [version, setVersion] = useState(0) // força re-leitura do service

  const conversas = useMemo<Conversation[]>(
    () => inboxService.conversations(filtro === 'todos' ? undefined : filtro),
    [filtro, version],
  )

  const conexoes = useMemo(() => inboxService.connections(), [version, connectOpen])
  const algumConectado = conexoes.some((c) => c.status === 'conectado')

  const selecionada = conversas.find((c) => c.id === selectedId) ?? null
  const mensagens = useMemo(
    () => (selecionada ? inboxService.messages(selecionada.id) : []),
    [selecionada, version],
  )

  function refresh() {
    setVersion((v) => v + 1)
  }

  function abrirConversa(c: Conversation) {
    setSelectedId(c.id)
    if (c.naoLidas > 0) {
      inboxService.markRead(c.id)
      refresh()
    }
  }

  function enviar() {
    if (!selecionada || !draft.trim()) return
    inboxService.reply(selecionada.id, draft.trim())
    setDraft('')
    refresh()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Mensagens</h2>
          <p className="text-sm text-slate-500">
            Caixa de entrada única para WhatsApp, Instagram e Facebook da clínica.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setConnectOpen(true)}>
          <Plug size={16} /> Conectar canais
        </Button>
      </div>

      {!algumConectado && (
        <Card className="flex flex-col gap-3 border-brand-100 bg-brand-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <MessagesSquare className="mt-0.5 shrink-0 text-brand-600" size={20} />
            <p className="text-sm text-brand-800">
              Conecte as redes da clínica para parar de abrir um app de cada vez. Tudo chega aqui,
              num lugar só.
            </p>
          </div>
          <Button size="sm" onClick={() => setConnectOpen(true)}>
            <Plug size={15} /> Conectar agora
          </Button>
        </Card>
      )}

      {/* Filtros por canal */}
      <div className="flex flex-wrap gap-2">
        <FiltroBtn ativo={filtro === 'todos'} onClick={() => setFiltro('todos')}>
          Todos
        </FiltroBtn>
        {CHANNEL_ORDER.map((canal) => {
          const meta = CHANNELS[canal]
          const Icon = meta.icon
          return (
            <FiltroBtn key={canal} ativo={filtro === canal} onClick={() => setFiltro(canal)}>
              <Icon size={14} /> {meta.label}
            </FiltroBtn>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        {/* Lista de conversas (no mobile é ocultada quando há conversa aberta) */}
        <Card className={'overflow-hidden' + (selecionada ? ' hidden lg:block' : '')}>
          {conversas.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Inbox size={36} />}
                title="Nenhuma conversa"
                description="Quando os contatos enviarem mensagens pelos canais conectados, elas aparecem aqui."
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {conversas.map((c) => {
                const meta = CHANNELS[c.canal]
                const ativa = c.id === selectedId
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => abrirConversa(c)}
                      className={
                        'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors cursor-pointer ' +
                        (ativa ? 'bg-brand-50' : 'hover:bg-slate-50')
                      }
                    >
                      <span className="relative shrink-0">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {initials(c.contato.replace('@', ''))}
                        </span>
                        <ChannelDot canal={c.canal} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-slate-800">
                            {c.contato}
                          </span>
                          <span className="shrink-0 text-xs text-slate-400">
                            {horaCurta(c.ultimaMensagemEm)}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-slate-500">{c.ultimaMensagem}</span>
                          {c.naoLidas > 0 && (
                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">
                              {c.naoLidas}
                            </span>
                          )}
                        </span>
                        <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <meta.icon size={11} /> {meta.label}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Thread da conversa (no mobile some enquanto nada está selecionado) */}
        <Card className={'min-h-[420px] flex-col' + (selecionada ? ' flex' : ' hidden lg:flex')}>
          {!selecionada ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                icon={<MessagesSquare size={36} />}
                title="Selecione uma conversa"
                description="Escolha um contato à esquerda para ver e responder as mensagens."
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="-ml-1 rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 cursor-pointer lg:hidden"
                  aria-label="Voltar para conversas"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="relative shrink-0">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {initials(selecionada.contato.replace('@', ''))}
                  </span>
                  <ChannelDot canal={selecionada.canal} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{selecionada.contato}</p>
                  <p className="text-xs text-slate-400">via {CHANNELS[selecionada.canal].label}</p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-4">
                {mensagens.map((m) => {
                  const enviada = m.direcao === 'enviada'
                  return (
                    <div key={m.id} className={'flex ' + (enviada ? 'justify-end' : 'justify-start')}>
                      <div
                        className={
                          'max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ' +
                          (enviada
                            ? 'rounded-br-sm bg-brand-600 text-white'
                            : 'rounded-bl-sm bg-white text-slate-700')
                        }
                      >
                        <p>{m.texto}</p>
                        <p className={'mt-1 text-[10px] ' + (enviada ? 'text-brand-100' : 'text-slate-400')}>
                          {horaCurta(m.criadoEm)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      enviar()
                    }
                  }}
                  placeholder={`Responder ${selecionada.contato}...`}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <Button onClick={enviar} disabled={!draft.trim()}>
                  <Send size={16} /> Enviar
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      <Modal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        title="Conectar redes sociais"
        width="max-w-xl"
      >
        <ConnectChannels onChange={refresh} />
      </Modal>
    </div>
  )
}

function FiltroBtn({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ' +
        (ativo
          ? 'bg-brand-600 text-white'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50')
      }
    >
      {children}
    </button>
  )
}
