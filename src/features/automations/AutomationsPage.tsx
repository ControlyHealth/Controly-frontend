import { useState } from 'react'
import { Plus, Bot, MessageCircle, Pencil, Trash2, Zap, Circle, CircleDot } from 'lucide-react'
import type { Automation } from '@/types'
import { automationsService, type AutomationInput } from '@/services/automations'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { AutomationForm } from './AutomationForm'
import { TRIGGER_LABELS } from './triggers'

export function AutomationsPage() {
  const [items, setItems] = useState<Automation[]>(() => automationsService.list())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Automation | undefined>(undefined)
  const [toDelete, setToDelete] = useState<Automation | undefined>(undefined)

  function confirmDelete() {
    if (toDelete) {
      automationsService.remove(toDelete.id)
      setToDelete(undefined)
      refresh()
    }
  }

  function refresh() {
    setItems(automationsService.list())
  }

  function handleSubmit(data: AutomationInput) {
    if (editing) automationsService.update(editing.id, data)
    else automationsService.create(data)
    setModalOpen(false)
    setEditing(undefined)
    refresh()
  }

  const ativos = items.filter((i) => i.ativo).length

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Automações via WhatsApp</h2>
          <p className="text-sm text-slate-500">
            {items.length} fluxos · {ativos} ativos
          </p>
        </div>
        <Button onClick={() => { setEditing(undefined); setModalOpen(true) }}>
          <Plus size={16} /> Nova automação
        </Button>
      </div>

      <Card className="flex items-start gap-3 border-green-100 bg-green-50/60 p-4">
        <MessageCircle className="mt-0.5 shrink-0 text-green-600" size={20} />
        <p className="text-sm text-green-800">
          Conecte um número de WhatsApp Business para disparar estas mensagens automaticamente.
          Por enquanto os fluxos ficam salvos localmente como rascunho da clínica.
        </p>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={<Bot size={40} />}
          title="Nenhuma automação criada"
          description="Crie fluxos para lembrar pacientes, fazer pós-atendimento e reativar retornos."
          action={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Criar automação</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((a) => (
            <Card key={a.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Zap size={16} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">{a.nome}</p>
                    <p className="text-xs text-slate-400">{TRIGGER_LABELS[a.gatilho]}</p>
                  </div>
                </div>
                <button
                  onClick={() => { automationsService.toggle(a.id); refresh() }}
                  className={
                    'relative h-6 w-11 shrink-0 rounded-full transition cursor-pointer ' +
                    (a.ativo ? 'bg-green-500' : 'bg-slate-300')
                  }
                  aria-label={a.ativo ? 'Desativar' : 'Ativar'}
                >
                  <span
                    className={
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ' +
                      (a.ativo ? 'left-5.5' : 'left-0.5')
                    }
                  />
                </button>
              </div>
              <p className="mt-3 flex-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                {a.mensagem}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className={'flex items-center gap-1.5 text-xs font-medium ' + (a.ativo ? 'text-green-600' : 'text-slate-400')}>
                  {a.ativo ? <CircleDot size={13} /> : <Circle size={13} />}
                  {a.ativo ? 'Ativa' : 'Inativa'}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(a); setModalOpen(true) }}>
                    <Pencil size={15} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setToDelete(a)}>
                    <Trash2 size={15} className="text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(undefined) }}
        title={editing ? 'Editar automação' : 'Nova automação'}
        width="max-w-xl"
      >
        <AutomationForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(undefined) }}
        />
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Remover automação"
        description={
          <>
            Remover a automação <strong>{toDelete?.nome}</strong>?
          </>
        }
        confirmLabel="Remover"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(undefined)}
      />
    </div>
  )
}
