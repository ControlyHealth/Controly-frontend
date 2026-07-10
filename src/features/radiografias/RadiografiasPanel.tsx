import { useRef, useState } from 'react'
import { Plus, Trash2, ImageIcon, Calendar, X, Upload } from 'lucide-react'
import type { Radiografia, RadiografiaTipo } from '@/types'
import { radiografiasService } from '@/services/radiografias'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Select, Textarea } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/format'
import { anunciar } from '@/services/notifications'

export const RADIO_TIPO_LABEL: Record<RadiografiaTipo, string> = {
  panoramica: 'Panorâmica',
  periapical: 'Periapical',
  interproximal: 'Interproximal (bite-wing)',
  oclusal: 'Oclusal',
  telerradiografia: 'Telerradiografia',
  tomografia: 'Tomografia (TC)',
  outro: 'Outro',
}

const TIPOS = Object.keys(RADIO_TIPO_LABEL) as RadiografiaTipo[]

/** Lê o arquivo e reduz para no máx. 1000px / JPEG q0.72 para caber no localStorage. */
function fileToCompressedDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Imagem inválida'))
      img.onload = () => {
        const max = 1000
        let { width, height } = img
        if (width > max || height > max) {
          const ratio = Math.min(max / width, max / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas indisponível'))
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

function NovaRadiografiaForm({
  pacienteId,
  onDone,
}: {
  pacienteId: string
  onDone: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [tipo, setTipo] = useState<RadiografiaTipo>('panoramica')
  const [data, setData] = useState(today)
  const [observacao, setObservacao] = useState('')
  const [imagem, setImagem] = useState<string | undefined>()
  const [nomeArquivo, setNomeArquivo] = useState<string | undefined>()
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro(null)
    setCarregando(true)
    try {
      const dataUrl = await fileToCompressedDataURL(file)
      setImagem(dataUrl)
      setNomeArquivo(file.name)
    } catch {
      setErro('Não foi possível carregar a imagem.')
    } finally {
      setCarregando(false)
    }
  }

  function handleSave() {
    try {
      radiografiasService.create({ pacienteId, tipo, data, observacao: observacao.trim(), imagem, nomeArquivo })
      anunciar('clinico', 'Radiografia registrada.', RADIO_TIPO_LABEL[tipo])
      onDone()
    } catch {
      setErro('Falha ao salvar — a imagem pode ser grande demais para o armazenamento local.')
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Tipo de radiografia">
        <Select value={tipo} onChange={(e) => setTipo(e.target.value as RadiografiaTipo)}>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {RADIO_TIPO_LABEL[t]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Data">
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </Field>

      <Field label="Imagem" hint="JPG/PNG. A imagem é reduzida e guardada localmente no navegador.">
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        {imagem ? (
          <div className="relative overflow-hidden rounded-lg border border-slate-200">
            <img src={imagem} alt="Pré-visualização" className="max-h-56 w-full bg-slate-900 object-contain" />
            <button
              type="button"
              onClick={() => {
                setImagem(undefined)
                setNomeArquivo(undefined)
                if (inputRef.current) inputRef.current.value = ''
              }}
              className="absolute right-2 top-2 rounded-lg bg-white/90 p-1 text-slate-600 shadow hover:bg-white cursor-pointer"
              aria-label="Remover imagem"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <Upload size={20} />
            {carregando ? 'Carregando…' : 'Selecionar imagem'}
          </button>
        )}
      </Field>

      <Field label="Observação">
        <Textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Ex.: Imagem sugestiva de lesão periapical no dente 36."
        />
      </Field>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={carregando}>
          Salvar radiografia
        </Button>
      </div>
    </div>
  )
}

export function RadiografiasPanel({ pacienteId }: { pacienteId: string }) {
  const [open, setOpen] = useState(false)
  const [, force] = useState(0)
  const [preview, setPreview] = useState<Radiografia | null>(null)
  const [toDelete, setToDelete] = useState<Radiografia | null>(null)
  const lista = radiografiasService.list(pacienteId)

  function refresh() {
    setOpen(false)
    force((n) => n + 1)
  }

  function confirmDelete() {
    if (toDelete) {
      radiografiasService.remove(pacienteId, toDelete.id)
      anunciar('clinico', 'Radiografia removida.', RADIO_TIPO_LABEL[toDelete.tipo])
      setToDelete(null)
      force((n) => n + 1)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Radiografias</h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus size={16} /> Nova radiografia
        </Button>
      </div>

      {lista.length === 0 ? (
        <EmptyState
          icon={<ImageIcon size={40} />}
          title="Nenhuma radiografia"
          description="Anexe panorâmicas, periapicais e outros exames de imagem deste paciente."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus size={16} /> Adicionar
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((r) => (
            <Card key={r.id} className="overflow-hidden">
              <button
                type="button"
                onClick={() => r.imagem && setPreview(r)}
                className={
                  'flex aspect-video w-full items-center justify-center bg-slate-900 ' +
                  (r.imagem ? 'cursor-zoom-in' : 'cursor-default')
                }
              >
                {r.imagem ? (
                  <img src={r.imagem} alt={RADIO_TIPO_LABEL[r.tipo]} className="h-full w-full object-contain" />
                ) : (
                  <ImageIcon size={28} className="text-slate-500" />
                )}
              </button>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {RADIO_TIPO_LABEL[r.tipo]}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <Calendar size={12} /> {formatDate(r.data)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setToDelete(r)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                    aria-label="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {r.observacao && <p className="mt-2 text-xs text-slate-600">{r.observacao}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nova radiografia">
        <NovaRadiografiaForm pacienteId={pacienteId} onDone={refresh} />
      </Modal>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview ? `${RADIO_TIPO_LABEL[preview.tipo]} · ${formatDate(preview.data)}` : ''}
        width="max-w-3xl"
      >
        {preview?.imagem && (
          <img src={preview.imagem} alt="Radiografia" className="max-h-[70vh] w-full rounded-lg bg-slate-900 object-contain" />
        )}
        {preview?.observacao && <p className="mt-3 text-sm text-slate-600">{preview.observacao}</p>}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir radiografia"
        description="Tem certeza que deseja excluir esta radiografia?"
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
