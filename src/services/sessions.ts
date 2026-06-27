import type { OdontoSessao } from '@/types'
import { uid } from '@/lib/id'
import { idbPut, idbDelete, idbAllByIndex, SESSOES_STORE } from '@/lib/idb'
import { odontogramService } from './odontogram'

export interface SessaoInput {
  pacienteId: string
  data: string
  foto?: string
  observacao?: string
}

/**
 * Comprime uma imagem (File) redimensionando para no máx. `maxSize`px no maior
 * lado e exportando como JPEG — mantém o armazenamento enxuto.
 */
export function compressImage(file: File, maxSize = 1280, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Imagem inválida'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas indisponível'))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export const sessionsService = {
  async list(pacienteId: string): Promise<OdontoSessao[]> {
    const all = await idbAllByIndex<OdontoSessao>(SESSOES_STORE, 'pacienteId', pacienteId)
    // ordena por data (e desempate por criação)
    return all.sort((a, b) => a.data.localeCompare(b.data) || a.criadoEm.localeCompare(b.criadoEm))
  },

  /** Cria uma sessão com snapshot do odontograma atual do paciente. */
  async create(input: SessaoInput): Promise<OdontoSessao> {
    const chart = odontogramService.get(input.pacienteId)
    const sessao: OdontoSessao = {
      id: uid(),
      pacienteId: input.pacienteId,
      data: input.data,
      foto: input.foto,
      observacao: input.observacao?.trim() || undefined,
      dentes: chart.dentes,
      criadoEm: new Date().toISOString(),
    }
    await idbPut(SESSOES_STORE, sessao)
    return sessao
  },

  async remove(id: string): Promise<void> {
    await idbDelete(SESSOES_STORE, id)
  },
}
