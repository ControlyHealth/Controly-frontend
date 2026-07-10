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
  Check,
} from 'lucide-react'
import type { Appointment, AppointmentStatus } from '@/types'
import { appointmentsService, type AppointmentInput } from '@/services/appointments'
import { patientsService } from '@/services/patients'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { AppointmentForm, APPT_STATUS_LABEL } from './AppointmentForm'
import { initials, formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { anunciar } from '@/services/notifications'
import { toast } from '@/lib/toast'

// Identidade visual de cada status: ponto, chip e barra lateral do card.
const STATUS: Record<AppointmentStatus, { dot: string; chip: string; bar: string }> = {
  agendado: { dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-600', bar: 'bg-slate-300' },
  confirmado: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-400' },
  atendido: { dot: 'bg-brand-500', chip: 'bg-brand-50 text-brand-700', bar: 'bg-brand-500' },
  atrasado: { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700', bar: 'bg-orange-400' },
  faltou: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700', bar: 'bg-amber-400' },
  cancelado: { dot: 'bg-red-500', chip: 'bg-red-50 text-red-700', bar: 'bg-red-400' },
}
const STATUS_LIST = Object.keys(APPT_STATUS_LABEL) as AppointmentStatus[]

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
  const [statusMenu, setStatusMenu] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<Appointment | undefined>(undefined)
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

  // resumo do dia por status
  const resumo = useMemo(() => {
    const r = {} as Record<AppointmentStatus, number>
    for (const a of consultas) r[a.status] = (r[a.status] ?? 0) + 1
    return r
  }, [consultas])

  function refresh() {
    setModalOpen(false)
    setEditing(undefined)
    setVersion((v) => v + 1)
  }

  function handleSubmit(data: AppointmentInput) {
    const nome = patientsService.get(data.pacienteId)?.nome
    const detalhe = [nome, `${formatDate(data.data)} às ${data.inicio}`].filter(Boolean).join(' · ')
    try {
      if (editing) {
        appointmentsService.update(editing.id, data)
        anunciar('consulta', 'Consulta atualizada.', detalhe)
      } else {
        appointmentsService.create(data)
        anunciar('consulta', 'Consulta agendada.', detalhe)
      }
    } catch (e) {
      // conflito de horário: mantém o formulário aberto para o usuário corrigir
      toast.error(e instanceof Error ? e.message : 'Não foi possível salvar a consulta.')
      return
    }
    refresh()
  }

  function confirmDelete() {
    if (toDelete) {
      appointmentsService.remove(toDelete.id)
      const nome = patientsService.get(toDelete.pacienteId)?.nome
      anunciar('consulta', 'Consulta excluída.', [nome, `${formatDate(toDelete.data)} às ${toDelete.inicio}`].filter(Boolean).join(' · '))
      setToDelete(undefined)
      setVersion((v) => v + 1)
    }
  }

  function changeStatus(a: Appointment, status: AppointmentStatus) {
    try {
      appointmentsService.update(a.id, {
        pacienteId: a.pacienteId,
        data: a.data,
        inicio: a.inicio,
        fim: a.fim,
        procedimento: a.procedimento,
        status,
        observacao: a.observacao,
      })
    } catch (e) {
      // reativar uma consulta cancelada pode gerar conflito de horário
      toast.error(e instanceof Error ? e.message : 'Não foi possível alterar o status.')
      setStatusMenu(null)
      return
    }
    const nome = patientsService.get(a.pacienteId)?.nome
    anunciar('consulta', `Consulta marcada como "${APPT_STATUS_LABEL[status]}".`, [nome, `${formatDate(a.data)} às ${a.inicio}`].filter(Boolean).join(' · '))
    setStatusMenu(null)
    setVersion((v) => v + 1)
  }

  const selDate = fromYmd(selected)
  const tituloDia = selDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const mesAno = selDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* ----- Cabeçalho ----- */}
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

      {/* ----- Navegação por semana ----- */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <span className="text-sm font-semibold capitalize text-slate-700">{mesAno}</span>
          <div className="flex items-center gap-1">
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
        </div>
        <div className="grid grid-cols-7 gap-1 p-2">
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
                  'flex flex-col items-center gap-1 rounded-xl py-2.5 text-sm transition cursor-pointer',
                  isSel
                    ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-md shadow-brand-600/25'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                <span className={cn('text-[11px] font-medium', isSel ? 'text-brand-100' : 'text-slate-400')}>
                  {WEEKDAYS[dia.getDay()]}
                </span>
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full font-semibold tabular-nums',
                    !isSel && isHoje && 'bg-brand-50 text-brand-700 ring-1 ring-brand-300',
                  )}
                >
                  {dia.getDate()}
                </span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {n > 0 ? (
                    Array.from({ length: Math.min(n, 3) }).map((_, i) => (
                      <span
                        key={i}
                        className={cn('h-1.5 w-1.5 rounded-full', isSel ? 'bg-white/80' : 'bg-brand-400')}
                      />
                    ))
                  ) : (
                    <span className="h-1.5 w-1.5" />
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* ----- Cabeçalho do dia + resumo ----- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <CalendarDays size={18} />
          </span>
          <div>
            <h3 className="font-semibold capitalize leading-tight">{tituloDia}</h3>
            <p className="text-xs text-slate-400">
              {consultas.length} {consultas.length === 1 ? 'consulta agendada' : 'consultas agendadas'}
            </p>
          </div>
        </div>
        {consultas.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {STATUS_LIST.filter((s) => resumo[s]).map((s) => (
              <span
                key={s}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                  STATUS[s].chip,
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', STATUS[s].dot)} />
                {resumo[s]} {APPT_STATUS_LABEL[s]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ----- Lista de consultas (timeline) ----- */}
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
        <div className="space-y-2.5">
          {consultas.map((a) => {
            const paciente = patientsService.get(a.pacienteId)
            const st = STATUS[a.status]
            return (
              <Card
                key={a.id}
                className="group relative overflow-visible transition hover:shadow-md hover:-translate-y-px"
              >
                <span className={cn('absolute left-0 top-0 h-full w-1.5 rounded-l-xl', st.bar)} />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-4 pl-5 pr-3 sm:flex-nowrap sm:gap-4 sm:py-5 sm:pl-6 sm:pr-4">
                  {/* horário */}
                  <div className="flex w-16 shrink-0 flex-col items-center sm:w-20">
                    <span className="flex items-center gap-1 text-base font-bold text-slate-800">
                      <Clock size={14} className="text-slate-400" /> {a.inicio}
                    </span>
                    <span className="text-sm text-slate-400">{a.fim}</span>
                  </div>

                  <span className="hidden h-12 w-px shrink-0 bg-slate-100 sm:block" />

                  {/* paciente */}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 sm:h-14 sm:w-14 sm:text-sm">
                    {paciente ? initials(paciente.nome) : <User size={20} />}
                  </span>
                  <div className="min-w-[8rem] flex-1 sm:min-w-0">
                    {paciente ? (
                      <Link
                        to={`/pacientes/${paciente.id}`}
                        className="block truncate text-base font-semibold text-slate-800 hover:text-brand-600 sm:text-lg"
                      >
                        {paciente.nome}
                      </Link>
                    ) : (
                      <span className="text-base font-medium text-slate-400 sm:text-lg">Paciente removido</span>
                    )}
                    <p className="truncate text-sm text-slate-500">
                      {a.procedimento || 'Sem procedimento definido'}
                    </p>
                  </div>

                  {/* status (clique para trocar) */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setStatusMenu((id) => (id === a.id ? null : a.id))}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition hover:ring-2 hover:ring-slate-200 cursor-pointer',
                        st.chip,
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                      {APPT_STATUS_LABEL[a.status]}
                    </button>
                    {statusMenu === a.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setStatusMenu(null)} />
                        <div className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg sm:left-auto sm:right-0">
                          {STATUS_LIST.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => changeStatus(a, s)}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <span className={cn('h-2 w-2 rounded-full', STATUS[s].dot)} />
                              <span className="flex-1">{APPT_STATUS_LABEL[s]}</span>
                              {a.status === s && <Check size={14} className="text-brand-600" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* ações (sempre visíveis no touch; no desktop aparecem no hover) */}
                  <div className="flex shrink-0 items-center gap-1 transition sm:opacity-0 sm:group-hover:opacity-100">
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
                      onClick={() => setToDelete(a)}
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

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir consulta"
        description="Tem certeza que deseja excluir esta consulta? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(undefined)}
      />
    </div>
  )
}
