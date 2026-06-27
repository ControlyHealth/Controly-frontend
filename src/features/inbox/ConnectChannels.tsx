import { useState } from 'react'
import { Check, Plug, X } from 'lucide-react'
import type { ChannelConnection, MessageChannel } from '@/types'
import { inboxService } from '@/services/inbox'
import { CHANNELS, CHANNEL_ORDER } from './channels'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'

/** Placeholder do campo "conta" por canal. */
const CONTA_PLACEHOLDER: Record<MessageChannel, string> = {
  whatsapp: '+55 11 90000-0000',
  instagram: '@suaclinica',
  facebook: 'Página da clínica',
}

export function ConnectChannels({ onChange }: { onChange: () => void }) {
  const [connections, setConnections] = useState<ChannelConnection[]>(() =>
    inboxService.connections(),
  )
  const [openCanal, setOpenCanal] = useState<MessageChannel | null>(null)
  const [conta, setConta] = useState('')

  function refresh() {
    setConnections(inboxService.connections())
    onChange()
  }

  function statusOf(canal: MessageChannel): ChannelConnection | undefined {
    return connections.find((c) => c.canal === canal)
  }

  function handleConnect(canal: MessageChannel) {
    const valor = conta.trim() || CONTA_PLACEHOLDER[canal]
    inboxService.connect(canal, valor)
    setOpenCanal(null)
    setConta('')
    refresh()
  }

  function handleDisconnect(canal: MessageChannel) {
    inboxService.disconnect(canal)
    refresh()
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Conecte as redes da clínica para receber todas as mensagens em um só lugar — sem
        ficar abrindo Instagram, Facebook e WhatsApp separados.
      </p>

      {CHANNEL_ORDER.map((canal) => {
        const meta = CHANNELS[canal]
        const conn = statusOf(canal)
        const conectado = conn?.status === 'conectado'
        const Icon = meta.icon
        const abrindo = openCanal === canal

        return (
          <div key={canal} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${meta.avatar}`}>
                  <Icon size={18} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">{meta.label}</p>
                    {conectado ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        <Check size={12} /> Conectado
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        Não conectado
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {conectado ? conn?.conta : meta.descricao}
                  </p>
                </div>
              </div>

              {conectado ? (
                <Button variant="ghost" size="sm" onClick={() => handleDisconnect(canal)}>
                  <X size={15} /> Desconectar
                </Button>
              ) : (
                <Button
                  variant={abrindo ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => {
                    setOpenCanal(abrindo ? null : canal)
                    setConta('')
                  }}
                >
                  <Plug size={15} /> {abrindo ? 'Cancelar' : 'Conectar'}
                </Button>
              )}
            </div>

            {abrindo && !conectado && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Como conectar
                </p>
                <ol className="mb-3 list-decimal space-y-1 pl-4 text-sm text-slate-600">
                  {meta.comoConectar.map((passo, i) => (
                    <li key={i}>{passo}</li>
                  ))}
                </ol>
                <Field label="Conta / identificador">
                  <Input
                    placeholder={CONTA_PLACEHOLDER[canal]}
                    value={conta}
                    onChange={(e) => setConta(e.target.value)}
                  />
                </Field>
                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={() => handleConnect(canal)}>
                    <Check size={15} /> Concluir conexão
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
