import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Stethoscope, Building2, CreditCard } from 'lucide-react'
import { userService, type Account, type DentistQuantity } from '@/services/user'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Input'
import { toast } from '@/lib/toast'
import { formatDate } from '@/lib/format'
import {
  maskCPF,
  maskCNPJ,
  maskPhone,
  maskCRO,
  isValidCPF,
  isValidCNPJ,
  isValidPhone,
  isValidCRO,
  isValidEmail,
  UF_LIST,
} from '@/lib/masks'

const QUANTITIES: { value: DentistQuantity; label: string }[] = [
  { value: '1', label: '1 dentista' },
  { value: '2-5', label: '2 a 5' },
  { value: '6-10', label: '6 a 10' },
  { value: '11-20', label: '11 a 20' },
  { value: '20+', label: 'Mais de 20' },
]

function initialForm(acc: Account | null) {
  return {
    name: acc?.name ?? '',
    email: acc?.email ?? '',
    phone: acc?.phone ?? '',
    cpf: acc?.cpf ?? '',
    cro: acc?.cro ?? '',
    croState: acc?.croState ?? '',
    specialty: acc?.specialty ?? '',
    professionalName: acc?.professionalName ?? '',
    cnpj: acc?.cnpj ?? '',
    responsible: acc?.responsible ?? '',
    address: acc?.address ?? '',
    city: acc?.city ?? '',
    state: acc?.state ?? '',
    dentistQuantity: (acc?.dentistQuantity ?? '') as DentistQuantity | '',
  }
}
type FormState = ReturnType<typeof initialForm>

export function ProfilePage() {
  const acc = userService.currentAccount()
  const [form, setForm] = useState<FormState>(() => initialForm(acc))
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const isDentist = acc?.accountType === 'dentist'

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {}
    const req = (v: string) => v.trim().length === 0
    if (isDentist ? form.name.trim().length < 3 : form.name.trim().length < 2)
      e.name = isDentist ? 'Informe o nome completo.' : 'Informe o nome da clínica.'
    if (req(form.email)) e.email = 'Informe o e-mail.'
    else if (!isValidEmail(form.email)) e.email = 'E-mail inválido.'
    if (req(form.phone)) e.phone = 'Informe o telefone.'
    else if (!isValidPhone(form.phone)) e.phone = 'Telefone incompleto.'

    if (isDentist) {
      if (req(form.cpf)) e.cpf = 'Informe o CPF.'
      else if (!isValidCPF(form.cpf)) e.cpf = 'CPF inválido.'
      if (!isValidCRO(form.cro)) e.cro = 'CRO inválido.'
      if (req(form.croState)) e.croState = 'UF do CRO.'
      if (form.specialty.trim().length < 2) e.specialty = 'Informe a especialidade.'
    } else {
      if (req(form.cnpj)) e.cnpj = 'Informe o CNPJ.'
      else if (!isValidCNPJ(form.cnpj)) e.cnpj = 'CNPJ inválido.'
      if (form.responsible.trim().length < 3) e.responsible = 'Informe o responsável.'
      if (form.address.trim().length < 3) e.address = 'Informe o endereço.'
      if (form.city.trim().length < 2) e.city = 'Informe a cidade.'
      if (req(form.state)) e.state = 'UF.'
      if (!form.dentistQuantity) e.dentistQuantity = 'Selecione a faixa.'
    }
    return e
  }, [form, isDentist])

  const err = (k: keyof FormState) => (submitted ? errors[k] : undefined)

  if (!acc) {
    return <p className="text-sm text-slate-500">Sessão não encontrada. Faça login novamente.</p>
  }

  // visitante (conta demo) não tem acesso à edição de perfil
  if (acc.isGuest) {
    return <Navigate to="/" replace />
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      toast.error('Confira os campos destacados.')
      return
    }
    setSaving(true)
    setTimeout(() => {
      const patch: Partial<Account> = isDentist
        ? {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            cpf: form.cpf,
            cro: form.cro,
            croState: form.croState,
            specialty: form.specialty.trim(),
            professionalName: form.professionalName.trim() || undefined,
          }
        : {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            cnpj: form.cnpj,
            responsible: form.responsible.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            state: form.state,
            dentistQuantity: form.dentistQuantity as DentistQuantity,
          }
      userService.save(patch)
      setSaving(false)
      toast.success('Perfil atualizado.')
    }, 400)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* cabeçalho */}
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          {isDentist ? <Stethoscope size={22} /> : <Building2 size={22} />}
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Meu perfil</h2>
          <p className="text-sm text-slate-500">
            Conta {isDentist ? 'de dentista' : 'de clínica'} · criada em {formatDate(acc.createdAt)}
          </p>
        </div>
      </div>

      <form onSubmit={salvar} className="space-y-6">
        <Card className="space-y-4 p-6">
          <h3 className="text-sm font-semibold text-slate-800">
            {isDentist ? 'Dados do profissional' : 'Dados da clínica'}
          </h3>

          <Field label={isDentist ? 'Nome completo' : 'Nome da clínica'} error={err('name')}>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} error={!!err('name')} />
          </Field>

          {isDentist ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="CPF" error={err('cpf')}>
                  <Input value={form.cpf} onChange={(e) => set('cpf', maskCPF(e.target.value))} inputMode="numeric" error={!!err('cpf')} />
                </Field>
                <Field label="Especialidade" error={err('specialty')}>
                  <Input value={form.specialty} onChange={(e) => set('specialty', e.target.value)} error={!!err('specialty')} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="CRO" error={err('cro')}>
                  <Input value={form.cro} onChange={(e) => set('cro', maskCRO(e.target.value))} inputMode="numeric" error={!!err('cro')} />
                </Field>
                <Field label="UF do CRO" error={err('croState')}>
                  <Select value={form.croState} onChange={(e) => set('croState', e.target.value)} error={!!err('croState')}>
                    <option value="">—</option>
                    {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </Select>
                </Field>
                <Field label="Nome profissional" hint="Opcional">
                  <Input value={form.professionalName} onChange={(e) => set('professionalName', e.target.value)} />
                </Field>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="CNPJ" error={err('cnpj')}>
                  <Input value={form.cnpj} onChange={(e) => set('cnpj', maskCNPJ(e.target.value))} inputMode="numeric" error={!!err('cnpj')} />
                </Field>
                <Field label="Responsável" error={err('responsible')}>
                  <Input value={form.responsible} onChange={(e) => set('responsible', e.target.value)} error={!!err('responsible')} />
                </Field>
              </div>
              <Field label="Endereço" error={err('address')}>
                <Input value={form.address} onChange={(e) => set('address', e.target.value)} error={!!err('address')} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Cidade" error={err('city')}>
                  <Input value={form.city} onChange={(e) => set('city', e.target.value)} error={!!err('city')} />
                </Field>
                <Field label="UF" error={err('state')}>
                  <Select value={form.state} onChange={(e) => set('state', e.target.value)} error={!!err('state')}>
                    <option value="">—</option>
                    {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </Select>
                </Field>
                <Field label="Dentistas" error={err('dentistQuantity')}>
                  <Select value={form.dentistQuantity} onChange={(e) => set('dentistQuantity', e.target.value)} error={!!err('dentistQuantity')}>
                    <option value="">—</option>
                    {QUANTITIES.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
                  </Select>
                </Field>
              </div>
            </>
          )}
        </Card>

        <Card className="space-y-4 p-6">
          <h3 className="text-sm font-semibold text-slate-800">Contato e acesso</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-mail" error={err('email')}>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={!!err('email')} />
            </Field>
            <Field label="Telefone" error={err('phone')}>
              <Input value={form.phone} onChange={(e) => set('phone', maskPhone(e.target.value))} inputMode="numeric" error={!!err('phone')} />
            </Field>
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </div>
      </form>

      {/* assinatura (somente leitura) */}
      <Card className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <CreditCard size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">Assinatura</p>
            {acc.subscription ? (
              <p className="text-sm text-slate-500">
                Plano {acc.subscription.planName} · {acc.subscription.cycle === 'anual' ? 'Anual' : 'Mensal'} ·
                renova em {formatDate(acc.subscription.renewsAt)}
              </p>
            ) : (
              <p className="text-sm text-slate-500">Nenhuma assinatura ativa.</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
