import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Inbox,
  Plug,
  Send,
  MessagesSquare,
  ChevronLeft,
  Coins,
  Cake,
  CalendarClock,
  CircleDollarSign,
  Smile,
  ClipboardList,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  History,
  AlertTriangle,
} from 'lucide-react'
import type { Conversation, MessageChannel } from '@/types'
import { inboxService } from '@/services/inbox'
import { creditsService, CREDIT_PACKS, type CreditBalance } from '@/services/credits'
import {
  campaignsService,
  CAMPAIGN_TEMPLATES,
  type CampaignId,
} from '@/services/campaigns'
import { anunciar } from '@/services/notifications'
import { CHANNELS, CHANNEL_ORDER } from './channels'
import { ConnectChannels } from './ConnectChannels'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { initials, formatBRL } from '@/lib/format'
import { cn } from '@/lib/cn'

type Filtro = 'todos' | MessageChannel
type Aba = 'conversas' | 'campanhas' | 'historico'
type SubHistorico = 'enviadas' | 'erros' | 'estatisticas'

const CAMPAIGN_ICON: Record<CampaignId, typeof Cake> = {
  aniversariantes: Cake,
  retorno_semestral: CalendarClock,
  inadimplentes: CircleDollarSign,
  troca_alinhadores: Smile,
  pesquisa_satisfacao: ClipboardList,
}

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
  const [aba, setAba] = useState<Aba>('conversas')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [connectOpen, setConnectOpen] = useState(false)
  const [creditosOpen, setCreditosOpen] = useState(false)
  const [subHistorico, setSubHistorico] = useState<SubHistorico>('enviadas')
  const [draft, setDraft] = useState('')
  const [version, setVersion] = useState(0) // força re-leitura dos services

  const conversas = useMemo<Conversation[]>(
    () => inboxService.conversations(filtro === 'todos' ? undefined : filtro),
    [filtro, version],
  )

  const conexoes = useMemo(() => inboxService.connections(), [version, connectOpen])
  const algumConectado = conexoes.some((c) => c.status === 'conectado')

  const saldo = useMemo<CreditBalance>(() => creditsService.balance(), [version])
  const ativas = useMemo(() => campaignsService.ativas(), [version])
  const envios = useMemo(() => campaignsService.envios(), [version])

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

  function toggleCampanha(id: CampaignId, nome: string) {
    const ficouAtiva = campaignsService.toggle(id)
    anunciar('automacao', ficouAtiva ? 'Campanha ativada.' : 'Campanha desativada.', nome)
    refresh()
  }

  const enviadas = envios.filter((e) => e.status === 'enviada')
  const comErro = envios.filter((e) => e.status === 'erro')

  return (
    <div className="space-y-5">
      {/* ----- cabeçalho: título + saldo + ações ----- */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Central de mensagens</h2>
          <p className="text-sm text-slate-500">
            Conversas, campanhas automáticas e histórico de envio em um lugar só.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* saldo de créditos */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
            <span className="text-slate-400">Saldo restante</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> {saldo.marketing} Marketing
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> {saldo.confirmacoes} Confirmações
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky-500" /> {saldo.sms} SMS
            </span>
          </div>
          <Button size="sm" onClick={() => setCreditosOpen(true)}>
            <Coins size={15} /> Comprar mais
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setConnectOpen(true)}>
            <Plug size={15} /> Conectar canais
          </Button>
        </div>
      </div>

      {/* ----- abas ----- */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {(
          [
            ['conversas', 'Mensagens'],
            ['campanhas', 'Campanhas automáticas'],
            ['historico', 'Histórico de envio'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={cn(
              'whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition cursor-pointer',
              aba === id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ================= aba: Conversas ================= */}
      {aba === 'conversas' && (
        <>
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
        </>
      )}

      {/* ================= aba: Campanhas automáticas ================= */}
      {aba === 'campanhas' && (
        <>
          {!algumConectado && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Info size={17} className="mt-0.5 shrink-0" />
              <p>
                <strong>Aviso importante!</strong> As campanhas só começam a ser enviadas depois que o
                WhatsApp da clínica estiver conectado.{' '}
                <button
                  type="button"
                  onClick={() => setConnectOpen(true)}
                  className="font-semibold underline underline-offset-2 cursor-pointer"
                >
                  Conectar agora
                </button>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAMPAIGN_TEMPLATES.map((c) => {
              const Icon = CAMPAIGN_ICON[c.id]
              const ativa = ativas.includes(c.id)
              return (
                <Card key={c.id} className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon size={22} strokeWidth={1.8} />
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        c.credito === 'marketing'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-sky-50 text-sky-700',
                      )}
                    >
                      {c.credito === 'marketing' ? 'Marketing' : 'Confirmações'}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-800">{c.nome}</h3>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">{c.descricao}</p>
                  <p className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-500">
                    “{c.mensagem}”
                  </p>
                  <Button
                    variant={ativa ? 'secondary' : 'primary'}
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => toggleCampanha(c.id, c.nome)}
                  >
                    {ativa ? (
                      <>
                        <CheckCircle2 size={15} className="text-emerald-600" /> Ativa — desativar
                      </>
                    ) : (
                      'Ativar'
                    )}
                  </Button>
                </Card>
              )
            })}

            {/* personalizada → automações completas */}
            <Card className="flex flex-col border-dashed p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <SlidersHorizontal size={22} strokeWidth={1.8} />
              </span>
              <h3 className="mt-3 font-semibold text-slate-800">Personalizada</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">
                Crie uma campanha para um público específico, escolhendo gatilho e mensagem do zero.
              </p>
              <Link to="/automacoes" className="mt-4">
                <Button variant="secondary" size="sm" className="w-full">
                  Adicionar
                </Button>
              </Link>
            </Card>
          </div>
        </>
      )}

      {/* ================= aba: Histórico de envio ================= */}
      {aba === 'historico' && (
        <>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['enviadas', 'Campanhas enviadas'],
                ['erros', 'Erros ao enviar'],
                ['estatisticas', 'Estatísticas de uso'],
              ] as const
            ).map(([id, label]) => (
              <FiltroBtn key={id} ativo={subHistorico === id} onClick={() => setSubHistorico(id)}>
                {label}
              </FiltroBtn>
            ))}
          </div>

          {subHistorico === 'estatisticas' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(
                [
                  [Send, 'Mensagens enviadas', enviadas.length],
                  [AlertTriangle, 'Erros de envio', comErro.length],
                  [History, 'Campanhas ativas', ativas.length],
                ] as const
              ).map(([Icon, label, valor]) => (
                <Card key={label} className="flex items-center gap-3 p-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon size={20} />
                  </span>
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-slate-800">{valor}</p>
                    <p className="text-sm text-slate-500">{label}</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            (() => {
              const lista = subHistorico === 'enviadas' ? enviadas : comErro
              if (lista.length === 0) {
                return (
                  <EmptyState
                    icon={subHistorico === 'enviadas' ? <Send size={36} /> : <AlertTriangle size={36} />}
                    title={
                      subHistorico === 'enviadas'
                        ? 'Nenhuma mensagem automática foi enviada ainda.'
                        : 'Nenhum erro de envio. Ótimo sinal!'
                    }
                    description={
                      subHistorico === 'enviadas'
                        ? 'Após a ativação das campanhas, pode demorar até 24h para iniciar o envio.'
                        : 'Falhas de entrega (número inválido, sem WhatsApp...) aparecerão aqui.'
                    }
                  />
                )
              }
              return (
                <Card className="divide-y divide-slate-100">
                  {lista.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 p-4">
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                          e.status === 'enviada' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
                        )}
                      >
                        {e.status === 'enviada' ? <Send size={15} /> : <AlertTriangle size={15} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{e.campanhaNome}</p>
                        <p className="truncate text-xs text-slate-500">
                          {e.destinatario}
                          {e.erro ? ` · ${e.erro}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{horaCurta(e.criadoEm)}</span>
                    </div>
                  ))}
                </Card>
              )
            })()
          )}
        </>
      )}

      {/* ----- modais ----- */}
      <Modal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        title="Conectar redes sociais"
        width="max-w-xl"
      >
        <ConnectChannels onChange={refresh} />
      </Modal>

      <Modal
        open={creditosOpen}
        onClose={() => setCreditosOpen(false)}
        title="Comprar créditos de mensagem"
        width="max-w-md"
      >
        <div className="space-y-3">
          {CREDIT_PACKS.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{p.label}</p>
                <p className="text-xs text-slate-400">crédito nunca expira</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  creditsService.add(p.tipo, p.quantidade)
                  anunciar('sistema', 'Créditos adicionados.', p.label)
                  refresh()
                }}
              >
                {formatBRL(p.preco)}
              </Button>
            </div>
          ))}
          <p className="rounded-lg bg-brand-50 px-3 py-2.5 text-xs text-brand-700">
            Ambiente de demonstração — nenhum pagamento real é processado.
          </p>
        </div>
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
