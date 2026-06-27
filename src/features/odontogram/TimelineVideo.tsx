import { useEffect, useRef, useState } from 'react'
import { Film, Download, Loader2, AlertTriangle, Play } from 'lucide-react'
import type { OdontoSessao } from '@/types'
import { UPPER_ARCH, LOWER_ARCH, toothType } from '@/data/teeth'
import { buildToothGeometry, toothFootprint } from './toothGeometry'
import { formatDate } from '@/lib/format'
import { Button } from '@/components/ui/Button'

const THREE_URL = 'https://esm.sh/three@0.160.0'

const W = 1280
const H = 720
const SEG_DUR = 1.8 // segundos por transição entre sessões
const TAIL = 1.2 // segundos parados no fim

type Cat = 'saudavel' | 'afetado' | 'ausente'
function categoria(status: string | undefined): Cat {
  if (status === 'ausente') return 'ausente'
  if (!status || status === 'saudavel') return 'saudavel'
  return 'afetado'
}
const APAR: Record<Cat, { color: number; emissive: number; opacity: number; emI: number; wire: number }> = {
  saudavel: { color: 0x2dd4ff, emissive: 0x0891b2, opacity: 0.5, emI: 0.45, wire: 0.28 },
  afetado: { color: 0xff4d4d, emissive: 0xb91c1c, opacity: 0.82, emI: 0.9, wire: 0.5 },
  ausente: { color: 0x64748b, emissive: 0x0f172a, opacity: 0.08, emI: 0.1, wire: 0.05 },
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (t: number) => t * t * (3 - 2 * t)

function pickMime(): string {
  const cands = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  for (const c of cands) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c
  }
  return 'video/webm'
}

export function TimelineVideo({
  sessoes,
  pacienteNome,
}: {
  sessoes: OdontoSessao[]
  pacienteNome?: string
}) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const recRef = useRef<{ start: () => void } | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'unsupported'>('loading')
  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const poucas = sessoes.length < 2

  useEffect(() => {
    if (typeof MediaRecorder === 'undefined' || !document.createElement('canvas').captureStream) {
      setStatus('unsupported')
      return
    }

    let raf = 0
    let disposed = false
    let renderer: any = null
    const disposables: any[] = []
    let recorder: MediaRecorder | null = null
    let stream: MediaStream | null = null
    const N = sessoes.length
    const totalDur = Math.max(0.001, (N - 1) * SEG_DUR) + TAIL

    async function init() {
      try {
        const THREE: any = await import(/* @vite-ignore */ THREE_URL)
        if (disposed || !mountRef.current) return
        const mount = mountRef.current

        // canvas de saída (composição 2D — é o que gravamos)
        const out = document.createElement('canvas')
        out.width = W
        out.height = H
        out.className = 'w-full rounded-xl'
        out.style.background = '#060d14'
        mount.appendChild(out)
        const ctx = out.getContext('2d')!

        // fotos pré-carregadas para o overlay
        const fotos: (HTMLImageElement | null)[] = sessoes.map((s) => {
          if (!s.foto) return null
          const im = new Image()
          im.src = s.foto
          return im
        })

        // cena 3D (canvas separado, fonte do drawImage)
        const glCanvas = document.createElement('canvas')
        glCanvas.width = W
        glCanvas.height = H
        renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: true })
        renderer.setSize(W, H, false)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
        camera.position.set(0, 1.2, 7.4)
        camera.lookAt(0, 0, 0)

        scene.add(new THREE.AmbientLight(0x88aabb, 1.1))
        const key = new THREE.PointLight(0x33d6ff, 60, 50)
        key.position.set(4, 6, 6)
        const fill = new THREE.PointLight(0xffffff, 25, 50)
        fill.position.set(-5, -2, 4)
        scene.add(key, fill)

        const grid = new THREE.PolarGridHelper(4.2, 12, 5, 64, 0x1c93bf, 0x0e3a4d)
        grid.position.y = -2.4
        ;(grid.material as any).opacity = 0.3
        ;(grid.material as any).transparent = true
        scene.add(grid)

        const rootGroup = new THREE.Group()
        rootGroup.rotation.x = 0
        scene.add(rootGroup)

        // appearance de cada dente por sessão
        function apar(num: number, s: OdontoSessao) {
          return APAR[categoria(s.dentes[num]?.status)]
        }

        type ToothRef = { mat: any; wire: any; frames: ReturnType<typeof apar>[] }
        const teeth: ToothRef[] = []

        function build(num: number, isUpper: boolean) {
          const type = toothType(num)
          const mat = new THREE.MeshStandardMaterial({
            transparent: true,
            metalness: 0.1,
            roughness: 0.3,
          })
          const wire = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true })
          disposables.push(mat, wire)

          const geo = buildToothGeometry(THREE, type)
          disposables.push(geo)
          const mesh = new THREE.Mesh(geo, mat)
          const wireMesh = new THREE.Mesh(geo, wire)
          wireMesh.scale.setScalar(1.015)

          const tooth = new THREE.Group()
          tooth.add(mesh, wireMesh)
          tooth.scale.setScalar(0.62 * toothFootprint(type))
          if (isUpper) tooth.rotation.x = Math.PI

          teeth.push({ mat, wire, frames: sessoes.map((s) => apar(num, s)) })
          return tooth
        }

        function placeArch(list: number[], y: number, isUpper: boolean) {
          const n = list.length
          const Rx = 2.9
          const Rz = 3.6
          const spread = Math.PI * 0.92
          list.forEach((num, i) => {
            const t = n > 1 ? i / (n - 1) : 0.5
            const ang = (t - 0.5) * spread
            const pivot = new THREE.Group()
            pivot.position.set(Rx * Math.sin(ang), y, -Rz * Math.cos(ang) + Rz * 0.5)
            pivot.rotation.y = -ang
            pivot.add(build(num, isUpper))
            rootGroup.add(pivot)
          })
        }
        placeArch(UPPER_ARCH, 0.55, true)
        placeArch(LOWER_ARCH, -0.55, false)

        // cores reutilizáveis
        const cA = new THREE.Color()
        const cB = new THREE.Color()
        const eA = new THREE.Color()
        const eB = new THREE.Color()

        function applyState(p: number) {
          const seg = Math.min(N - 2, Math.floor(p))
          const fracRaw = N >= 2 ? p - seg : 0
          const e = N >= 2 ? smooth(Math.max(0, Math.min(1, (fracRaw - 0.2) / 0.6))) : 0
          for (const t of teeth) {
            const a = t.frames[N >= 2 ? seg : 0]
            const b = t.frames[N >= 2 ? seg + 1 : 0]
            cA.setHex(a.color); cB.setHex(b.color)
            eA.setHex(a.emissive); eB.setHex(b.emissive)
            t.mat.color.copy(cA).lerp(cB, e)
            t.mat.emissive.copy(eA).lerp(eB, e)
            t.mat.opacity = lerp(a.opacity, b.opacity, e)
            t.mat.emissiveIntensity = lerp(a.emI, b.emI, e)
            t.wire.color.copy(cA).lerp(cB, e)
            t.wire.opacity = lerp(a.wire, b.wire, e)
          }
        }

        function drawOverlay(p: number) {
          // fundo + cena 3D
          const grad = ctx.createRadialGradient(W / 2, H * 0.35, 80, W / 2, H * 0.5, W * 0.7)
          grad.addColorStop(0, '#0b1f2e')
          grad.addColorStop(1, '#060d14')
          ctx.fillStyle = grad
          ctx.fillRect(0, 0, W, H)
          ctx.drawImage(glCanvas, 0, 0, W, H)

          const idx = Math.max(0, Math.min(N - 1, Math.round(p)))
          const segFloor = Math.min(N - 2, Math.floor(p))
          const fr = N >= 2 ? smooth(Math.max(0, Math.min(1, (p - segFloor - 0.2) / 0.6))) : 0

          // título
          ctx.fillStyle = 'rgba(255,255,255,0.92)'
          ctx.font = '600 34px ui-sans-serif, system-ui, sans-serif'
          ctx.textAlign = 'left'
          ctx.fillText('Evolução do tratamento', 48, 64)
          if (pacienteNome) {
            ctx.fillStyle = 'rgba(148,163,184,0.9)'
            ctx.font = '400 22px ui-sans-serif, system-ui, sans-serif'
            ctx.fillText(pacienteNome, 48, 96)
          }

          // foto (crossfade entre sessões)
          const pw = 300
          const ph = 220
          const px = W - pw - 48
          const py = 48
          ctx.save()
          ctx.strokeStyle = 'rgba(45,212,255,0.4)'
          ctx.lineWidth = 2
          const drawFoto = (im: HTMLImageElement | null, alpha: number) => {
            if (!im || !im.complete || !im.naturalWidth) return
            ctx.globalAlpha = alpha
            const r = Math.min(pw / im.naturalWidth, ph / im.naturalHeight)
            const dw = im.naturalWidth * r
            const dh = im.naturalHeight * r
            ctx.drawImage(im, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh)
          }
          ctx.fillStyle = 'rgba(255,255,255,0.04)'
          ctx.fillRect(px, py, pw, ph)
          if (N >= 2) {
            drawFoto(fotos[segFloor], 1 - fr)
            drawFoto(fotos[segFloor + 1], fr)
          } else {
            drawFoto(fotos[0], 1)
          }
          ctx.globalAlpha = 1
          ctx.strokeRect(px, py, pw, ph)
          ctx.restore()

          // data + sessão
          const s = sessoes[idx]
          ctx.textAlign = 'center'
          ctx.fillStyle = 'rgba(255,255,255,0.95)'
          ctx.font = '700 40px ui-sans-serif, system-ui, sans-serif'
          ctx.fillText(formatDate(s.data), W / 2, H - 78)
          ctx.fillStyle = 'rgba(45,212,255,0.9)'
          ctx.font = '600 22px ui-sans-serif, system-ui, sans-serif'
          ctx.fillText(`Sessão ${idx + 1} de ${N}`, W / 2, H - 46)

          // barra de progresso
          const bw = W - 96
          const prog = totalDur > 0 ? Math.min(1, (p * SEG_DUR) / totalDur) : 1
          ctx.fillStyle = 'rgba(255,255,255,0.12)'
          ctx.fillRect(48, H - 24, bw, 5)
          ctx.fillStyle = '#2dd4ff'
          ctx.fillRect(48, H - 24, bw * prog, 5)
        }

        // animação
        let startTs = 0
        let recordingPass = false
        const chunks: BlobPart[] = []

        function frame(ts: number) {
          raf = requestAnimationFrame(frame)
          if (!startTs) startTs = ts
          const elapsed = (ts - startTs) / 1000
          let p: number
          if (recordingPass) {
            p = Math.min(N - 1, (elapsed / SEG_DUR))
            setProgress(Math.min(1, elapsed / totalDur))
            if (elapsed >= totalDur) {
              recordingPass = false
              recorder?.stop()
            }
          } else {
            // preview em loop
            const loopDur = (N - 1) * SEG_DUR + TAIL
            const e2 = loopDur > 0 ? elapsed % loopDur : 0
            p = Math.min(N - 1, e2 / SEG_DUR)
          }
          rootGroup.rotation.y += 0.0045
          applyState(p)
          renderer.render(scene, camera)
          drawOverlay(p)
        }

        recRef.current = {
          start: () => {
            if (recordingPass) return
            chunks.length = 0
            stream = (out as any).captureStream(30)
            recorder = new MediaRecorder(stream!, { mimeType: pickMime(), videoBitsPerSecond: 6_000_000 })
            recorder.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data)
            recorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'video/webm' })
              setVideoUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return URL.createObjectURL(blob)
              })
              setRecording(false)
              setProgress(1)
            }
            setVideoUrl(null)
            setRecording(true)
            setProgress(0)
            startTs = 0
            recordingPass = true
            recorder.start()
          },
        }

        startTs = 0
        frame(performance.now())
        setStatus('ready')
      } catch (e) {
        console.error('Falha no gerador de vídeo', e)
        if (!disposed) setStatus('error')
      }
    }

    init()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      try {
        recorder?.state !== 'inactive' && recorder?.stop()
      } catch {
        /* ignore */
      }
      stream?.getTracks().forEach((t) => t.stop())
      for (const d of disposables) {
        try {
          d.dispose?.()
        } catch {
          /* ignore */
        }
      }
      if (renderer) {
        renderer.dispose()
        renderer.forceContextLoss?.()
      }
      recRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessoes])

  function baixar() {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `evolucao-${(pacienteNome ?? 'paciente').toLowerCase().replace(/\s+/g, '-')}.webm`
    a.click()
  }

  return (
    <div className="space-y-3">
      <div ref={mountRef} className="relative overflow-hidden rounded-xl bg-[#060d14]">
        {status === 'loading' && (
          <div className="flex h-[360px] items-center justify-center gap-2 text-slate-300">
            <Loader2 size={18} className="animate-spin" /> Preparando cena…
          </div>
        )}
        {status === 'error' && (
          <div className="flex h-[360px] items-center justify-center gap-2 px-6 text-center text-slate-300">
            <AlertTriangle size={20} className="text-amber-400" /> Não foi possível iniciar o gerador
            de vídeo (WebGL/biblioteca 3D).
          </div>
        )}
        {status === 'unsupported' && (
          <div className="flex h-[360px] items-center justify-center gap-2 px-6 text-center text-slate-300">
            <AlertTriangle size={20} className="text-amber-400" /> Seu navegador não suporta gravação
            de vídeo do canvas (MediaRecorder). Tente o Chrome/Edge atualizados.
          </div>
        )}
      </div>

      {status === 'ready' && (
        <>
          {poucas && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Registre ao menos 2 sessões para gerar a animação da evolução. Com 1 sessão o vídeo fica
              estático.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => recRef.current?.start()} disabled={recording}>
              {recording ? <Loader2 size={16} className="animate-spin" /> : <Film size={16} />}
              {recording ? `Gravando… ${Math.round(progress * 100)}%` : 'Gerar vídeo (.webm)'}
            </Button>
            {videoUrl && (
              <Button variant="secondary" onClick={baixar}>
                <Download size={16} /> Baixar vídeo
              </Button>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Play size={12} /> Pré-visualização rodando em loop acima
            </span>
          </div>

          {videoUrl && (
            <video
              src={videoUrl}
              controls
              className="w-full rounded-xl border border-slate-200"
            />
          )}
        </>
      )}
    </div>
  )
}
