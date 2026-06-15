import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  Pencil,
  CalendarDays,
  User,
} from 'lucide-react'
import type { Appointment, AppointmentStatus } from '@/types'
import { appointmentsService, type AppointmentInput } from '@/services/appointments'
import { patientsService } from '@/services/patients'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { AppointmentForm, APPT_STATUS_LABEL } from './AppointmentForm'
import { initials } from '@/lib/format'
import { cn } from '@/lib/cn'

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  agendado: 'bg-slate-100 text-slate-700',
  confirmado: 'bg-brand-100 text-brand-700',
  atendido: 'bg-green-100 text-green-700',
  faltou: 'bg-amber-100 text-amber-700',
  cancelado: 'bg-red-100 text-red-700',
}

// ----- helpers de data (sem libs, em horário local) -----
function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function fromYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function addDays(s: string, n: number): string {
  const d = fromYmd(s)
  d.setDate(d.getDate() + n)
  return toYmd(d)
}
function startOfWeek(s: string): string {
  const d = fromYmd(s)
  d.setDate(d.getDate() - d.getDay()) // domingo
  return toYmd(d)
}
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function AgendaPage() {
  const hoje = toYmd(new Date())
  const [selected, setSelected] = useState(hoje)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | undefined>(undefined)
  const [version, setVersion] = useState(0)

  const weekStart = startOfWeek(selected)
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )
  const counts = useMemo(
    () => appointmentsService.countsBetween(weekDays[0], weekDays[6]),
    [weekDays, version],
  )
  const consultas = useMemo(() => appointmentsService.listByDate(selected), [selected, version])

  function refresh() {
    setModalOpen(false)
    setEditing(undefined)
    setVersion((v) => v + 1)
  }

  function handleSubmit(data: AppointmentInput) {
    if (editing) appointmentsService.update(editing.id, data)
    else appointmentsService.create(data)
    refresh()
  }

  function handleDelete(a: Appointment) {
    if (confirm('Excluir esta consulta?')) {
      appointmentsService.remove(a.id)
      setVersion((v) => v + 1)
    }
  }

  const tituloDia = fromYmd(selected).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Agenda</h2>
          <p className="text-sm text-slate-500">Consultas e horários dos pacientes</p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined)
            setModalOpen(true)
          }}
        >
          <Plus size={16} /> Nova consulta
        </Button>
      </div>

      {/* navegação por semana */}
      <Card className="p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setSelected(addDays(weekStart, -7))}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label="Semana anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => setSelected(hoje)}
            className="rounded-lg px-3 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50 cursor-pointer"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => setSelected(addDays(weekStart, 7))}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label="Próxima semana"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d) => {
            const dia = fromYmd(d)
            const isSel = d === selected
            const isHoje = d === hoje
            const n = counts[d] ?? 0
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelected(d)}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-lg py-2 text-sm transition cursor-pointer',
                  isSel ? 'bg-brand-600 text-white' : 'hover:bg-slate-100 text-slate-600',
                )}
              >
                <span className={cn('text-[11px]', isSel ? 'text-brand-100' : 'text-slate-400')}>
                  {WEEKDAYS[dia.getDay()]}
                </span>
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full font-semibold tabular-nums',
                    !isSel && isHoje && 'ring-1 ring-brand-400 text-brand-700',
                  )}
                >
                  {dia.getDate()}
                </span>
                {n > 0 ? (
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      isSel ? 'bg-white' : 'bg-brand-500',
                    )}
                  />
                ) : (
                  <span className="h-1.5 w-1.5" />
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* dia selecionado */}
      <div className="flex items-center gap-2 text-slate-700">
        <CalendarDays size={18} className="text-brand-600" />
        <h3 className="font-semibold capitalize">{tituloDia}</h3>
        <span className="text-sm text-slate-400">
          · {consultas.length} {consultas.length === 1 ? 'consulta' : 'consultas'}
        </span>
      </div>

      {consultas.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={40} />}
          title="Nenhuma consulta neste dia"
          description="Agende uma nova consulta para este paciente."
          action={
            <Button
              onClick={() => {
                setEditing(undefined)
                setModalOpen(true)
              }}
            >
              <Plus size={16} /> Nova consulta
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {consultas.map((a) => {
            const paciente = patientsService.get(a.pacienteId)
            return (
              <Card key={a.id} className="flex items-stretch overflow-hidden">
                <div className="flex w-20 shrink-0 flex-col items-center justify-center bg-slate-50 px-2 py-3 text-center">
                  <span className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                    <Clock size={12} className="text-slate-400" /> {a.inicio}
                  </span>
                  <span className="text-xs text-slate-400">{a.fim}</span>
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-3 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                    {paciente ? initials(paciente.nome) : <User size={16} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    {paciente ? (
                      <Link
                        to={`/pacientes/${paciente.id}`}
                        className="block truncate font-medium text-slate-800 hover:text-brand-600"
                      >
                        {paciente.nome}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-400">Paciente removido</span>
                    )}
                    {a.procedimento && (
                      <p className="truncate text-xs text-slate-500">{a.procedimento}</p>
                    )}
                  </div>
                  <Badge className={cn('shrink-0', STATUS_STYLE[a.status])}>
                    {APPT_STATUS_LABEL[a.status]}
                  </Badge>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(a)
                        setModalOpen(true)
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                      aria-label="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      aria-label="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(undefined)
        }}
        title={editing ? 'Editar consulta' : 'Nova consulta'}
        width="max-w-lg"
      >
        <AppointmentForm
          initial={editing}
          defaultDate={selected}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setEditing(undefined)
          }}
        />
      </Modal>
    </div>
  )
}
