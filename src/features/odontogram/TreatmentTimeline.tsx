import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ImageOff,
  Camera,
  Loader2,
  Film,
} from 'lucide-react'
import type { OdontoSessao } from '@/types'
import { sessionsService, compressImage, type SessaoInput } from '@/services/sessions'
import { patientsService } from '@/services/patients'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ToothView3D } from './ToothView3D'
import { TimelineVideo } from './TimelineVideo'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { anunciar } from '@/services/notifications'

const hoje = () => new Date().toISOString().slice(0, 10)

function contarAlterados(s: OdontoSessao): number {
  return Object.values(s.dentes).filter(
    (d) => d.status !== 'saudavel' && d.status !== 'ausente',
  ).length
}

export function TreatmentTimeline({ pacienteId }: { pacienteId: string }) {
  const [sessoes, setSessoes] = useState<OdontoSessao[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const [confirmDel, setConfirmDel] = useState<OdontoSessao | null>(null)

  const pacienteNome = patientsService.get(pacienteId)?.nome

  // form
  const [data, setData] = useState(hoje())
  const [obs, setObs] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function carregar(selecionarUltima = true) {
    setLoading(true)
    const list = await sessionsService.list(pacienteId)
    setSessoes(list)
    if (selecionarUltima && list.length) setSelectedId(list[list.length - 1].id)
    setLoading(false)
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId])

  const idx = sessoes.findIndex((s) => s.id === selectedId)
  const sel = idx >= 0 ? sessoes[idx] : sessoes[sessoes.length - 1]

  function resetForm() {
    setData(hoje())
    setObs('')
    setFotoFile(null)
    setFotoPreview(null)
  }

  function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFotoFile(f)
    setFotoPreview(f ? URL.createObjectURL(f) : null)
  }

  async function salvar() {
    setSaving(true)
    try {
      const input: SessaoInput = { pacienteId, data, observacao: obs }
      if (fotoFile) input.foto = await compressImage(fotoFile)
      const nova = await sessionsService.create(input)
      anunciar('clinico', 'Sessão de tratamento registrada.', formatDate(data))
      setModalOpen(false)
      resetForm()
      await carregar(false)
      setSelectedId(nova.id)
    } finally {
      setSaving(false)
    }
  }

  async function excluir(s: OdontoSessao) {
    await sessionsService.remove(s.id)
    anunciar('clinico', 'Sessão de tratamento excluída.', formatDate(s.data))
    setConfirmDel(null)
    const restantes = sessoes.filter((x) => x.id !== s.id)
    setSessoes(restantes)
    if (selectedId === s.id) setSelectedId(restantes[restantes.length - 1]?.id ?? null)
  }

  const novaBtn = (
    <Button onClick={() => { resetForm(); setModalOpen(true) }}>
      <Plus size={16} /> Nova sessão
    </Button>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Linha do tempo</h3>
          <p className="text-sm text-slate-500">
            Registre uma foto a cada sessão e acompanhe a evolução do tratamento no holograma.
          </p>
        </div>
        {sessoes.length > 0 && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setVideoOpen(true)}>
              <Film size={16} /> Gerar vídeo
            </Button>
            {novaBtn}
          </div>
        )}
      </div>

      {loading ? (
        <Card className="flex items-center justify-center gap-2 p-10 text-slate-400">
          <Loader2 size={18} className="animate-spin" /> Carregando sessões…
        </Card>
      ) : sessoes.length === 0 ? (
        <EmptyState
          icon={<Camera size={40} />}
          title="Nenhuma sessão registrada"
          description="Tire a primeira foto da boca do paciente para começar a linha do tempo."
          action={novaBtn}
        />
      ) : (
        <>
          {/* scrubber */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => idx > 0 && setSelectedId(sessoes[idx - 1].id)}
                disabled={idx <= 0}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                aria-label="Sessão anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min={0}
                  max={sessoes.length - 1}
                  value={idx < 0 ? sessoes.length - 1 : idx}
                  onChange={(e) => setSelectedId(sessoes[Number(e.target.value)].id)}
                  className="w-full accent-brand-600"
                  aria-label="Linha do tempo de sessões"
                />
                <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                  <span>{sessoes[0] && formatDate(sessoes[0].data)}</span>
                  <span className="font-medium text-slate-500">
                    Sessão {Math.max(0, idx) + 1} de {sessoes.length}
                  </span>
                  <span>{sessoes[sessoes.length - 1] && formatDate(sessoes[sessoes.length - 1].data)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => idx < sessoes.length - 1 && setSelectedId(sessoes[idx + 1].id)}
                disabled={idx >= sessoes.length - 1}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                aria-label="Próxima sessão"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* filmstrip */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {sessoes.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    'group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-100 transition',
                    s.id === sel?.id ? 'border-brand-500 ring-2 ring-brand-200' : 'border-transparent hover:border-slate-300',
                  )}
                  title={`${formatDate(s.data)} · sessão ${i + 1}`}
                >
                  {s.foto ? (
                    <img src={s.foto} alt={`Sessão ${i + 1}`} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-slate-400">
                      <ImageOff size={18} />
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-black/45 px-1 py-0.5 text-center text-[9px] font-medium text-white">
                    {formatDate(s.data).slice(0, 5)}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* detalhe da sessão selecionada */}
          {sel && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* foto */}
              <Card className="flex flex-col overflow-hidden p-0">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CalendarDays size={15} className="text-brand-600" /> {formatDate(sel.data)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmDel(sel)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                    aria-label="Excluir sessão"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="flex min-h-[280px] flex-1 items-center justify-center bg-slate-900/95">
                  {sel.foto ? (
                    <img src={sel.foto} alt={`Foto da sessão ${formatDate(sel.data)}`} className="max-h-[380px] w-full object-contain" />
                  ) : (
                    <span className="flex flex-col items-center gap-2 text-slate-500">
                      <ImageOff size={28} /> <span className="text-xs">Sessão sem foto</span>
                    </span>
                  )}
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-slate-400">
                    {contarAlterados(sel)} dente(s) com alteração neste registro
                  </p>
                  {sel.observacao && <p className="mt-1 text-sm text-slate-600">{sel.observacao}</p>}
                </div>
              </Card>

              {/* holograma no estado da sessão */}
              <ToothView3D pacienteId={pacienteId} dentes={sel.dentes} snapshotKey={sel.id} />
            </div>
          )}
        </>
      )}

      {/* modal nova sessão */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm() }}
        title="Nova sessão"
        width="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Data</label>
            <input
              type="date"
              value={data}
              max={hoje()}
              onChange={(e) => setData(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Foto intraoral</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPickFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-slate-500 transition hover:border-brand-300 hover:bg-brand-50/40 cursor-pointer"
            >
              {fotoPreview ? (
                <img src={fotoPreview} alt="Pré-visualização" className="max-h-40 rounded-lg object-contain" />
              ) : (
                <>
                  <Camera size={26} className="text-brand-500" />
                  <span className="text-sm font-medium">Tirar foto ou escolher imagem</span>
                  <span className="text-xs text-slate-400">A imagem é comprimida automaticamente</span>
                </>
              )}
            </button>
            {fotoPreview && (
              <button
                type="button"
                onClick={() => { setFotoFile(null); setFotoPreview(null) }}
                className="mt-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Remover foto
              </button>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Observação</label>
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={2}
              placeholder="Ex.: instalação do aparelho, ativação, controle…"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            O estado atual do odontograma é salvo junto com a sessão. Marque os dentes no odontograma
            antes de registrar, para o holograma refletir este momento.
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); resetForm() }}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {saving ? 'Salvando…' : 'Registrar sessão'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        title="Vídeo da evolução"
        width="max-w-3xl"
      >
        <TimelineVideo sessoes={sessoes} pacienteNome={pacienteNome} />
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        title="Excluir sessão"
        description={<>Excluir a sessão de <strong>{confirmDel && formatDate(confirmDel.data)}</strong>? A foto será removida.</>}
        confirmLabel="Excluir"
        onConfirm={() => confirmDel && excluir(confirmDel)}
        onClose={() => setConfirmDel(null)}
      />
    </div>
  )
}
