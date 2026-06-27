import { useEffect, useRef, useState } from 'react'
import { RotateCw, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react'
import type { ToothRecord } from '@/types'
import { odontogramService } from '@/services/odontogram'
import { UPPER_ARCH, LOWER_ARCH, toothType } from '@/data/teeth'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

type DentesMap = Record<number, ToothRecord>

const THREE_URL = 'https://esm.sh/three@0.160.0'
const ORBIT_URL = 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js'

type Categoria = 'saudavel' | 'afetado' | 'ausente'

/** Classifica o dente a partir do status registrado no odontograma. */
function categoria(status: string | undefined): Categoria {
  if (status === 'ausente') return 'ausente'
  if (!status || status === 'saudavel') return 'saudavel'
  return 'afetado'
}

const COR = {
  saudavel: { base: 0x2dd4ff, emissive: 0x0891b2, op: 0.5 },
  afetado: { base: 0xff4d4d, emissive: 0xb91c1c, op: 0.8 },
  ausente: { base: 0x64748b, emissive: 0x1e293b, op: 0.12 },
}

export function ToothView3D({
  pacienteId,
  dentes,
  snapshotKey,
}: {
  pacienteId: string
  /** snapshot opcional (ex.: estado de uma sessão); se ausente, lê o estado atual */
  dentes?: DentesMap
  /** muda quando o snapshot muda, para reconstruir a cena */
  snapshotKey?: string
}) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const apiRef = useRef<{ toggleRotation: () => void; reset: () => void } | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [rotating, setRotating] = useState(true)

  // fonte dos dados: snapshot da sessão ou estado atual do odontograma
  const dentesSource: DentesMap = dentes ?? odontogramService.get(pacienteId).dentes
  const dentesRef = useRef(dentesSource)
  dentesRef.current = dentesSource

  // contagem para a legenda
  const todos = [...UPPER_ARCH, ...LOWER_ARCH]
  const afetados = todos.filter((n) => categoria(dentesSource[n]?.status) === 'afetado').length
  const ausentes = todos.filter((n) => categoria(dentesSource[n]?.status) === 'ausente').length

  useEffect(() => {
    let raf = 0
    let disposed = false
    let renderer: any = null
    let observer: ResizeObserver | null = null
    const disposables: any[] = []

    async function init() {
      try {
        const THREE: any = await import(/* @vite-ignore */ THREE_URL)
        const { OrbitControls }: any = await import(/* @vite-ignore */ ORBIT_URL)
        if (disposed || !mountRef.current) return

        const data = { dentes: dentesRef.current }
        const mount = mountRef.current
        const width = mount.clientWidth || 600
        const height = mount.clientHeight || 420

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
        const home = new THREE.Vector3(0, 1.6, 8.5)
        camera.position.copy(home)

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(width, height)
        mount.appendChild(renderer.domElement)

        // luzes
        scene.add(new THREE.AmbientLight(0x88aabb, 1.1))
        const key = new THREE.PointLight(0x33d6ff, 60, 50)
        key.position.set(4, 6, 6)
        const fill = new THREE.PointLight(0xffffff, 25, 50)
        fill.position.set(-5, -2, 4)
        scene.add(key, fill)

        // base holográfica
        const grid = new THREE.PolarGridHelper(4.2, 12, 5, 64, 0x1c93bf, 0x0e3a4d)
        grid.position.y = -2.4
        ;(grid.material as any).opacity = 0.35
        ;(grid.material as any).transparent = true
        scene.add(grid)

        const root = new THREE.Group()
        root.rotation.x = -0.18
        scene.add(root)

        function makeTooth(numero: number, isUpper: boolean) {
          const cat = categoria(data.dentes[numero]?.status)
          if (cat === 'ausente') {
            // dente ausente: marcador fantasma discreto
            const geo = new THREE.SphereGeometry(0.18, 10, 8)
            const mat = new THREE.MeshBasicMaterial({
              color: COR.ausente.base,
              transparent: true,
              opacity: COR.ausente.op,
              wireframe: true,
            })
            disposables.push(geo, mat)
            return new THREE.Mesh(geo, mat)
          }

          const c = COR[cat]
          const type = toothType(numero)
          const scale =
            type === 'molar' ? 1.3 : type === 'premolar' ? 1.02 : type === 'canino' ? 0.96 : 0.82

          const tooth = new THREE.Group()
          const mat = new THREE.MeshStandardMaterial({
            color: c.base,
            emissive: c.emissive,
            emissiveIntensity: cat === 'afetado' ? 0.9 : 0.45,
            metalness: 0.1,
            roughness: 0.25,
            transparent: true,
            opacity: c.op,
          })
          const wireMat = new THREE.MeshBasicMaterial({
            color: c.base,
            wireframe: true,
            transparent: true,
            opacity: cat === 'afetado' ? 0.5 : 0.28,
          })
          disposables.push(mat, wireMat)

          // coroa
          const crownGeo = new THREE.SphereGeometry(0.42, 20, 16)
          crownGeo.scale(1, 0.95, 1)
          disposables.push(crownGeo)
          const crown = new THREE.Mesh(crownGeo, mat)
          crown.position.y = 0.34
          const crownWire = new THREE.Mesh(crownGeo, wireMat)
          crownWire.position.y = 0.34
          crownWire.scale.setScalar(1.03)

          // raiz
          const rootGeo = new THREE.ConeGeometry(0.26, 0.95, 18)
          disposables.push(rootGeo)
          const rootMesh = new THREE.Mesh(rootGeo, mat)
          rootMesh.rotation.x = Math.PI // ápice para baixo
          rootMesh.position.y = -0.34

          tooth.add(crown, crownWire, rootMesh)
          tooth.scale.setScalar(scale)
          if (isUpper) tooth.rotation.x = Math.PI // coroa apontando para baixo
          return tooth
        }

        function placeArch(teeth: number[], y: number, isUpper: boolean) {
          const n = teeth.length
          const Rx = 3.1
          const Rz = 3.7
          const spread = Math.PI * 1.04
          teeth.forEach((numero, i) => {
            const t = n > 1 ? i / (n - 1) : 0.5
            const ang = (t - 0.5) * spread
            const pivot = new THREE.Group()
            pivot.position.set(Rx * Math.sin(ang), y, -Rz * Math.cos(ang) + Rz * 0.5)
            pivot.rotation.y = -ang
            pivot.add(makeTooth(numero, isUpper))
            root.add(pivot)
          })
        }

        placeArch(UPPER_ARCH, 1.15, true)
        placeArch(LOWER_ARCH, -1.15, false)

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.08
        controls.enablePan = false
        controls.minDistance = 5
        controls.maxDistance = 16
        controls.autoRotate = true
        controls.autoRotateSpeed = 0.9
        controls.target.set(0, 0, 0)

        apiRef.current = {
          toggleRotation: () => {
            controls.autoRotate = !controls.autoRotate
            setRotating(controls.autoRotate)
          },
          reset: () => {
            camera.position.copy(home)
            controls.target.set(0, 0, 0)
            controls.update()
          },
        }

        function onResize() {
          if (!mountRef.current) return
          const w = mountRef.current.clientWidth
          const h = mountRef.current.clientHeight
          camera.aspect = w / h
          camera.updateProjectionMatrix()
          renderer.setSize(w, h)
        }
        observer = new ResizeObserver(onResize)
        observer.observe(mount)

        function loop() {
          raf = requestAnimationFrame(loop)
          controls.update()
          renderer.render(scene, camera)
        }
        loop()
        setStatus('ready')

        disposables.push(controls)
      } catch (e) {
        console.error('Falha ao carregar visualização 3D', e)
        if (!disposed) setStatus('error')
      }
    }

    init()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      observer?.disconnect()
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
        renderer.domElement?.remove()
      }
      apiRef.current = null
    }
  }, [pacienteId, snapshotKey])

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800">Visualização 3D</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
              <Sparkles size={11} /> Protótipo
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Holograma do arco — dentes com alteração aparecem em vermelho. Arraste para girar.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => apiRef.current?.toggleRotation()}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              rotating
                ? 'border-brand-200 bg-brand-50 text-brand-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            <RotateCw size={14} /> {rotating ? 'Girando' : 'Parado'}
          </button>
          <button
            type="button"
            onClick={() => apiRef.current?.reset()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw size={14} /> Resetar
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={mountRef}
          className="h-[clamp(320px,52vh,560px)] w-full bg-[radial-gradient(circle_at_50%_30%,#0b1f2e_0%,#060d14_70%)]"
        />

        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
            <Sparkles size={26} className="animate-pulse text-brand-400" />
            <p className="text-sm">Carregando holograma…</p>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-slate-300">
            <AlertTriangle size={26} className="text-amber-400" />
            <p className="text-sm">
              Não foi possível carregar a visualização 3D. Verifique a conexão (o protótipo baixa a
              biblioteca 3D sob demanda) ou se o navegador suporta WebGL.
            </p>
          </div>
        )}

        {/* legenda sobre o canvas */}
        {status === 'ready' && (
          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-black/30 px-3 py-2 text-[11px] font-medium text-white backdrop-blur">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> Hígido
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Alterado ({afetados})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400/60" /> Ausente ({ausentes})
            </span>
          </div>
        )}
      </div>

      <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">
        Protótipo ilustrativo para comunicação com o paciente — geometria aproximada, não substitui o
        odontograma clínico.
      </p>
    </Card>
  )
}
