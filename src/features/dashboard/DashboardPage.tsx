import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, Bot, Activity, ArrowRight, Plus, Package, CalendarDays, Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { readStore, writeStore } from '@/lib/storage'
import { patientsService } from '@/services/patients'
import { automationsService } from '@/services/automations'
import { odontogramService } from '@/services/odontogram'
import { stockService } from '@/services/stock'
import { appointmentsService } from '@/services/appointments'
import { userService } from '@/services/user'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { initials, formatDate } from '@/lib/format'

export function DashboardPage() {
  const user = useMemo(() => userService.current(), [])

  // Se o usuário existir mostra o nome; senão retorna null (nada é exibido).
  function renderSaudacao() {
    if (user) {
      return <h2 className="text-xl font-bold text-slate-800">Bem-vindo, {user.nome}</h2>
    } else {
      return null
    }
  }

  const patients = useMemo(() => patientsService.list(), [])
  const automations = useMemo(() => automationsService.list(), [])
  const lowStock = useMemo(() => stockService.lowStock().length, [])
  const hojeStr = new Date().toISOString().slice(0, 10)
  const consultasHoje = useMemo(() => appointmentsService.countByDate(hojeStr), [hojeStr])

  const stats = useMemo(() => {
    const automacoesAtivas = automations.filter((a) => a.ativo).length
    let dentesMarcados = 0
    for (const p of patients) {
      const chart = odontogramService.get(p.id)
      dentesMarcados += Object.values(chart.dentes).filter(
        (d) => d.status !== 'saudavel' || d.observacao?.trim(),
      ).length
    }
    return { automacoesAtivas, dentesMarcados }
  }, [patients, automations])

  const recentes = patients.slice(0, 5)

  // ---- onboarding ----
  // A conclusão de cada passo é PERSISTIDA: uma vez concluído, o passo continua
  // concluído mesmo que o dado seja apagado depois — assim o tutorial não volta.
  const hasAgenda = useMemo(() => appointmentsService.list().length > 0, [])
  const stockCount = useMemo(() => stockService.list().length, [])
  const hasStock = stockCount > 0

  const onbKey = `onboarding:done:${user?.id ?? 'anon'}`
  const liveDone: Record<string, boolean> = {
    patient: patients.length > 0,
    agenda: hasAgenda,
    stock: hasStock,
  }
  const persistedDone = readStore<string[]>(onbKey, [])

  // grava os passos recém-concluídos (sem nunca remover os já marcados)
  useEffect(() => {
    const done = Object.keys(liveDone).filter((k) => liveDone[k])
    const merged = Array.from(new Set([...persistedDone, ...done]))
    if (merged.length !== persistedDone.length) writeStore(onbKey, merged)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patients.length, hasAgenda, hasStock])

  const stepDone = (id: string) => liveDone[id] || persistedDone.includes(id)
  const onboardingSteps = [
    { done: stepDone('patient'), icon: Users, title: 'Cadastre um paciente', desc: 'Comece pelo seu primeiro paciente.', to: '/pacientes' },
    { done: stepDone('agenda'), icon: CalendarDays, title: 'Monte sua agenda', desc: 'Agende a primeira consulta.', to: '/agenda' },
    { done: stepDone('stock'), icon: Package, title: 'Configure o estoque', desc: 'Registre seus materiais e insumos.', to: '/estoque' },
  ]
  const onboardingDoneCount = onboardingSteps.filter((s) => s.done).length
  const onboardingDone = onboardingDoneCount === onboardingSteps.length

  const cards = [
    { label: 'Consultas hoje', value: consultasHoje, icon: CalendarDays, to: '/agenda', color: 'bg-brand-50 text-brand-600' },
    { label: 'Pacientes', value: patients.length, icon: Users, to: '/pacientes', color: 'bg-brand-50 text-brand-600' },
    {
      label: lowStock > 0 ? `Itens no estoque · ${lowStock} em baixa` : 'Itens no estoque',
      value: stockCount,
      icon: Package,
      to: '/estoque',
      color: lowStock > 0 ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-600',
    },
    { label: 'Automações ativas', value: stats.automacoesAtivas, icon: Bot, to: '/automacoes', color: 'bg-brand-50 text-brand-600' },
    { label: 'Registros no odontograma', value: stats.dentesMarcados, icon: Activity, to: '/pacientes', color: 'bg-brand-50 text-brand-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {renderSaudacao()}
          <p className="text-sm text-slate-500">Visão geral da sua clínica odontológica</p>
        </div>
        <Link to="/pacientes">
          <Button><Plus size={16} /> Novo paciente</Button>
        </Link>
      </div>

      {!onboardingDone ? (
        <Card className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Vamos configurar sua clínica</h3>
              <p className="mt-1 text-sm text-slate-500">
                Conclua os passos abaixo para começar a usar todo o Controly.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {onboardingDoneCount} de {onboardingSteps.length} concluídos
            </span>
          </div>

          {/* progresso */}
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${(onboardingDoneCount / onboardingSteps.length) * 100}%` }}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {onboardingSteps.map(({ icon: Icon, title, desc, to, done }, i) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'group flex flex-col rounded-xl border p-4 transition-all',
                  done
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm',
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl',
                    done ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-50 text-brand-600',
                  )}
                >
                  {done ? <Check size={20} /> : <Icon size={20} />}
                </span>
                <span
                  className={cn(
                    'mt-3 text-xs font-semibold uppercase tracking-wide',
                    done ? 'text-emerald-600' : 'text-brand-600',
                  )}
                >
                  {done ? 'Concluído' : `Passo ${i + 1}`}
                </span>
                <span className="mt-0.5 font-semibold text-slate-800">{title}</span>
                <span className="mt-0.5 text-sm text-slate-500">{desc}</span>
                {!done && (
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                    Começar <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </Link>
            ))}
          </div>
        </Card>
      ) : (
        <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, to, color }) => (
          <Link key={label} to={to}>
            <Card className="flex items-center gap-4 p-5 transition hover:shadow-md">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                <Icon size={22} />
              </span>
              <div>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
                <p className="text-sm text-slate-500">{label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Pacientes recentes</h3>
          <Link to="/pacientes" className="flex items-center gap-1 text-sm font-medium text-brand-600">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>
        {recentes.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Nenhum paciente cadastrado ainda.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentes.map((p) => (
              <Link key={p.id} to={`/pacientes/${p.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {initials(p.nome)}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{p.nome}</p>
                  <p className="text-xs text-slate-500">{p.telefone || p.email || 'Sem contato'}</p>
                </div>
                <span className="text-xs text-slate-500">{formatDate(p.criadoEm)}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>
        </>
      )}
    </div>
  )
}
