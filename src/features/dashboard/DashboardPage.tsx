import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, Bot, Activity, ArrowRight, Plus, Package, CalendarDays } from 'lucide-react'
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

  const cards = [
    { label: 'Consultas hoje', value: consultasHoje, icon: CalendarDays, to: '/agenda', color: 'bg-brand-50 text-brand-600' },
    { label: 'Pacientes', value: patients.length, icon: Users, to: '/pacientes', color: 'bg-brand-50 text-brand-600' },
    {
      label: lowStock > 0 ? 'Itens em estoque baixo' : 'Estoque em dia',
      value: lowStock,
      icon: Package,
      to: '/estoque',
      color: lowStock > 0 ? 'bg-brand-50 text-brand-600' : 'bg-brand-50 text-brand-600',
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
                  <p className="text-xs text-slate-400">{p.telefone || p.email || 'Sem contato'}</p>
                </div>
                <span className="text-xs text-slate-400">{formatDate(p.criadoEm)}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
