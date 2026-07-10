import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Users, Phone, Mail, Trash2, Pencil } from 'lucide-react'
import type { Patient } from '@/types'
import { patientsService, type PatientInput } from '@/services/patients'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { PatientForm } from './PatientForm'
import { formatDate, initials } from '@/lib/format'
import { anunciar } from '@/services/notifications'
import { toast } from '@/lib/toast'

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(() => patientsService.list())
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Patient | undefined>(undefined)
  const [toDelete, setToDelete] = useState<Patient | undefined>(undefined)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return patients
    return patients.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        p.cpf?.toLowerCase().includes(q) ||
        p.telefone?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q),
    )
  }, [patients, query])

  function refresh() {
    setPatients(patientsService.list())
  }

  function handleSubmit(data: PatientInput) {
    try {
      if (editing) {
        patientsService.update(editing.id, data)
        anunciar('paciente', 'Paciente atualizado.', data.nome)
      } else {
        patientsService.create(data)
        anunciar('paciente', 'Paciente cadastrado com sucesso.', data.nome)
      }
    } catch (e) {
      // duplicidade: mantém o formulário aberto para o usuário corrigir
      toast.error(e instanceof Error ? e.message : 'Não foi possível salvar o paciente.')
      return
    }
    setModalOpen(false)
    setEditing(undefined)
    refresh()
  }

  function confirmDelete() {
    if (toDelete) {
      patientsService.remove(toDelete.id)
      anunciar('paciente', 'Paciente removido.', toDelete.nome)
      setToDelete(undefined)
      refresh()
    }
  }

  function openNew() {
    setEditing(undefined)
    setModalOpen(true)
  }

  function openEdit(p: Patient) {
    setEditing(p)
    setModalOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Pacientes</h2>
          <p className="text-sm text-slate-500">{patients.length} cadastrados</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> Novo paciente
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, CPF, telefone ou e-mail"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title={query ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
          description={query ? 'Tente outro termo de busca.' : 'Comece cadastrando seu primeiro paciente.'}
          action={!query && <Button onClick={openNew}><Plus size={16} /> Cadastrar paciente</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id} className="flex flex-col p-4 transition hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {initials(p.nome)}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/pacientes/${p.id}`}
                    className="block truncate font-semibold text-slate-800 hover:text-brand-600"
                  >
                    {p.nome}
                  </Link>
                  <p className="truncate text-xs text-slate-400">
                    Cadastrado em {formatDate(p.criadoEm)}
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-500">
                {p.telefone && (
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" /> {p.telefone}
                  </p>
                )}
                {p.email && (
                  <p className="flex items-center gap-2 truncate">
                    <Mail size={14} className="text-slate-400" /> <span className="truncate">{p.email}</span>
                  </p>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                <Link to={`/pacientes/${p.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">
                    Abrir ficha
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => openEdit(p)} aria-label="Editar">
                  <Pencil size={15} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setToDelete(p)} aria-label="Remover">
                  <Trash2 size={15} className="text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(undefined)
        }}
        title={editing ? 'Editar paciente' : 'Novo paciente'}
        width="max-w-xl"
      >
        <PatientForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setEditing(undefined)
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Remover paciente"
        description={
          <>
            Remover o paciente <strong>{toDelete?.nome}</strong>? Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Remover"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(undefined)}
      />
    </div>
  )
}
