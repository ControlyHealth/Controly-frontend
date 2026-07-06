/**
 * Máscaras e validações de documentos/telefone (pt-BR).
 *
 * As funções `mask*` recebem o valor bruto do input e devolvem o texto
 * formatado — use no `onChange` para máscara em tempo real.
 * As funções `isValid*` validam o conteúdo (dígitos verificadores etc.).
 */

const onlyDigits = (v: string) => v.replace(/\D/g, '')

/** CPF: 000.000.000-00 */
export function maskCPF(v: string): string {
  const d = onlyDigits(v).slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

/** CNPJ: 00.000.000/0000-00 */
export function maskCNPJ(v: string): string {
  const d = onlyDigits(v).slice(0, 14)
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

/** Telefone: (00) 00000-0000 ou (00) 0000-0000 */
export function maskPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 11)
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }
  return d
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

/** CRO: apenas dígitos (o número do conselho; a UF é um campo separado). */
export function maskCRO(v: string): string {
  return onlyDigits(v).slice(0, 6)
}

/** Valida CPF pelos dígitos verificadores. */
export function isValidCPF(v: string): boolean {
  const d = onlyDigits(v)
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const calc = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i)
    const r = (sum * 10) % 11
    return r === 10 ? 0 : r
  }
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10])
}

/** Valida CNPJ pelos dígitos verificadores. */
export function isValidCNPJ(v: string): boolean {
  const d = onlyDigits(v)
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false
  const calc = (len: number) => {
    const nums = d.slice(0, len)
    let pos = len - 7
    let sum = 0
    for (let i = 0; i < len; i++) {
      sum += Number(nums[i]) * pos--
      if (pos < 2) pos = 9
    }
    const r = sum % 11
    return r < 2 ? 0 : 11 - r
  }
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13])
}

/** Telefone brasileiro com DDD (10 ou 11 dígitos). */
export function isValidPhone(v: string): boolean {
  const d = onlyDigits(v)
  return d.length === 10 || d.length === 11
}

/** CRO: 2 a 6 dígitos. */
export function isValidCRO(v: string): boolean {
  const d = onlyDigits(v)
  return d.length >= 2 && d.length <= 6
}

/** E-mail simples. */
export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

/** UFs brasileiras. */
export const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const
